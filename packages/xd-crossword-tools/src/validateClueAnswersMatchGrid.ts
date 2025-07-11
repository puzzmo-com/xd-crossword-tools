import type { CrosswordJSON, Clue, Tile, Position } from "xd-crossword-tools-parser"

export interface ValidationReport {
  type: "clue_grid_mismatch"
  position: Position
  length: number
  message: string
  clueNumber: number
  direction: "across" | "down"
  expectedAnswer: string
  actualAnswer: string
}

export function validateClueAnswersMatchGrid(json: CrosswordJSON): ValidationReport[] {
  const reports: ValidationReport[] = []
  const allClues = [...json.clues.across, ...json.clues.down]

  for (const clue of allClues) {
    // Skip clues with Schrödinger squares for now (TODO)
    const hasSchrodinger = clue.tiles.some((tile) => tile.type === "schrodinger")
    if (hasSchrodinger) {
      continue
    }

    // Skip clues with rebus squares for now (TODO)
    const hasRebus = clue.tiles.some((tile) => tile.type === "rebus")
    if (hasRebus) {
      continue
    }

    // Build the answer from the grid tiles
    const gridAnswer = buildAnswerFromTiles(clue.tiles)

    // Compare with the declared answer (without split characters)
    const declaredAnswer = clue.answer

    if (gridAnswer !== declaredAnswer) {
      // Find the position in the source for this clue
      // This would be the line number where the clue is defined
      const cluePosition = findCluePosition(json, clue)

      reports.push({
        type: "clue_grid_mismatch",
        position: cluePosition,
        length: declaredAnswer.length,
        message: `Clue ${clue.direction.toUpperCase()}${
          clue.number
        } answer doesn't match grid: expected "${declaredAnswer}" but grid has "${gridAnswer}"`,
        clueNumber: clue.number,
        direction: clue.direction,
        expectedAnswer: declaredAnswer,
        actualAnswer: gridAnswer,
      })
    }
  }

  return reports
}

function buildAnswerFromTiles(tiles: Tile[]): string {
  return tiles
    .map((tile) => {
      switch (tile.type) {
        case "letter":
          return tile.letter
        case "blank":
          return "" // This shouldn't happen in a valid clue
        case "rebus":
          // For now, we're skipping rebus validation
          // In the future, we'd return the full word: tile.word
          return tile.word
        case "schrodinger":
          // For now, we're skipping Schrödinger validation
          // In the future, we'd need to check all valid letters
          return tile.validLetters[0] || ""
      }
    })
    .join("")
}

function findCluePosition(json: CrosswordJSON, clue: Clue): { col: number; index: number } {
  // Try to find the clue in the report if available
  if (json.report && json.report.errors) {
    const clueError = json.report.errors.find(
      (err) => err.type === "clue_msg" && err.clueNum === clue.number && err.clueType === clue.direction
    )
    if (clueError) {
      return clueError.position
    }
  }

  // If we have editor info, we might have stored positions
  if (clue.metadata && clue.metadata["__position"]) {
    const pos = clue.metadata["__position"].split(",")
    return { col: parseInt(pos[0]), index: parseInt(pos[1]) }
  }

  // Default fallback - this isn't ideal but better than nothing
  // In a real implementation, we'd want to track line numbers during parsing
  return { col: 0, index: 0 }
}
