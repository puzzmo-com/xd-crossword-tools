/** A 0-based grid position. */
export interface CellPosition {
  col: number
  row: number
}

/** Expands a crossword-compiler `x`/`y` range pair (e.g. x="1-5" y="3") into 0-based cells. */
export function cellsFromRanges(rawX: string | undefined, rawY: string | undefined): CellPosition[] | undefined {
  const xRange = parseRange(rawX)
  const yRange = parseRange(rawY)
  if (!xRange || !yRange) return undefined

  const cells: CellPosition[] = []
  for (let x = xRange[0]; x <= xRange[1]; x++) {
    for (let y = yRange[0]; y <= yRange[1]; y++) cells.push({ col: x - 1, row: y - 1 })
  }
  return cells
}

/** Parses an attribute like "1-6" or "5" into [start, end] (1-based, inclusive). */
function parseRange(raw: string | undefined): [number, number] | undefined {
  if (!raw) return undefined
  const parts = raw.split("-").map((p) => parseInt(p, 10))
  if (parts.some((n) => Number.isNaN(n))) return undefined
  if (parts.length === 1) return [parts[0], parts[0]]
  return [parts[0], parts[1]]
}
