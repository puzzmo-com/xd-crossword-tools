import { decode, Puz2JSONResult } from "./vendor/puzjs"
import { CrosswordJSON, CursorDirection, Tile } from "./types"

import { getWordTilesForCursor } from "./getWordTilesForCursor"
import { getCluePositionsForBoard } from "./clueNumbersFromBoard"
import { getTile } from "./getTile"

/** Takes a .puz Buffer and converts it to an xd file */
export function puzToXD(buffer: ArrayBuffer) {
  const cap = (word: string) => word[0].toUpperCase() + word.slice(1)

  const rebuses = new Map<string, string>()

  const file = decode(buffer)
  const meta = Object.keys(file.meta).map((key) => `${cap(key)}: ${(file.meta[key] || "N/A").trim()}`)
  const board = setupBoard(file.grid, rebuses)
  const notes: string[] = []

  // We need to re-create the clues section, which isn't fully fleshed
  // out in a easy way inside the puz file
  const tileGrid = stringGridToTiles(file.grid)
  const boardClues = getCluePositionsForBoard(tileGrid)
  const getClues = (clues: Array<null | string>, direction: CursorDirection) =>
    clues
      .map((c, i) => {
        if (!c) return

        const clueInfos = getWordTilesForCursor(tileGrid, {
          position: boardClues[i],
          direction,
        })
        if (clueInfos.length === 0) return
        const prefix = direction === "across" ? "A" : "D"
        const clueText = clueInfos.map((p) => answerStringForTile(getTile(tileGrid, p))).join("")
        return `${prefix}${i}. ${c} ~ ${clueText}`
      })
      .filter(Boolean)
      .join("\n")

  const across = getClues(file.clues.across, "across")
  const down = getClues(file.clues.down, "down")
  if (rebuses.size) {
    let entries = ""
    rebuses.forEach((v, k) => (entries += ` ${k}=${v}`))
    meta.push("Rebus:" + entries)
  }

  const visuals = generatePuzVisualsInfo(file)
  meta.push(...visuals.meta)
  notes.push(...visuals.notes)

  return `${meta.join("\n")}


${board}

${across}

${down}${notes.length ? "\n\n\n" + notes.join("\n") : ""}`
}

export const stringGridToTiles = (strArr: string[][]): CrosswordJSON["tiles"] => {
  const tiles: CrosswordJSON["tiles"] = strArr.map((_) => [])

  strArr.forEach((row, rowI) => {
    row.forEach((char) => {
      tiles[rowI].push(puzJSLetterToTile(char))
    })
  })

  return tiles
}

export const puzJSLetterToTile = (letter: string): Tile => {
  // A rebus is a strange one
  if (typeof letter === "object" && "solution" in letter) return { type: "rebus", symbol: letter, word: letter["solution"] }

  if (letter === "#") return { type: "blank" }
  // Puz support
  if (letter === ".") return { type: "blank" }

  return { type: "letter", letter }
}

let rebusCounter = -1
const getNewRebusSymbol = () => {
  const rebuses = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "†", "ƒ", "•", "¤", "©", "§", "¥"]
  rebusCounter++

  const newRebus = rebuses[rebusCounter]
  if (!newRebus) throw new Error("Ran out of automatic rebus symbols")
  return newRebus
}

const setupBoard = (grid: Puz2JSONResult["grid"], rebuses: Map<string, string>) => {
  let board = ""
  grid.forEach((line) => {
    line.forEach((letter) => {
      if (typeof letter === "object" && "solution" in letter) {
        const symbol = getNewRebusSymbol()
        rebuses.set(symbol, letter["solution"])
        board += symbol
      } else {
        board += letter
      }
    })
    board += "\n"
  })
  return board
}

const answerStringForTile = (tile: Tile) => {
  switch (tile.type) {
    case "blank":
      return ""
    case "letter":
      return tile.letter
    case "rebus":
      return tile.word
  }
}

const generatePuzVisualsInfo = (file: Puz2JSONResult) => {
  const meta: string[] = []
  const notes: string[] = []

  let metaBuiltIn = ""
  if (file.circles.length) {
    metaBuiltIn = "Design: O={ background: circle }"
    if (file.shades.length) {
      metaBuiltIn += " S={ background: shade }"
    }
  } else if (file.shades.length) {
    metaBuiltIn = "Design: S={ background: shade }"
  }

  if (metaBuiltIn.length) {
    meta.push(metaBuiltIn)
    let design = ""
    let i = -1
    file.grid.forEach((line) => {
      line.forEach((char) => {
        i++
        if (file.circles.includes(i)) {
          design += "O"
          return
        } else if (file.shades.includes(i)) {
          design += "S"
        } else if (char === ".") {
          design += "#"
        } else {
          design += "."
        }
      })
      design += "\n"
    })
    notes.push("## DESIGN\n")
    notes.push(design)
  }

  return {
    meta,
    notes,
  }
}
