import { JSONToXD } from "./JSONtoXD"
import type { Clue, Position as CluePosition, CrosswordJSON } from "xd-crossword-tools-parser"
import { cleanupClueMetadata } from "./cleanupClueMetadata"

import type { CellInfo, PlacedWord, AmuseTopLevel } from "./amuseJSONToXD.types.d.ts"

/** Convert an Amuse JSON to an XD file. */
export const amuseToXD = (amuseJSON: AmuseTopLevel) => JSONToXD(convertTopLevelToCrosswordJSON(amuseJSON))

type Clues = CrosswordJSON["clues"]
type Meta = CrosswordJSON["meta"]
type Tiles = CrosswordJSON["tiles"]
type Tile = Tiles[number][number]

export function convertTopLevelToCrosswordJSON(amuseJson: AmuseTopLevel): CrosswordJSON {
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

  // Tiles
  const tiles: Tile[][] = Array(amuseData.h)
    .fill(null)
    .map(() => Array(amuseData.w).fill(null))

  const cellInfoMap = new Map<string, CellInfo>()
  if (amuseData.cellInfos) {
    for (const cellInfo of amuseData.cellInfos) {
      cellInfoMap.set(`${cellInfo.y}-${cellInfo.x}`, cellInfo)
    }
  }

  for (let y = 0; y < amuseData.h; y++) {
    for (let x = 0; x < amuseData.w; x++) {
      const letterFromBox = amuseData.box[y]?.[x] as string | null
      const clueNumString = amuseData.clueNums[y]?.[x]
      // const cellKey = `${y}-${x}`
      // const specificCellInfo = cellInfoMap.get(cellKey)

      if (letterFromBox === null || letterFromBox === "." || letterFromBox === "#") {
        tiles[x][y] = { type: "blank" }
      } else {
        tiles[x][y] = {
          type: "letter",
          letter: letterFromBox || "",
          clues: {
            across: clueNumString ? parseInt(clueNumString) : undefined,
            down: clueNumString ? parseInt(clueNumString) : undefined,
          },
        }
      }
      // TODO: Rebus tiles
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
    report: {
      success: true,
      errors: [],
      warnings: [],
    },
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
