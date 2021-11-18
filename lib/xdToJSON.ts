import { XDParser } from "./vendor/xdparser"
import type { CrosswordJSON, Tile } from ".."
import { getCluePositionsForBoard } from "./clueNumbersFromBoard"

/** Takes an xd string and converts it into JSON */
export const xdToJSON = (xd: string): CrosswordJSON => {
  const res = XDParser(xd)

  const tiles = stringGridToTiles(res.grid)
  const positions = getCluePositionsForBoard(tiles)

  const props: CrosswordJSON = {
    meta: res.meta as any,
    tiles,
    clues: {
      across: res.across.map(clue => ({
        main: clue.question,
        answer: clue.answer,
        number: Number(clue.num.slice(1)),
        position: positions[Number(clue.num.slice(1))],
      })),
      down: res.down.map(clue => ({
        main: clue.question,
        answer: clue.answer,
        number: Number(clue.num.slice(1)),
        position: positions[Number(clue.num.slice(1))],
      })),
    },
  }
  return props
}

export const stringGridToTiles = (strArr: string[][]): CrosswordJSON["tiles"] => {
  const tiles: CrosswordJSON["tiles"] = strArr.map(_ => [])

  strArr.forEach((row, rowI) => {
    row.forEach(char => {
      tiles[rowI].push(letterToTile(char))
    })
  })

  return tiles
}

export const letterToTile = (letter: string): Tile => {
  if (letter === "#") return { type: "blank" }
  // Puzz support
  if (letter === ".") return { type: "blank" }
  return { type: "letter", letter, state: "normal" }
}
