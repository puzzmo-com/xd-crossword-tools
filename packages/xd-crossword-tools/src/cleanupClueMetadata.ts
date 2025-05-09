import { CrosswordJSON, Tile } from "xd-crossword-parser"

/** Re-creates the clue answer/tiles metadata from the grid section of the crossword */
export const cleanupClueMetadata = (xword: CrosswordJSON): void => {
  const acrossClues = xword.clues.across
  const downClues = xword.clues.down
  const tiles = xword.tiles
  const height = tiles.length

  if (height === 0) return // No grid, nothing to do
  const width = tiles[0].length

  // Process across clues
  for (const clue of acrossClues) {
    let answer = ""
    const startRow = clue.position.index
    let currentCol = clue.position.col

    while (currentCol < width) {
      const tile = tiles[startRow][currentCol]
      if (tile.type === "blank") break

      if (tile.type === "letter") {
        answer += tile.letter
      } else if (tile.type === "rebus") {
        // Assuming the full word is part of the answer for rebus tiles
        answer += tile.word
      }
      currentCol++
    }
    clue.answer = answer
    clue.tiles = tiles[startRow].slice(clue.position.col, currentCol)
  }

  // Process down clues
  for (const clue of downClues) {
    let answer = ""
    const startCol = clue.position.col
    let currentRow = clue.position.index
    const clueTiles: Tile[] = [] // Initialize array for down clue tiles

    while (currentRow < height) {
      const tile = tiles[currentRow][startCol]
      if (tile.type === "blank") break

      if (tile.type === "letter") {
        answer += tile.letter
        clueTiles.push(tile) // Add tile to the array
      } else if (tile.type === "rebus") {
        // Assuming the full word is part of the answer for rebus tiles
        answer += tile.word
        clueTiles.push(tile) // Add tile to the array
      }
      currentRow++
    }

    clue.answer = answer
    clue.tiles = clueTiles // Assign the collected tiles
  }
}
