import type { CrosswordJSON } from "xd-crossword-tools"
// @jaredreisinger/react-crossword data format
export interface CrosswordData {
  across: Record<number, ClueData>
  down: Record<number, ClueData>
}

export interface ClueData {
  clue: string
  answer: string
  row: number
  col: number
}

export function convertToCrosswordFormat(xdJson: CrosswordJSON): CrosswordData {
  const across: Record<number, ClueData> = {}
  const down: Record<number, ClueData> = {}

  // Process across clues
  for (const clue of xdJson.clues.across) {
    const cleanAnswer = clue.answer.replace(/[^A-Z]/g, "") // Remove non-letter characters
    across[clue.number] = {
      clue: clue.body,
      answer: cleanAnswer,
      row: clue.position.index,
      col: clue.position.col,
    }
  }

  // Process down clues
  for (const clue of xdJson.clues.down) {
    const cleanAnswer = clue.answer.replace(/[^A-Z]/g, "") // Remove non-letter characters
    down[clue.number] = {
      clue: clue.body,
      answer: cleanAnswer,
      row: clue.position.index,
      col: clue.position.col,
    }
  }

  return {
    across,
    down,
  }
}
