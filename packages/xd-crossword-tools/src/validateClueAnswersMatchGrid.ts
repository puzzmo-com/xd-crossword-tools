import type { CrosswordJSON, Clue, Tile, Report } from "xd-crossword-tools-parser"

export function validateClueAnswersMatchGrid(json: CrosswordJSON): Report[] {
  const reports: Report[] = []
  const allClues = [...json.clues.across, ...json.clues.down]
  const splitChar = json.meta.splitCharacter || "|"

  for (const clue of allClues) {
    // Skip clues with Schrödinger squares for now (TODO)
    const hasSchrodinger = clue.tiles.some((tile) => tile.type === "schrodinger")
    if (hasSchrodinger) continue

    // Skip clues with rebus squares for now (TODO)
    const hasRebus = clue.tiles.some((tile) => tile.type === "rebus")
    if (hasRebus) continue

    // Build the answer from the grid tiles
    const gridAnswer = buildAnswerFromTiles(clue.tiles)

    // Compare with the declared answer (without split characters)
    const splitCharRegex = new RegExp(splitChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    const declaredAnswer = clue.answer.replace(splitCharRegex, "")
    const normalizedGridAnswer = gridAnswer.replace(splitCharRegex, "")

    if (normalizedGridAnswer !== declaredAnswer) {
      // Find the position in the source for this clue
      // This would be the line number where the clue is defined
      const cluePosition = findCluePosition(json, clue)
      const clueRef = `${clue.direction.toUpperCase().slice(0, 1)}${clue.number}`

      const clueLineLength = clue.answer.toString().length

      reports.push({
        type: "clue_grid_mismatch" as const,
        position: cluePosition,
        length: clueLineLength,
        clueNum: clue.number,
        clueType: clue.direction,
        message: `Clue ${clueRef} answer doesn't match grid: expected "${declaredAnswer}" but grid has "${normalizedGridAnswer}"`,
        expectedAnswer: declaredAnswer,
        actualAnswer: normalizedGridAnswer,
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
  // If we have editor info, we might have stored positions
  if (clue.metadata && clue.metadata["body:line"]) {
    const lineNumber = parseInt(clue.metadata["body:line"])
    // Assuming format "1. Clue text ~ ABC"
    const col = 1 + clue.number.toString().length + 2 + clue.body.length + 3
    return { col, index: lineNumber }
  }

  // Default fallback - this isn't ideal but better than nothing
  // In a real implementation, we'd want to track line numbers during parsing
  return { col: 0, index: 0 }
}
