import type { CrosswordJSON, Tile, Position } from "./types"

type PositionWithTiles = {
  position: Position
  tiles: {
    across?: Tile[]
    down?: Tile[]
  }
}

export const getCluePositionsForBoard = (tiles: CrosswordJSON["tiles"]): PositionWithTiles[] => {
  const spots = _getPossibleTiles(tiles)
  const down = _downCluePositions(spots, tiles)
  const across = _acrossCluePositions(spots, tiles)
  return _getOrderedPositionsForSpots(spots, across, down)
}

export function _getPossibleTiles(tiles: CrosswordJSON["tiles"]): boolean[][] {
  return tiles.map((row) => row.map((tile) => tile.type !== "blank"))
}

export function _acrossCluePositions(spots: boolean[][], tiles: CrosswordJSON["tiles"]): PositionWithTiles[] {
  // Go left to right through the tiles, determining if they are
  // the first character of a potential word
  const positions: PositionWithTiles[] = []
  spots.forEach((row, y) => {
    row.forEach((spot, x) => {
      if (!spot) return
      const behind = spots[y][x - 1]
      if (!behind) {
        // A word cannot be 1 character long
        const hasNextHorizontalLetter = Boolean(spots[y][x + 1])
        if (hasNextHorizontalLetter) {
          // now collect tiles by searching right until we hit a blank
          let i = x
          const relatedTiles = [] as Tile[]
          while (spots[y][i]) {
            relatedTiles.push(tiles[y][i])
            i++
          }

          positions.push({ position: { col: x, index: y }, tiles: { across: relatedTiles } })
        }
      }
    })
  })

  return positions
}

export function _downCluePositions(spots: boolean[][], tiles: CrosswordJSON["tiles"]): PositionWithTiles[] {
  // Go left to right through the tiles, determining if they are
  // the first character of a potential word which goes down
  const positions: PositionWithTiles[] = []
  spots.forEach((row, y) => {
    row.forEach((spot, x) => {
      if (!spot) return
      const above = spots[y - 1]?.[x]
      if (!above) {
        // A word cannot be 1 character long
        const hasNextVerticalLetter = spots[y + 1]?.[x]
        if (hasNextVerticalLetter) {
          // now collect tiles by searching down until we hit a blank
          let i = y
          const relatedTiles = [] as Tile[]
          while (spots[i]?.[x]) {
            relatedTiles.push(tiles[i][x])
            i++
          }

          positions.push({ position: { col: x, index: y }, tiles: { down: relatedTiles } })
        }
      }
    })
  })

  return positions
}

export function _getOrderedPositionsForSpots(
  spots: boolean[][],
  acrossPos: PositionWithTiles[],
  downPos: PositionWithTiles[]
): PositionWithTiles[] {
  // Clues are 1 based, not zero based, so add a dummy
  const positions: PositionWithTiles[] = [{ position: { col: -1, index: -1 }, tiles: {} }]

  spots.forEach((row, y) => {
    row.forEach((_, x) => {
      const thisSpot = { col: x, index: y }
      const foundAcross = acrossPos.find((p) => positionSame(p.position, thisSpot))
      const foundDown = downPos.find((p) => positionSame(p.position, thisSpot))

      if (foundAcross || foundDown) {
        positions.push({
          position: thisSpot,
          tiles: {
            across: foundAcross?.tiles?.across,
            down: foundDown?.tiles?.down,
          },
        })
      }
    })
  })
  return positions
}

export const positionSame = (pos1: Position | undefined, pos2: Position | undefined) => {
  if (!pos1) return
  if (!pos2) return
  return pos1.col === pos2.col && pos1.index === pos2.index
}
