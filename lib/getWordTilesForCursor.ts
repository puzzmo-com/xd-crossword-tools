import { CrosswordState, Cursor, Position } from "./types"
import {  getTile } from "./getTile"

/** Gets all the related tiles for the cursor, may contain dupes */
export const getWordTilesForCursor = (tiles: CrosswordState["props"]["tiles"], cursor: CrosswordState["cursor"]) => {
  if (!cursor) return []

  const positions = [cursor.position]
  const start = cursor.position

  if (cursor.direction === "down") {
    // Vertical, aka moving indexes, start by going up
    const max = tiles.length
    for (let y = start.index + 1; y < max; y++) {
      const tile = getTile(tiles, { index: y, col: start.col })
      if (tile.type === "blank") break
      positions.push({ index: y, col: start.col })
    }

    // Then go down
    for (let x = start.index - 1; x >= 0; x--) {
      const tile = getTile(tiles, { index: x, col: start.col })

      if (tile.type === "blank") break
      positions.push({ index: x, col: start.col })
    }
  } else {
    // Horizontal, aka moving columns, start by going right
    const max = tiles[start.index].length
    for (let x = start.col + 1; x < max; x++) {
      const nextTile = getTile(tiles, { index: start.index, col: x })
      if (nextTile.type === "blank") break
      positions.push({ index: start.index, col: x })
    }
    // Down
    for (let x = start.col - 1; x >= 0; x--) {
      const nextTile = getTile(tiles, { index: start.index, col: x })
      if (nextTile.type === "blank") break
      positions.push({ index: start.index, col: x })
    }
  }

  return positions
}

export const getAllUserInputTilePositions = (tiles: CrosswordState["props"]["tiles"]) => {
  return []
}

export const getSortedTilesForCursor = (state: CrosswordState, cursor: Cursor) => {
  const unOrderedTiles = getWordTilesForCursor(state.props.tiles, cursor)
  const sort = cursor.direction === "across" ? (l: Position, r: Position) => l.col - r.col : (l: Position, r: Position) => l.index - r.index
  const tiles = unOrderedTiles.sort(sort)
  return { first: tiles[0], last: tiles[tiles.length - 1], tiles }
}
