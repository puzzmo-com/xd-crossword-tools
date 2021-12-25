import { XDParser } from "./vendor/xdparser"
import type { CrosswordJSON, Tile } from ".."
import { getCluePositionsForBoard } from "./clueNumbersFromBoard"

/** Takes an xd string and converts it into JSON */
export const xdToJSON = (xd: string): CrosswordJSON => {
  const res = XDParser(xd)

  const rebuses = getRebuses(res.meta.rebus || "")
  const tiles = stringGridToTiles(rebuses, res.grid)
  const positions = getCluePositionsForBoard(tiles)

  const props: CrosswordJSON = {
    meta: res.meta as any,
    rebuses,
    tiles,
    clues: {
      across: res.across.map((clue) => ({
        main: clue.question,
        answer: [clue.answer],
        number: Number(clue.num.slice(1)),
        position: positions[Number(clue.num.slice(1))],
      })),
      down: res.down.map((clue) => ({
        main: clue.question,
        answer: [clue.answer],
        number: Number(clue.num.slice(1)),
        position: positions[Number(clue.num.slice(1))],
      })),
    },
    notes: res.notes,
  }
  return props
}

export const stringGridToTiles = (rebuses: CrosswordJSON["rebuses"], strArr: string[][]): CrosswordJSON["tiles"] => {
  const rebusKeys = Object.keys(rebuses)
  const tiles: CrosswordJSON["tiles"] = strArr.map((_) => [])
  strArr.forEach((row, rowI) => {
    row.forEach((char) => {
      if (rebusKeys.includes(char)) {
        tiles[rowI].push({ type: "rebus", symbol: char, word: rebuses[char] })
      } else {
        tiles[rowI].push(letterToTile(char))
      }
    })
  })

  return tiles
}

export const letterToTile = (letter: string): Tile => {
  if (letter === "#") return { type: "blank" }
  // Puzz support
  if (letter === ".") return { type: "blank" }
  return { type: "letter", letter }
}

const getRebuses = (str: string) => {
  if (!str.includes("=")) return {}
  const rebuses = {} as Record<string, string>
  str.split(" ").forEach((substr) => {
    const [start, ...rest] = substr.split("=")
    rebuses[start] = rest.join("=")
  })

  return rebuses
}
