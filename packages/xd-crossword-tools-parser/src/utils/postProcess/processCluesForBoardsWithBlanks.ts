import type { CrosswordJSON, Tile, Position, Clue } from "../../types"
import { PositionWithTiles } from "../clueNumbersFromBoard"

export const getBlankCluePositions = (tiles: CrosswordJSON["tiles"]) => {
  const spots = getPossibleTiles(tiles)
  const down = downCluePositions(spots, tiles)
  const across = acrossCluePositions(spots, tiles)
  return getOrderedPositionsForSpots(spots, across, down)
}

function getPossibleTiles(tiles: CrosswordJSON["tiles"]): boolean[][] {
  return tiles.map((row) => row.map((tile) => tile.type !== "blank"))
}

/** Whether a cell has a bar on its left or top edge, which ends an entry like a block does */
const hasBar = (tiles: CrosswordJSON["tiles"], y: number, x: number, flag: "bar-left" | "bar-top") => {
  const tile = tiles[y]?.[x]
  return !!tile && tile.type !== "blank" && !!tile.design?.includes(flag)
}

function acrossCluePositions(spots: boolean[][], tiles: CrosswordJSON["tiles"]): PositionWithTiles[] {
  // Go left to right through the tiles, determining if they are
  // the first character of a potential word
  const positions: PositionWithTiles[] = []
  spots.forEach((row, y) => {
    row.forEach((spot, x) => {
      if (!spot) return
      const behind = spots[y][x - 1] && !hasBar(tiles, y, x, "bar-left")
      if (!behind) {
        // A word cannot be 1 character long
        const hasNextHorizontalLetter = Boolean(spots[y][x + 1]) && !hasBar(tiles, y, x + 1, "bar-left")
        if (hasNextHorizontalLetter) {
          // now collect tiles by searching right until we hit a blank or a bar
          let i = x
          const relatedTiles = [] as Tile[]
          while (spots[y][i] && (i === x || !hasBar(tiles, y, i, "bar-left"))) {
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

function downCluePositions(spots: boolean[][], tiles: CrosswordJSON["tiles"]): PositionWithTiles[] {
  // Go left to right through the tiles, determining if they are
  // the first character of a potential word which goes down
  const positions: PositionWithTiles[] = []
  spots.forEach((row, y) => {
    row.forEach((spot, x) => {
      if (!spot) return
      const above = spots[y - 1]?.[x] && !hasBar(tiles, y, x, "bar-top")
      if (!above) {
        // A word cannot be 1 character long
        const hasNextVerticalLetter = spots[y + 1]?.[x] && !hasBar(tiles, y + 1, x, "bar-top")
        if (hasNextVerticalLetter) {
          // now collect tiles by searching down until we hit a blank or a bar
          let i = y
          const relatedTiles = [] as Tile[]
          while (spots[i]?.[x] && (i === y || !hasBar(tiles, i, x, "bar-top"))) {
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

function getOrderedPositionsForSpots(
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
