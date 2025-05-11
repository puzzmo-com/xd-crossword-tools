import { Clue, CrosswordJSON, CursorDirection, Position } from "../types"
import { getTile } from "./getTile"

/** What clue exists for a position? */
export const clueInfosForPosition = (tiles: CrosswordJSON["tiles"], clues: CrosswordJSON["clues"], position: Position) => {
  const tile = getTile(tiles, position)
  if (!tile) throw new Error("No tile at position")
  if (tile.type === "blank") return { down: undefined, across: undefined }

  // Start with the across clues, they should match the same index
  const downClue = clues.down.find((c) => {
    const sameColumn = c.position.col === position.col
    if (!sameColumn) return
    return c.position.index <= position.index && c.position.index + c.tiles.length > position.index
  })

  const acrossClue = clues.across.find((clue) => {
    const sameIndex = clue.position.index === position.index
    if (!sameIndex) return
    return clue.position.col <= position.col && clue.position.col + clue.tiles.length > position.col
  })

  return {
    down: !downClue ? undefined : { clue: downClue, index: clues.down.indexOf(downClue) },
    across: !acrossClue ? undefined : { clue: acrossClue, index: clues.across.indexOf(acrossClue) },
  }
}

export const tilePositionsForClue = (clue: Clue, direction: CursorDirection): Position[] => {
  const start = clue.position
  return Array.from({ length: clue.tiles.length }).map((_, i) => {
    const isAcross = direction === "across"
    return {
      col: isAcross ? start.col + i : start.col,
      index: !isAcross ? start.index + i : start.index,
    }
  })
}
