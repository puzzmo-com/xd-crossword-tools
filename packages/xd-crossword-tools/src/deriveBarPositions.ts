import { Clue } from "xd-crossword-tools-parser"

export interface BarPosition {
  row: number
  col: number
  type: "left" | "right" | "top" | "bottom"
}

export function deriveBarPositionsFromAcrossClues(clues: Clue[], gridWidth: number): BarPosition[] {
  const bars: BarPosition[] = []

  // Sort clues by row, then by column
  const sortedClues = [...clues].sort((a, b) => {
    if (a.position.index !== b.position.index) {
      return a.position.index - b.position.index
    }
    return a.position.col - b.position.col
  })

  // Group clues by row
  const cluesByRow = new Map<number, Clue[]>()
  for (const clue of sortedClues) {
    const row = clue.position.index
    if (!cluesByRow.has(row)) {
      cluesByRow.set(row, [])
    }
    cluesByRow.get(row)!.push(clue)
  }

  // For each row, derive bars between clues
  for (const [row, rowClues] of cluesByRow) {
    for (let i = 0; i < rowClues.length; i++) {
      const clue = rowClues[i]
      const answerLength = clue.answer.length
      const startCol = clue.position.col
      const endCol = startCol + answerLength - 1

      // Add left bar if this is not the first cell of the row
      if (startCol > 0) {
        bars.push({
          row,
          col: startCol,
          type: "left",
        })
      }

      // Add right bar if this is not the last cell of the row and there's another clue after
      if (endCol < gridWidth - 1) {
        // Check if there's a clue immediately after
        const nextClue = rowClues[i + 1]
        if (!nextClue || nextClue.position.col > endCol + 1) {
          bars.push({
            row,
            col: endCol,
            type: "right",
          })
        }
      }
    }
  }

  return bars
}

export function deriveBarPositionsFromDownClues(clues: Clue[], gridHeight: number): BarPosition[] {
  const bars: BarPosition[] = []

  // Sort clues by column, then by row
  const sortedClues = [...clues].sort((a, b) => {
    if (a.position.col !== b.position.col) {
      return a.position.col - b.position.col
    }
    return a.position.index - b.position.index
  })

  // Group clues by column
  const cluesByCol = new Map<number, Clue[]>()
  for (const clue of sortedClues) {
    const col = clue.position.col
    if (!cluesByCol.has(col)) {
      cluesByCol.set(col, [])
    }
    cluesByCol.get(col)!.push(clue)
  }

  // For each column, derive bars between clues
  for (const [col, colClues] of cluesByCol) {
    for (let i = 0; i < colClues.length; i++) {
      const clue = colClues[i]
      const answerLength = clue.answer.length
      const startRow = clue.position.index
      const endRow = startRow + answerLength - 1

      // Add top bar if this is not the first cell of the column
      if (startRow > 0) {
        bars.push({
          row: startRow,
          col,
          type: "top",
        })
      }

      // Add bottom bar if this is not the last cell of the column and there's another clue after
      if (endRow < gridHeight - 1) {
        // Check if there's a clue immediately after
        const nextClue = colClues[i + 1]
        if (!nextClue || nextClue.position.index > endRow + 1) {
          bars.push({
            row: endRow,
            col,
            type: "bottom",
          })
        }
      }
    }
  }

  return bars
}

export function deriveAllBarPositions(acrossClues: Clue[], downClues: Clue[], gridWidth: number, gridHeight: number): BarPosition[] {
  const acrossBars = deriveBarPositionsFromAcrossClues(acrossClues, gridWidth)
  const downBars = deriveBarPositionsFromDownClues(downClues, gridWidth, gridHeight)

  // Combine and deduplicate bars
  const allBars = [...acrossBars, ...downBars]
  const uniqueBars = new Map<string, BarPosition>()

  for (const bar of allBars) {
    const key = `${bar.row},${bar.col},${bar.type}`
    uniqueBars.set(key, bar)
  }

  return Array.from(uniqueBars.values())
}
