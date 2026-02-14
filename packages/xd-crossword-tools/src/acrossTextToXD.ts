import { getCluePositionsForBoard } from "xd-crossword-tools-parser"
import type { Tile } from "xd-crossword-tools-parser"
import { makeGetNewRebusSymbol } from "./utils/rebusSymbols"

interface ParsedAcrossText {
  version: 1 | 2
  title: string
  author: string
  copyright: string
  size: { cols: number; rows: number }
  grid: string[]
  rebus?: {
    hasMark: boolean
    markers: Map<string, { extended: string; short: string }>
  }
  acrossClues: string[]
  downClues: string[]
  notepad: string
}

/** Takes an Across Text format string and converts it to XD format */
export function acrossTextToXD(textContent: string): string {
  const parsed = parseAcrossText(textContent)

  // Build rebus maps if needed
  let rebusSymbolMap = new Map<string, string>() // marker -> symbol (e.g., "1" -> "❶")
  let rebuses: Record<string, string> = {} // symbol -> word (e.g., "❶" -> "ESP")
  let circledPositions = new Set<string>() // "row,col" for circled cells

  if (parsed.rebus && parsed.rebus.markers.size > 0) {
    const getNewRebusSymbol = makeGetNewRebusSymbol()
    parsed.rebus.markers.forEach((value, marker) => {
      const symbol = getNewRebusSymbol()
      rebusSymbolMap.set(marker, symbol)
      rebuses[symbol] = value.extended
    })
  }

  // Convert grid to tiles
  const tiles: Tile[][] = parsed.grid.map((row, rowIndex) =>
    row.split("").map((char, colIndex) => {
      // Black square
      if (char === "." || char === ":") {
        return { type: "blank" } as Tile
      }

      // Check if this is a rebus marker
      if (parsed.rebus && isRebusMarker(char)) {
        const symbol = rebusSymbolMap.get(char)
        if (symbol) {
          const rebusData = parsed.rebus.markers.get(char)
          return {
            type: "rebus",
            symbol,
            word: rebusData!.extended,
            clues: {},
          } as Tile
        }
      }

      // Check if this is a lowercase letter with MARK flag (circled)
      if (parsed.rebus?.hasMark && char >= "a" && char <= "z") {
        circledPositions.add(`${rowIndex},${colIndex}`)
        return {
          type: "letter",
          letter: char.toUpperCase(),
          clues: {},
        } as Tile
      }

      // Regular letter
      return {
        type: "letter",
        letter: char.toUpperCase(),
        clues: {},
      } as Tile
    }),
  )

  // Get clue positions from the board
  const cluePositions = getCluePositionsForBoard(tiles, undefined, undefined)

  // Build clues
  const acrossClues: string[] = []
  const downClues: string[] = []

  let acrossIndex = 0
  let downIndex = 0

  cluePositions.forEach((posInfo, index) => {
    const hasAcross = posInfo.tiles.across && posInfo.tiles.across.length > 0
    const hasDown = posInfo.tiles.down && posInfo.tiles.down.length > 0

    if (hasAcross) {
      const answer = posInfo.tiles.across!.map(answerStringForTile).join("")
      const clueText = parsed.acrossClues[acrossIndex] || ""
      // cluePositions array is 1-indexed (has dummy at position 0)
      acrossClues.push(`A${index}. ${clueText} ~ ${answer}`)
      acrossIndex++
    }

    if (hasDown) {
      const answer = posInfo.tiles.down!.map(answerStringForTile).join("")
      const clueText = parsed.downClues[downIndex] || ""
      // cluePositions array is 1-indexed (has dummy at position 0)
      downClues.push(`D${index}. ${clueText} ~ ${answer}`)
      downIndex++
    }
  })

  // Build metadata
  const meta: string[] = []
  if (parsed.title) meta.push(`title: ${parsed.title}`)
  if (parsed.author) meta.push(`author: ${parsed.author}`)
  if (parsed.copyright) meta.push(`copyright: ${parsed.copyright}`)

  // Add rebus metadata if present
  if (Object.keys(rebuses).length > 0) {
    let rebusLine = "rebus:"
    Object.entries(rebuses).forEach(([symbol, word]) => {
      rebusLine += ` ${symbol}=${word}`
    })
    meta.push(rebusLine)
  }

  // Build grid string
  let gridString = ""
  tiles.forEach((row) => {
    row.forEach((tile) => {
      if (tile.type === "blank") {
        gridString += "#"
      } else if (tile.type === "letter") {
        gridString += tile.letter
      } else if (tile.type === "rebus") {
        gridString += tile.symbol
      }
    })
    gridString += "\n"
  })

  // Build design section if there are circled cells
  let designSection = ""
  if (circledPositions.size > 0) {
    meta.push("O { background: circle }")
    let designGrid = ""
    tiles.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (circledPositions.has(`${rowIndex},${colIndex}`)) {
          designGrid += "O"
        } else if (tile.type === "blank") {
          designGrid += "#"
        } else {
          designGrid += "."
        }
      })
      designGrid += "\n"
    })
    designSection = `\n\n## Design\n\n<style>O { background: circle }</style>\n\n${designGrid}`
  }

  // Build XD string
  const xd = `## Metadata

${meta.join("\n")}

## Grid

${gridString}

## Clues

${acrossClues.join("\n")}

${downClues.join("\n")}${parsed.notepad ? `\n\n## Notes\n\n${parsed.notepad}` : ""}${designSection}`

  return xd
}

