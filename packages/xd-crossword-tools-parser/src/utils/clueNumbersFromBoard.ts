import type { CrosswordJSON, Tile, Position } from "../types"
import { getBlankCluePositions } from "./postProcess/processCluesForBoardsWithBlanks"

export type PositionWithTiles = {
  position: Position
  tiles: {
    across?: Tile[]
    down?: Tile[]
  }
}

/**
 * Works out where each clue's entry is, numbering the cells the usual way. An entry ends at a block, the edge of
 * the grid, or a bar (from the `## Bars` section, which the parser puts on each tile as `bar-left` and `bar-top`).
 * The array is indexed by clue number, so index 0 is unused.
 */
export const getCluePositionsForBoard = (tiles: CrosswordJSON["tiles"]): PositionWithTiles[] => getBlankCluePositions(tiles)
