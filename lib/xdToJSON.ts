import { XDParser } from "./vendor/xdparser"
import type { CrosswordProps, Tile } from ".."
import { getCluePositionsForBoard } from "./clueNumbersFromBoard"

export const xdToJSON = (xd: string): CrosswordProps => {
  const res = XDParser(xd)

  const tiles = stringGridToTiles(res.grid)
  const positions = getCluePositionsForBoard(tiles)

  const props: CrosswordProps = {
    game: "crossword:props",
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

export const stringGridToTiles = (strArr: string[][]): CrosswordProps["tiles"] => {
  const tiles: CrosswordProps["tiles"] = strArr.map(_ => [])

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
