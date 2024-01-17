import { decode, Puz2JSONResult } from "./vendor/puzjs"
import { CrosswordJSON, CursorDirection, Tile } from "./types"

import { getWordTilesForCursor } from "./getWordTilesForCursor"
import { getCluePositionsForBoard } from "./clueNumbersFromBoard"
import { getTile } from "./getTile"

/** Takes a .puz Buffer and converts it to an xd file */
export function puzToXD(buffer: ArrayBuffer) {
  const rebuses = new Map<string, string>()

  const file = decode(buffer)
  const meta = Object.keys(file.meta).map((key) => `${key.toLowerCase()}: ${(file.meta[key] || "N/A").trim()}`)
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
  if (typeof letter === "object" && "solution" in letter) return { type: "rebus", symbol: letter, word: letter["solution"], clues: {} }

  if (letter === "#") return { type: "blank" }
  // Puz support
  if (letter === ".") return { type: "blank" }

  return { type: "letter", letter, clues: {} }
}

let rebusCounter = -1
const getNewRebusSymbol = () => {
  const rebuses = [
    "❶",
    "❷",
    "❸",
    "❹",
    "❺",
    "❻",
    "❼",
    "❽",
    "❾",
    "❿",
    "➀",
    "➁",
    "➂",
    "➃",
    "➄",
    "➅",
    "➆",
    "➇",
    "➈",
    "➉",
    "➊",
    "➋",
    "➌",
    "➍",
    "➎",
    "➏",
    "➐",
    "➑",
    "➒",
    "➓",
    "✪",
    "✫",
    "✬",
    "✭",
    "✮",
    "✯",
    "✰",
    "✱",
    "✲",
    "✳",
    "✴",
    "✵",
    "✶",
    "✷",
    "✸",
    "✹",
    "✺",
    "✻",
    "✼",
    "✽",
    "✾",
    "✿",
    "❀",
    "❁",
    "❂",
    "❃",
    "❄",
    "❅",
    "❆",
    "❇",
    "❈",
    "❉",
    "❊",
    "❋",
    "À",
    "Á",
    "Â",
    "Ã",
    "Ä",
    "Å",
    "Æ",
    "Ç",
    "È",
    "É",
    "Ê",
    "Ë",
    "Ì",
    "Í",
    "Î",
    "Ï",
    "Ð",
    "Ñ",
    "Ò",
    "Ó",
    "Ô",
    "Õ",
    "Ö",
    "Ø",
    "Ù",
    "Ú",
    "Û",
    "Ü",
    "Ý",
    "Þ",
    "ß",
    "à",
    "á",
    "â",
    "ã",
    "ä",
    "å",
    "æ",
    "ç",
    "è",
    "é",
    "ê",
    "ë",
    "ì",
    "í",
    "î",
    "ï",
    "ð",
    "ñ",
    "ò",
    "ó",
    "ô",
    "õ",
    "ö",
    "ø",
    "ù",
    "ú",
    "û",
    "ü",
    "ý",
    "þ",
    "ÿ",
    "Ā",
    "ā",
    "Ă",
    "ă",
    "Ą",
    "ą",
    "Ć",
    "ć",
    "Ĉ",
    "ĉ",
    "Ċ",
    "ċ",
    "Č",
    "č",
    "Ď",
    "ď",
    "Đ",
    "đ",
    "Ē",
    "ē",
    "Ĕ",
    "ĕ",
    "Ė",
    "ė",
    "Ę",
    "ę",
    "Ě",
    "ě",
    "Ĝ",
    "ĝ",
    "Ğ",
    "ğ",
    "Ġ",
    "ġ",
    "Ģ",
    "ģ",
    "Ĥ",
    "ĥ",
  ]
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
