import { getTile } from "./getTile"
import type { CrosswordJSON, Position } from "./types"

export const getCluePositionsForBoard = (tiles: CrosswordJSON["tiles"]): Position[] => {
  const spots = _getPossibleTiles(tiles)
  const across = _acrossCluePositions(spots)
  const down = _downCluePositions(spots)
  return _getOrderedPositionsForSpots(spots, across, down)
}

export const _getCluePositionsForBoard = (tiles: CrosswordJSON["tiles"]) => {
  const spots = _getPossibleTiles(tiles)
  const across = _acrossCluePositions(spots)
  const down = _downCluePositions(spots)
  return { across, down }
}

export function _getPossibleTiles(tiles: CrosswordJSON["tiles"]): boolean[][] {
  return tiles.map((row) => row.map((tile) => tile.type !== "blank"))
}

export function _acrossCluePositions(spots: boolean[][]): Position[] {
  // Go left to right through the tiles, determining if they are
  // the first character of a potential word
  const positions: Position[] = []
  spots.forEach((row, y) => {
    row.forEach((spot, x) => {
      if (!spot) return
      const behind = spots[y][x - 1]
      if (!behind) {
        // A word cannot be 1 character long
        const hasNextHorizontalLetter = spots[y][x + 1] && spots[y][x + 1]
        if (hasNextHorizontalLetter) positions.push({ col: x, index: y })
      }
    })
  })

  return positions
}

export function _downCluePositions(spots: boolean[][]): Position[] {
  // Go left to right through the tiles, determining if they are
  // the first character of a potential word which goes down
  const positions: Position[] = []
  spots.forEach((row, y) => {
    row.forEach((spot, x) => {
      if (!spot) return
      const above = spots[y - 1] && spots[y - 1][x]
      if (!above) {
        // A word canno`t be 1 character long
        const hasNextVerticalLetter = spots[y + 1] && spots[y + 1][x]
        if (hasNextVerticalLetter) positions.push({ col: x, index: y })
      }
    })
  })

  return positions
}

export function _getOrderedPositionsForSpots(spots: boolean[][], across: Position[], down: Position[]): Position[] {
  // Clues are 1 based, not zero based, so add a dummy
  const positions: Position[] = [{ col: -1, index: -1 }]
  const allFound = across.concat(down)

  spots.forEach((row, y) => {
    row.forEach((_, x) => {
      const thisSpot = { col: x, index: y }
      const found = allFound.find((p) => positionSame(p, thisSpot))
      if (found) positions.push(thisSpot)
    })
  })
  return positions
}

export const positionSame = (pos1: Position | undefined, pos2: Position | undefined) => {
  if (!pos1) return
  if (!pos2) return
  return pos1.col === pos2.col && pos1.index === pos2.index
}

export const clueInfosForPosition = (clues: CrosswordJSON["clues"], position: Position) => {
  // Start with the across clues, they should match the same index
  const vClue = clues.down.find((c) => {
    const sameColumn = c.position.col === position.col
    if (!sameColumn) return
    return c.position.index <= position.index && c.position.index + c.answer.length > position.index
  })

  const hClue = clues.across.find((c) => {
    const sameIndex = c.position.index === position.index
    if (!sameIndex) return

    return c.position.col <= position.col && c.position.col + c.answer.length > position.col
  })

  return {
    down: !vClue ? undefined : { index: clues.down.indexOf(vClue) },
    across: !hClue ? undefined : { index: clues.across.indexOf(hClue) },
  }
}
