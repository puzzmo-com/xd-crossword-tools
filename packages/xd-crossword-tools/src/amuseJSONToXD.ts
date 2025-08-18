import { JSONToXD } from "./JSONtoXD"
import type { Clue, Position as CluePosition, CrosswordJSON, Report } from "xd-crossword-tools-parser"

import type { CellInfo, PlacedWord, AmuseTopLevel } from "./amuseJSONToXD.types.d.ts"
import { doesNotReject } from "assert"

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
    subtitle: amuseData.subtitle,
    author: amuseData.author || "Unknown Author",
    date: formatDate(amuseData.publishTime),
    // copyright: amuseData.copyright === Copyright.Empty ? "" : amuseData.copyright,
    // notes: stripHtml(amuseData.help) + (amuseData.endMessage ? "\n\n" + stripHtml(amuseData.endMessage) : ""),
    width: amuseData.w.toString(),
    height: amuseData.h.toString(),
    editor: "not in data",

    id: amuseData.id,
    amuseID: attributes.amuse_id,
    set: attributes.amuse_set,
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
  if (hasBars) meta.form = "barred"
  const needsDesign = hasCircledCells || hasBars

  let designPositions: string[][] | undefined = undefined
  let designStyles: Record<string, Record<string, string>> = {}
  let barDesignMap: Map<string, Set<string>> = new Map() // Map of "y-x" to Set of design flags

  if (needsDesign) {
    designPositions = Array(amuseData.h)
      .fill(null)
      .map(() => Array(amuseData.w).fill(null))
  }

  const rebuses: CrosswordJSON["rebuses"] = {}
  let rebusSymbolCharCode = 9424

  // First pass: create tiles and track walls
  // Note: The Amuse box data appears to be transposed compared to our internal format
  // We need to swap x and y when accessing the box data
  for (let y = 0; y < amuseData.h; y++) {
    for (let x = 0; x < amuseData.w; x++) {
      const letterFromBox = amuseData.box[x]?.[y] as string | null
      const clueNumString = amuseData.clueNums[x]?.[y]
      const cellKey = `${y}-${x}`
      const specificCellInfo = cellInfoMap.get(cellKey)

      if (letterFromBox === null || letterFromBox === "." || letterFromBox === "#") {
        tiles[y][x] = { type: "blank" }
      } else {
        const clues = {
          across: clueNumString ? parseInt(clueNumString) : undefined,
          down: clueNumString ? parseInt(clueNumString) : undefined,
        }

        if (letterFromBox.includes("/")) {
          tiles[y][x] = {
            type: "schrodinger",
            validLetters: letterFromBox.split("/"),
            validRebuses: [],
            clues,
          }
        } else if (letterFromBox.length > 1) {
          const symbol = String.fromCharCode(rebusSymbolCharCode++)

          tiles[y][x] = {
            type: "rebus",
            word: letterFromBox,
            symbol,
            clues,
          }

          rebuses[symbol] = letterFromBox
        } else {
          tiles[y][x] = {
            type: "letter",
            letter: letterFromBox || "",
            clues,
          }
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

  const errorReports: Report[] = []

  amuseData.placedWords.forEach((placedWord: PlacedWord) => {
    let direction: "across" | "down" | null = null

    // I think different ages of amuse json's have different data structures,
    // as one crossword we have does not include "clueSection" - so we fall back to "acrossNotDown"
    if (placedWord.clueSection) direction = placedWord.clueSection === "Across" ? "across" : "down"
    if ("acrossNotDown" in placedWord && !direction) direction = placedWord.acrossNotDown ? "across" : "down"
    if (!direction) {
      errorReports.push({
        type: "syntax",
        message: `Could not determine a direction for placed word ${placedWord.word}.`,
        length: -1,
        position: {
          col: placedWord.x,
          index: placedWord.y,
        },
      })
      return
    }

    const clueText = convertHtmlToXdMarkup(placedWord.clue.clue)
    const clueNumberStr = placedWord.clueNum // This is already a string from AmuseData
    const word = placedWord.word || placedWord.originalTerm || ""
    let answer
    let alt

    // schrodinger handling
    if (word.includes("/")) {
      let firstSchrodingerAnswer = word
      let secondSchrodingerAnswer = word

      for (const match of word.matchAll(/({.\/.})/g)) {
        firstSchrodingerAnswer = firstSchrodingerAnswer.replace(match[0], match[0][1])
        secondSchrodingerAnswer = secondSchrodingerAnswer.replace(match[0], match[0][3])
      }

      answer = firstSchrodingerAnswer
      alt = secondSchrodingerAnswer
      // rebus handling
    } else if (word.includes("{") && word.includes("}")) {
      answer = word.replace(/{/g, "").replace(/}/g, "")
    } else {
      answer = word
    }

    const currentClue: Clue = {
      number: parseInt(clueNumberStr),
      body: clueText,
      answer: answer,
      tiles: [],
      direction,
      display: [],
      position: {
        col: placedWord.x,
        index: placedWord.y,
      },
      metadata: {},
    }

    // add alt metadata for schrodinger clues
    if (alt && currentClue.metadata) {
      currentClue.metadata.alt = alt
    }

    // Add revealer metadata if refText exists
    if (currentClue.metadata && placedWord.clue.refText) {
      currentClue.metadata.revealer = convertHtmlToXdMarkup(placedWord.clue.refText)
    }

    const clueID = `${clueNumberStr}-${direction}`

    const positionData: CluePosition = {
      col: placedWord.x,
      index: placedWord.y,
    }

    currentClue.position = positionData
    cluePositionsMap[clueID] = positionData

    if (direction === "across") {
      cluesStructure.across.push(currentClue)
    } else {
      cluesStructure.down.push(currentClue)
    }
  })
  cluesStructure.across.sort((a: Clue, b: Clue) => a.number - b.number)
  cluesStructure.down.sort((a: Clue, b: Clue) => a.number - b.number)

  // Prepare unknown sections for HTML content
  const unknownSections: Record<string, { title: string; content: string }> = {}

  if (amuseData.description && amuseData.description.trim()) {
    unknownSections["description"] = { title: "Description", content: amuseData.description }
  }

  if (amuseData.help && amuseData.help.trim()) {
    unknownSections["help"] = { title: "Help", content: amuseData.help }
  }

  if (amuseData.pauseMessage && amuseData.pauseMessage.trim()) {
    unknownSections["pausemessage"] = { title: "Pause Message", content: amuseData.pauseMessage }
  }

  if (amuseData.endMessage && amuseData.endMessage.trim()) {
    unknownSections["endmessage"] = { title: "End Message", content: amuseData.endMessage }
  }

  // rebus handling
  const metaRebus = Object.entries(rebuses)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ")

  if (metaRebus.length) {
    meta.rebus = metaRebus
  }

  const result: CrosswordJSON = {
    tiles,
    clues: cluesStructure,
    meta: meta,
    notes: "",
    rebuses,
    unknownSections: unknownSections,
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

  return result
}

/**
 * Converts HTML to XD markup format
 * Supported conversions:
 * - <i>, <em> → {/text/}
 * - <b>, <strong> → {*text*}
 * - <u> → {_text_}
 * - <s>, <strike>, <del> → {-text-}
 * - <a href="url">text</a> → {@text|url@}
 * - <span> tags are removed (unwrapped)
 * - Unsupported tags cause an exception
 */
export function convertHtmlToXdMarkup(html: string | undefined): string {
  if (!html) return ""

  let result = html

  // Remove wrapper span if the entire string is wrapped in one
  if (result.match(/^<span[^>]*>.*<\/span>$/s)) {
    result = result.replace(/^<span[^>]*>(.*)<\/span>$/s, "$1")
  }

  // Remove all span tags (unwrap content)
  result = result.replace(/<\/?span[^>]*>/g, "")

  // Convert supported HTML tags to XD markup
  const conversions = [
    // Italics: <i> or <em> → {/text/}
    { from: /<(i|em)(?:\s[^>]*)?>([^<>]*)<\/\1>/g, to: "{/$2/}" },

    // Bold: <b> or <strong> → {*text*}
    { from: /<(b|strong)(?:\s[^>]*)?>([^<>]*)<\/\1>/g, to: "{*$2*}" },

    // Underline: <u> → {_text_}
    { from: /<u(?:\s[^>]*)?>([^<>]*)<\/u>/g, to: "{_$1_}" },

    // Strike: <s>, <strike>, <del> → {-text-}
    { from: /<(s|strike|del)(?:\s[^>]*)?>([^<>]*)<\/\1>/g, to: "{-$2-}" },

    // Subscript: <sub> → {~text~}
    { from: /<sub(?:\s[^>]*)?>([^<>]*)<\/sub>/g, to: "{~$1~}" },

    // Superscript: <sup> → {^text^}
    { from: /<sup(?:\s[^>]*)?>([^<>]*)<\/sup>/g, to: "{^$1^}" },

    // Links: <a href="url">text</a> → {@text|url@}
    { from: /<a\s+[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([^<>]*)<\/a>/g, to: "{@$2|$1@}" },

    // Images: <img src="url" alt="alt" /> → {!url|alt!} (inline image)
    { from: /<img\s+[^>]*src\s*=\s*["']([^"']*)["'][^>]*(?:alt\s*=\s*["']([^"']*)["'][^>]*)?[^>]*\/?>/g, to: "{!$1|$2!}" },

    // Block elements: <div>, <p> → newlines (strip tags but preserve content)
    { from: /<\/?(?:div|p)(?:\s[^>]*)?>/g, to: "\n" },

    // Line breaks: <br> → newlines
    { from: /<br\s*\/?>/g, to: "\n" },
  ]

  // Apply conversions
  for (const conversion of conversions) {
    result = result.replace(conversion.from, conversion.to)
  }

  // Check for any remaining HTML tags (unsupported)
  const remainingTags = result.match(/<[^>]+>/g)
  if (remainingTags) {
    const unsupportedTags = remainingTags
      .map((tag) => tag.match(/<\/?(\w+)/)?.[1])
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // unique
      .filter(Boolean)

    throw new Error(
      `Unsupported HTML tags found: ${unsupportedTags.join(
        ", "
      )}. Supported tags: i, em, b, strong, u, s, strike, del, sub, sup, a, span, img, div, p, br`
    )
  }

  // Clean up excessive whitespace and newlines
  result = result.replace(/\n+/g, "\n").trim()

  return result
}

function formatDate(timestamp: number | undefined): string {
  if (timestamp === undefined) return ""
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}
