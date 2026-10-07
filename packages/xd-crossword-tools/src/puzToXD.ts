import { decode, Puz2JSONResult } from "./vendor/puzjs"
import { CrosswordJSON, CursorDirection, Tile, xdToJSON } from "xd-crossword-tools-parser"
import { JSONToPuzInput } from "./JSONToPuz"

import { getWordTilesForCursor } from "xd-crossword-tools-parser"
import { getCluePositionsForBoard, getTile } from "xd-crossword-tools-parser"
import { makeGetNewRebusSymbol } from "./utils/rebusSymbols"

/** Takes a .puz Buffer and converts it to an xd file */
export function puzToXD(buffer: ArrayBuffer) {
  const rebuses = new Map<string, string>()

  const file = decode(buffer)
  if (file.xd && embeddedXDMatchesGrid(file.xd, file.grid)) return file.xd

  // The notes string gets its own section, as it can be multi-line
  const meta = Object.keys(file.meta)
    .filter((key) => key !== "description")
    .map((key) => `${key.toLowerCase()}: ${(file.meta[key] || "N/A").trim()}`)
  const board = setupBoard(file.grid, rebuses)
  const notes: string[] = []

  // We need to re-create the clues section, which isn't fully fleshed
  // out in a easy way inside the puz file
  const tileGrid = puzStringGridToTiles(file.grid)
  // The latter two args are only for barred grid support, which .puz files do not support
  const boardClues = getCluePositionsForBoard(tileGrid, undefined, undefined)
  const getClues = (clues: Array<null | string>, direction: CursorDirection) =>
    clues
      .map((c, i) => {
        if (!c) return

        const clueInfos = getWordTilesForCursor(tileGrid, {
          position: boardClues[i].position,
          direction,
        })
        // Replace all newlines, as they're not supported in xd
        const clueBody = c.replace(/\n/g, "")
        if (clueInfos.length === 0) return
        const prefix = direction === "across" ? "A" : "D"
        const clueText = clueInfos.map((p) => answerStringForTile(getTile(tileGrid, p))).join("")
        return `${prefix}${i}. ${clueBody} ~ ${clueText}`
      })
      .filter(Boolean)
      .join("\n")

  const across = getClues(file.clues.across, "across")
  const down = getClues(file.clues.down, "down")
  if (rebuses.size) {
    let entries = ""
    rebuses.forEach((v, k) => (entries += ` ${k}=${v}`))
    meta.push("rebus:" + entries)
  }

  const puzNotes = file.meta.description?.trim()
  if (puzNotes) notes.push(puzNotes + "\n")

  const start = generateStartSection(file)
  if (start) notes.push(start)

  const visuals = generatePuzVisualsInfo(file)
  notes.push(...visuals.notes)

  return `## Metadata

${meta.join("\n")}

## Grid

${board}

## Clues

${across}

${down}${notes.length ? "\n\n## Notes\n\n" + notes.join("\n") : ""}`
}

/**
 * An .xd embedded by JSONToPuz is only used when the .puz grid still matches it, so a .puz
 * which was edited in another tool afterwards is imported from its own data instead
 */
const embeddedXDMatchesGrid = (xd: string, grid: Puz2JSONResult["grid"]) => {
  try {
    const embeddedGrid = JSONToPuzInput(xdToJSON(xd)).grid
    if (embeddedGrid.length !== grid.length) return false
    return grid.every((row, r) =>
      row.every((cell, c) => {
        const solution = typeof cell === "object" ? (cell as any).solution : cell
        return embeddedGrid[r][c] === solution
      }),
    )
  } catch {
    return false
  }
}

/** Squares the .puz marks as given to the player become the Start section */
const generateStartSection = (file: Puz2JSONResult) => {
  if (!file.given.length) return

  const width = file.grid[0].length
  const rows = file.grid.map((row, r) =>
    row
      .map((cell, c) => {
        if (cell === ".") return "#"
        const letter = file.progress[r][c]
        return file.given.includes(r * width + c) && letter !== "-" ? letter : "."
      })
      .join(""),
  )
  return `## Start\n\n${rows.join("\n")}\n`
}

export const puzStringGridToTiles = (strArr: string[][]): CrosswordJSON["tiles"] => {
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
  if (typeof letter === "object" && "solution" in letter) return { type: "rebus", symbol: letter, word: letter["solution"], clues: {} }

  if (letter === "#") return { type: "blank" }
  // Puz support
  if (letter === ".") return { type: "blank" }

  return { type: "letter", letter, clues: {} }
}

const setupBoard = (grid: Puz2JSONResult["grid"], rebuses: Map<string, string>) => {
  const getNewRebusSymbol = makeGetNewRebusSymbol()
  const symbolForSolution = new Map<string, string>()

  const addRebus = (solution: string) => {
    const existing = symbolForSolution.get(solution)
    if (existing) return existing
    const symbol = getNewRebusSymbol()
    symbolForSolution.set(solution, symbol)
    rebuses.set(symbol, solution)
    return symbol
  }

  let board = ""
  grid.forEach((line) => {
    line.forEach((letter) => {
      if (typeof letter === "object" && "solution" in letter) {
        board += addRebus(letter["solution"])
      } else if (letter !== "." && letter !== "#" && !/^[A-Za-z]$/.test(letter)) {
        // A non-alphabetic solution character (e.g. the "+" in LGBTQ+, or a digit)
        // can't live in an xd grid directly, so it becomes a single-character rebus
        board += addRebus(letter)
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

  let styleContent = ""
  if (file.circles.length) {
    styleContent = "O { background: circle }"
    if (file.shades.length) {
      styleContent += " S { background: shade }"
    }
  } else if (file.shades.length) {
    styleContent = "S { background: shade }"
  }

  if (styleContent.length) {
    meta.push(styleContent)
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
    notes.push("## Design\n")
    notes.push(`<style>${styleContent}</style>\n`)
    notes.push(design)
  }

  return {
    notes,
  }
}
