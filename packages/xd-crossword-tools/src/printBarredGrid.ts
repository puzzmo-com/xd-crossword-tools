import { Tile } from "xd-crossword-tools-parser"
import { BarPosition } from "./deriveBarPositions"

/**
 * Converts bar positions to a tile grid with bar flags
 */
export function addBarsToTiles(tiles: Tile[][], bars: BarPosition[]): Tile[][] {
  const result: Tile[][] = tiles.map((row) =>
    row.map((tile) => {
      if (tile.type === "blank") return tile
      return { ...tile, design: tile.design ? [...tile.design] : [] }
    })
  )

  for (const bar of bars) {
    if (bar.row >= 0 && bar.row < result.length && bar.col >= 0 && bar.col < result[bar.row].length) {
      const tile = result[bar.row][bar.col]
      if (tile.type !== "blank") {
        const tileWithDesign = tile as any
        if (!tileWithDesign.design) tileWithDesign.design = []
        const barFlag = `bar-${bar.type}`
        if (!tileWithDesign.design.includes(barFlag)) {
          tileWithDesign.design.push(barFlag)
        }
      }
    }
  }

  return result
}

/**
 * Gets bar flags from a tile's design
 */
function getBars(tile: Tile) {
  const design = (tile as any).design || []
  return {
    left: design.includes("bar-left"),
    right: design.includes("bar-right"),
    top: design.includes("bar-top"),
    bottom: design.includes("bar-bottom"),
  }
}

/**
 * Prints a crossword grid similar to the googledocs-cryptic-jpz format
 * Uses Unicode box-drawing characters for a professional barred grid appearance
 * Based on https://github.com/nhrqz/googledocs-cryptic-jpz/blob/master/src/import.js
 * MIT License at https://github.com/nhrqz/googledocs-cryptic-jpz/commit/ccf1ebd2c5c85f793f44438d1971075271771473
 */
export function printBarredGrid(tiles: Tile[][]): string {
  const height = tiles.length
  const width = tiles[0]?.length || 0

  const rows: string[] = []

  for (let row = 0; row < height; row++) {
    let rowString = ""

    for (let col = 0; col < width; col++) {
      const cell = tiles[row][col]
      const s = row < height - 1 ? tiles[row + 1][col] : null // south
      const e = col < width - 1 ? tiles[row][col + 1] : null // east
      const se = s && e ? tiles[row + 1][col + 1] : null // southeast

      const drawnCell = drawBox(cell, s, e, se)
      rowString = addCellToRowString(drawnCell, rowString)
    }
    rows.push(rowString)
  }

  return rows.join("\n")
}

function drawBox(cell: Tile, s: Tile | null, e: Tile | null, se: Tile | null): string {
  const letter = cell.type === "letter" ? cell.letter : cell.type === "rebus" ? cell.symbol : " "
  const sBars = s ? getBars(s) : { left: false, right: false, top: false, bottom: false }
  const eBars = e ? getBars(e) : { left: false, right: false, top: false, bottom: false }
  const seBars = se ? getBars(se) : { left: false, right: false, top: false, bottom: false }

  let boxCell = letter

  // Add right edge (vertical bar if east cell has left-bar)
  if (e) {
    boxCell += eBars.left ? " │ " : "   "

    // Add bottom edge if there's a south cell
    if (s) {
      boxCell += sBars.top ? "\n──" : "\n  "

      // Add southeast corner junction
      boxCell += eBars.left
        ? sBars.top
          ? seBars.left
            ? seBars.top
              ? "┼─"
              : "┤ "
            : seBars.top
            ? "┴─"
            : "┘ "
          : seBars.left
          ? seBars.top
            ? "├─"
            : "│ "
          : seBars.top
          ? "└─"
          : "╵ "
        : sBars.top
        ? seBars.left
          ? seBars.top
            ? "┬─"
            : "┐ "
          : seBars.top
          ? "──"
          : "╴ "
        : seBars.left
        ? seBars.top
          ? "┌─"
          : "╷ "
        : seBars.top
        ? "╶─"
        : "  "
    }
  } else {
    // No east cell - just add bottom if there's a south cell
    if (s) {
      boxCell += sBars.top ? "\n──" : "\n  "
    }
  }

  return boxCell
}

function addCellToRowString(drawnCell: string, rowString: string): string {
  if (rowString === "") {
    return drawnCell
  }

  const cellLines = drawnCell.split("\n")
  const rowLines = rowString.split("\n")

  // Ensure both have the same number of lines
  while (cellLines.length < rowLines.length) {
    cellLines.push("")
  }
  while (rowLines.length < cellLines.length) {
    rowLines.push("")
  }

  // Combine line by line
  const combinedLines = rowLines.map((line, i) => line + cellLines[i])
  return combinedLines.join("\n")
}
