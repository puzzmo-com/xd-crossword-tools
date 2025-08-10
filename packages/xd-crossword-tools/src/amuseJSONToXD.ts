import { JSONToXD } from "./JSONtoXD"
import type { Clue, Position as CluePosition, CrosswordJSON } from "xd-crossword-tools-parser"
import { cleanupClueMetadata } from "./cleanupClueMetadata"

import type { CellInfo, PlacedWord, AmuseTopLevel } from "./amuseJSONToXD.types.d.ts"

/** Convert an Amuse JSON to an XD file. */
export const amuseToXD = (amuseJSON: AmuseTopLevel) => JSONToXD(convertAmuseToCrosswordJSON(amuseJSON))

type Clues = CrosswordJSON["clues"]
type Meta = CrosswordJSON["meta"]
type Tiles = CrosswordJSON["tiles"]
type Tile = Tiles[number][number]

export function convertAmuseToCrosswordJSON(amuseJson: AmuseTopLevel): CrosswordJSON {
  const { attributes } = amuseJson.data
  const amuseData = attributes.amuse_data // amuseData is of type AmuseData

  if (amuseData.puzzleType !== "CROSSWORD") {
    console.warn("Input puzzleType is not CROSSWORD, conversion might be inaccurate.")
  }

  const meta: Meta = {
    title: amuseData.title || "Untitled Crossword",
    author: amuseData.author || "Unknown Author",
    date: formatDate(amuseData.publishTime),
    // copyright: amuseData.copyright === Copyright.Empty ? "" : amuseData.copyright,
    // notes: stripHtml(amuseData.help) + (amuseData.endMessage ? "\n\n" + stripHtml(amuseData.endMessage) : ""),
    width: amuseData.w.toString(),
    height: amuseData.h.toString(),
    editor: "not in data",
    id: attributes.amuse_id || amuseData.id,
  }

  // Tiles - using row-major order [y][x]
  const tiles: Tile[][] = Array(amuseData.h)
    .fill(null)
    .map(() => Array(amuseData.w).fill(null))

  const cellInfoMap = new Map<string, CellInfo>()
  if (amuseData.cellInfos) {
    for (const cellInfo of amuseData.cellInfos) {
      cellInfoMap.set(`${cellInfo.y}-${cellInfo.x}`, cellInfo)
    }
  }

  // Track circled cells and bars for design section
  const hasCircledCells = amuseData.cellInfos?.some((cell) => cell.isCircled) || false
  const hasBars = amuseData.cellInfos?.some((cell) => cell.rightWall || cell.bottomWall) || false
  const needsDesign = hasCircledCells || hasBars

  let designPositions: string[][] | undefined = undefined
  let designStyles: Record<string, Record<string, string>> = {}
  let barDesignMap: Map<string, Set<string>> = new Map() // Map of "y-x" to Set of design flags

  if (needsDesign) {
    designPositions = Array(amuseData.h)
      .fill(null)
      .map(() => Array(amuseData.w).fill(null))
  }

  // First pass: create tiles and track walls
  for (let y = 0; y < amuseData.h; y++) {
    for (let x = 0; x < amuseData.w; x++) {
      const letterFromBox = amuseData.box[y]?.[x] as string | null
      const clueNumString = amuseData.clueNums[y]?.[x]
      const cellKey = `${y}-${x}`
      const specificCellInfo = cellInfoMap.get(cellKey)

      if (letterFromBox === null || letterFromBox === "." || letterFromBox === "#") {
        tiles[y][x] = { type: "blank" }
      } else {
        tiles[y][x] = {
          type: "letter",
          letter: letterFromBox || "",
          clues: {
            across: clueNumString ? parseInt(clueNumString) : undefined,
            down: clueNumString ? parseInt(clueNumString) : undefined,
          },
        }
      }

      // Track circled cells in design positions
      if (designPositions && specificCellInfo?.isCircled) {
        designPositions[y][x] = "O"
        designStyles["O"] = { background: "circle" }
      }

      // Convert walls to bars
      if (specificCellInfo) {
        // rightWall on (x,y) means bar-left on (x+1,y)
        if (specificCellInfo.rightWall && x + 1 < amuseData.w) {
          const targetKey = `${y}-${x + 1}`
          if (!barDesignMap.has(targetKey)) {
            barDesignMap.set(targetKey, new Set())
          }
          barDesignMap.get(targetKey)!.add("bar-left")
        }

        // bottomWall on (x,y) means bar-top on (x,y+1)
        if (specificCellInfo.bottomWall && y + 1 < amuseData.h) {
          const targetKey = `${y + 1}-${x}`
          if (!barDesignMap.has(targetKey)) {
            barDesignMap.set(targetKey, new Set())
          }
          barDesignMap.get(targetKey)!.add("bar-top")
        }
      }
    }
  }

  // Second pass: apply bar designs to tiles and design positions
  if (hasBars && designPositions) {
    // We'll use letters to represent different bar combinations
    const barStyles: Map<string, string[]> = new Map()
    let nextBarLetter = 65 // ASCII 'A'

    for (const [cellKey, designFlags] of barDesignMap) {
      const [yStr, xStr] = cellKey.split("-")
      const y = parseInt(yStr)
      const x = parseInt(xStr)

      // Skip if this is a blank tile
      if (tiles[y][x].type === "blank") continue

      // Create a unique style key for this combination of bars
      const sortedFlags = Array.from(designFlags).sort()
      const styleKey = sortedFlags.join("|")

      let styleLetter: string
      if (!barStyles.has(styleKey)) {
        styleLetter = String.fromCharCode(nextBarLetter++)
        barStyles.set(styleKey, sortedFlags)

        // Add to design styles
        const styleObj: Record<string, string> = {}
        if (sortedFlags.includes("bar-left")) styleObj["bar-left"] = "true"
        if (sortedFlags.includes("bar-top")) styleObj["bar-top"] = "true"
        designStyles[styleLetter] = styleObj
      } else {
        // Find the letter for this style combination
        styleLetter = Array.from(barStyles.entries())
          .find(([key]) => key === styleKey)![1]
          .map(() => String.fromCharCode(nextBarLetter - barStyles.size + Array.from(barStyles.keys()).indexOf(styleKey)))[0]
      }

      // Mark this position in the design grid
      if (!designPositions[y][x]) {
        // Find or create the appropriate letter for this bar combination
        for (const [letter, style] of Object.entries(designStyles)) {
          const hasBarLeft = style["bar-left"] === "true"
          const hasBarTop = style["bar-top"] === "true"
          const wantsBarLeft = sortedFlags.includes("bar-left")
          const wantsBarTop = sortedFlags.includes("bar-top")

          if (hasBarLeft === wantsBarLeft && hasBarTop === wantsBarTop && letter !== "O") {
            designPositions[y][x] = letter
            break
          }
        }

        // If we didn't find a matching style, create a new one
        if (!designPositions[y][x]) {
          const newLetter = String.fromCharCode(Object.keys(designStyles).filter((k) => k !== "O").length + 65)
          const styleObj: Record<string, string> = {}
          if (sortedFlags.includes("bar-left")) styleObj["bar-left"] = "true"
          if (sortedFlags.includes("bar-top")) styleObj["bar-top"] = "true"
          designStyles[newLetter] = styleObj
          designPositions[y][x] = newLetter
        }
      }
    }
  }

  // Clues
  const cluesStructure: Clues = { across: [], down: [] }
  const cluePositionsMap: Record<string, CluePosition> = {}

  amuseData.placedWords.forEach((placedWord: PlacedWord) => {
    const direction = placedWord.acrossNotDown ? "across" : "down"
    const clueText = stripHtml(placedWord.clue.clue)
    const answer = placedWord.word || ""
    const clueNumberStr = placedWord.clueNum // This is already a string from AmuseData

    const currentClue: Clue = {
      number: parseInt(clueNumberStr),
      body: clueText,
      answer: answer,
      tiles: [],
      direction: direction,
      display: [],
      position: {
        col: placedWord.x,
        index: placedWord.y,
      },
      // Add revealer metadata if refText exists
      ...(placedWord.clue.refText
        ? {
            metadata: {
              revealer: placedWord.clue.refText,
            },
          }
        : {}),
    }

    const clueId = `${clueNumberStr}-${direction}`

    const positionData: CluePosition = {
      col: placedWord.x,
      index: placedWord.y,
    }

    currentClue.position = positionData
    cluePositionsMap[clueId] = positionData

    if (direction === "across") {
      cluesStructure.across.push(currentClue)
    } else {
      cluesStructure.down.push(currentClue)
    }
  })

  const result: CrosswordJSON = {
    tiles,
    clues: cluesStructure,
    meta: meta,
    notes: "",
    rebuses: {},
    unknownSections: {},
    report: {
      success: true,
      errors: [],
      warnings: [],
    },
    // Add design section if there are circled cells or bars
    ...(designPositions
      ? {
          design: {
            styles: designStyles,
            positions: designPositions,
          },
        }
      : {}),
  }

  cleanupClueMetadata(result)

  return result
}

// I think we may want to keep the raw HTML in here as a section, or convert it to the xd spec
// where we use { }
function stripHtml(html: string | undefined): string {
  if (!html) return ""
  if (typeof DOMParser === "undefined") {
    return html.replace(/<[^>]*>?/gm, "")
  }
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent || ""
}

function formatDate(timestamp: number | undefined): string {
  if (timestamp === undefined) return ""
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}