function parseAcrossText(text: string): ParsedAcrossText {
  // Normalize line endings - handle \r\n (Windows), \r (old Mac), and \n (Unix)
  // Convert all to \n for consistent parsing
  let normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  const lines = normalizedText.split("\n")
  let currentSection = ""
  const result: ParsedAcrossText = {
    version: 1,
    title: "",
    author: "",
    copyright: "",
    size: { cols: 0, rows: 0 },
    grid: [],
    acrossClues: [],
    downClues: [],
    notepad: "",
  }

  let sectionContent: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Check for section headers
    if (trimmed.startsWith("<")) {
      // Process previous section
      if (currentSection) {
        processSection(currentSection, sectionContent, result)
      }

      // Start new section
      currentSection = trimmed.replace(/[<>]/g, "").toUpperCase()
      sectionContent = []

      // Check version
      if (currentSection === "ACROSS PUZZLE V2") {
        result.version = 2
        currentSection = "HEADER"
      } else if (currentSection === "ACROSS PUZZLE") {
        result.version = 1
        currentSection = "HEADER"
      }
    } else if (currentSection && currentSection !== "HEADER") {
      // Add content to current section (preserve line for notepad)
      if (currentSection === "NOTEPAD") {
        sectionContent.push(line)
      } else {
        sectionContent.push(trimmed)
      }
    }
  }

  // Process final section
  if (currentSection) {
    processSection(currentSection, sectionContent, result)
  }

  return result
}

function processSection(section: string, content: string[], result: ParsedAcrossText) {
  // For NOTEPAD, preserve all content including empty lines
  // For other sections, filter out empty lines
  const cleanContent = section === "NOTEPAD" ? content : content.filter((line) => line.length > 0)

  switch (section) {
    case "TITLE":
      result.title = cleanContent[0] || ""
      break
    case "AUTHOR":
      result.author = cleanContent[0] || ""
      break
    case "COPYRIGHT":
      result.copyright = cleanContent[0] || ""
      break
    case "SIZE":
      const sizeMatch = cleanContent[0]?.match(/(\d+)x(\d+)/i)
      if (sizeMatch) {
        result.size = { cols: parseInt(sizeMatch[1]), rows: parseInt(sizeMatch[2]) }
      }
      break
    case "GRID":
      result.grid = cleanContent
      break
    case "REBUS":
      if (cleanContent.length > 0) {
        result.rebus = parseRebusSection(cleanContent)
      }
      break
    case "ACROSS":
      result.acrossClues = cleanContent
      break
    case "DOWN":
      result.downClues = cleanContent
      break
    case "NOTEPAD":
      // Join all content, even if empty
      result.notepad = content.join("\n").trim()
      break
  }
}

function parseRebusSection(lines: string[]): {
  hasMark: boolean
  markers: Map<string, { extended: string; short: string }>
} {
  const result = {
    hasMark: false,
    markers: new Map<string, { extended: string; short: string }>(),
  }

  for (const line of lines) {
    // Check for MARK flag
    if (line.toUpperCase().includes("MARK;")) {
      result.hasMark = true
      continue
    }

    // Parse marker lines: marker:extended:short
    const parts = line.split(":")
    if (parts.length === 3) {
      const marker = parts[0].trim()
      const extended = parts[1].trim()
      const short = parts[2].trim()

      result.markers.set(marker, { extended, short })
    }
  }

  return result
}

function isRebusMarker(char: string): boolean {
  // Numbers 0-9
  if (char >= "0" && char <= "9") return true
  // Lowercase letters a-z (only if not MARK flag, but we check that separately)
  if (char >= "a" && char <= "z") return true
  // Special characters
  if ("@#$%&+?".includes(char)) return true
  return false
}

function answerStringForTile(tile: Tile): string {
  switch (tile.type) {
    case "blank":
      return ""
    case "letter":
      return tile.letter
    case "rebus":
      return tile.word
    default:
      return ""
  }
}
