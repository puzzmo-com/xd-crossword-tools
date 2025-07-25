import type { CrosswordJSON, Tile, Position, Clue } from "../types"
import { getBarredCluePositions } from "./postProcess/processCluesForBoardsWithBars"
import { getBlankCluePositions } from "./postProcess/processCluesForBoardsWithBlanks"

export type PositionWithTiles = {
  position: Position
  tiles: {
    across?: Tile[]
    down?: Tile[]
  }
}

export type RawClueData = {
  num: number
  question: string
  metadata?: Record<string, string>
  answer: string
  dir: "A" | "D"
  display: any[]
}

/**
 * Analyzes a crossword grid and determines the positions where clues should be numbered.
 * Supports both standard crosswords (using black squares) and barred grids (using bars to separate words).
 */
export const getCluePositionsForBoard = (
  tiles: CrosswordJSON["tiles"],
  meta?: CrosswordJSON["meta"],
  rawClues?: Map<string, RawClueData>
): PositionWithTiles[] => {
  // Check if this is a barred grid
  if (meta?.form === "barred" && rawClues) {
    return getBarredCluePositions(tiles, rawClues, meta)
  }

  return getBlankCluePositions(tiles)
}
