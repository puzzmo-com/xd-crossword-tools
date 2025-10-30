import { CrosswordJSON, Tile } from "../../types"
import { RawClueData, PositionWithTiles } from "../clueNumbersFromBoard"

export const validateWeCanUseThisCrossword = (tiles: CrosswordJSON["tiles"]) => {
  // we only support barred grids with no rebuses or schrodingers today
  for (const row of tiles) {
    for (const tile of row) {
      if (tile.type === "rebus" || tile.type === "schrodinger") {
        return false
      }
    }
  }

  return true
}

export function getBarredCluePositions(
  tiles: CrosswordJSON["tiles"],
  rawClues: Map<string, RawClueData>,
  metadata: Record<string, string>,
  crosswordJSON?: CrosswordJSON
): PositionWithTiles[] {
  const acrossClues: RawClueData[] = []
  const downClues: RawClueData[] = []

  for (const clue of rawClues.values()) {
    if (clue.dir === "A") {
      acrossClues.push(clue)
    } else if (clue.dir === "D") {
      downClues.push(clue)
    }
  }

  acrossClues.sort((a, b) => a.num - b.num)
  downClues.sort((a, b) => a.num - b.num)

  // Check if we have design information with explicit bar data
  if (crosswordJSON?.design) {
    return getBarredCluePositionsFromDesign(tiles, acrossClues, downClues, metadata.splitcharacter, crosswordJSON.design)
  }

  // No design information available - barred grids require explicit bar data
  throw new Error("Barred grids require explicit design information with bar positions. Cannot infer bar positions from grid structure.")
}

function getBarredCluePositionsFromDesign(
  tiles: CrosswordJSON["tiles"],
  acrossClues: RawClueData[],
  downClues: RawClueData[],
  splitCharacter: string | undefined,
  design: { styles: Record<string, any>; positions: string[][] }
): PositionWithTiles[] {
  const gridHeight = tiles.length
  const gridWidth = tiles[0]?.length || 0

  // Create a map of bar information from the design section
  const barMap = new Map<string, { left: boolean; top: boolean }>()

  // Parse the design information to extract bar positions
  for (let row = 0; row < design.positions.length && row < gridHeight; row++) {
    for (let col = 0; col < design.positions[row].length && col < gridWidth; col++) {
      const styleKey = design.positions[row][col]
      if (styleKey && design.styles[styleKey]) {
        const style = design.styles[styleKey]
        const cellKey = `${row},${col}`
        barMap.set(cellKey, {
          left: style["bar-left"] === "true",
          top: style["bar-top"] === "true",
        })
      }
    }
  }

  // Apply bars to tiles for visual consistency
  for (const [cellKey, bars] of barMap) {
    const [row, col] = cellKey.split(",").map(Number)
    const tile = tiles[row][col] as any
    if (!tile.design) tile.design = []

    if (bars.left && !tile.design.includes("bar-left")) {
      tile.design.push("bar-left")
    }
    if (bars.top && !tile.design.includes("bar-top")) {
      tile.design.push("bar-top")
    }
  }

  // Find word segments using bar information
  const acrossPositions = findWordsFromBars(tiles, acrossClues, splitCharacter, barMap, "across")
  const downPositions = findWordsFromBars(tiles, downClues, splitCharacter, barMap, "down")

  // Combine positions, handling clues that share the same starting position
  const allPositions = new Map<string, PositionWithTiles>()

  // Add across clues
  for (const pos of acrossPositions) {
    const key = `${pos.position.index},${pos.position.col}`
    if (!allPositions.has(key)) {
      allPositions.set(key, { position: pos.position, tiles: {} })
    }
    allPositions.get(key)!.tiles.across = pos.tiles.across
  }

  // Add down clues
  for (const pos of downPositions) {
    const key = `${pos.position.index},${pos.position.col}`
    if (!allPositions.has(key)) {
      allPositions.set(key, { position: pos.position, tiles: {} })
    }
    allPositions.get(key)!.tiles.down = pos.tiles.down
  }

  return Array.from(allPositions.values())
}

function findWordsFromBars(
  tiles: CrosswordJSON["tiles"],
  clues: RawClueData[],
  splitCharacter: string | undefined,
  barMap: Map<string, { left: boolean; top: boolean }>,
  direction: "across" | "down"
): PositionWithTiles[] {
  const gridHeight = tiles.length
  const gridWidth = tiles[0]?.length || 0
  const positions: PositionWithTiles[] = []
  const usedPositions = new Set<string>()

  for (const clue of clues) {
    const words = splitCharacter ? clue.answer.split(splitCharacter) : [clue.answer]

    for (const word of words) {
      const answer = word.toUpperCase()
      if (answer.length === 0) continue

      let foundPosition = false

      // Search the grid for word positions based on bar boundaries
      if (direction === "across") {
        for (let row = 0; row < gridHeight && !foundPosition; row++) {
          for (let col = 0; col <= gridWidth - answer.length && !foundPosition; col++) {
            const posKey = `${row},${col}`
            if (usedPositions.has(posKey)) continue

            if (isValidWordPosition(tiles, answer, row, col, direction, barMap)) {
              const relatedTiles: Tile[] = []
              for (let i = 0; i < answer.length; i++) {
                relatedTiles.push(tiles[row][col + i])
              }

              positions.push({
                position: { col, index: row },
                tiles: { across: relatedTiles },
              })

              usedPositions.add(posKey)
              foundPosition = true
            }
          }
        }
      } else {
        // down
        for (let col = 0; col < gridWidth && !foundPosition; col++) {
          for (let row = 0; row <= gridHeight - answer.length && !foundPosition; row++) {
            const posKey = `${row},${col}`
            if (usedPositions.has(posKey)) continue

            if (isValidWordPosition(tiles, answer, row, col, direction, barMap)) {
              const relatedTiles: Tile[] = []
              for (let i = 0; i < answer.length; i++) {
                relatedTiles.push(tiles[row + i][col])
              }

              positions.push({
                position: { col, index: row },
                tiles: { down: relatedTiles },
              })

              usedPositions.add(posKey)
              foundPosition = true
            }
          }
        }
      }
    }
  }

  return positions
}

function isValidWordPosition(
  tiles: CrosswordJSON["tiles"],
  answer: string,
  startRow: number,
  startCol: number,
  direction: "across" | "down",
  barMap: Map<string, { left: boolean; top: boolean }>
): boolean {
  const gridHeight = tiles.length
  const gridWidth = tiles[0]?.length || 0

  // Check if letters match
  for (let i = 0; i < answer.length; i++) {
    const row = direction === "across" ? startRow : startRow + i
    const col = direction === "across" ? startCol + i : startCol

    if (row >= gridHeight || col >= gridWidth) return false

    const tile = tiles[row][col]
    if (tile.type !== "letter") return false
    if (tile.letter.toUpperCase() !== answer[i]) return false
  }

  // Check that this word segment is properly bounded by bars
  const wordEndRow = direction === "across" ? startRow : startRow + answer.length - 1
  const wordEndCol = direction === "across" ? startCol + answer.length - 1 : startCol

  // Check start boundary
  if (direction === "across") {
    // For across words, there should be a left bar at the start OR we're at the grid edge OR there's a blank tile to the left
    if (startCol > 0) {
      const bars = barMap.get(`${startRow},${startCol}`)
      const leftTile = tiles[startRow][startCol - 1]
      if (!bars?.left && leftTile.type === "letter") {
        return false // Word should be separated by a bar
      }
    }
  } else {
    // For down words, there should be a top bar at the start OR we're at the grid edge OR there's a blank tile above
    if (startRow > 0) {
      const bars = barMap.get(`${startRow},${startCol}`)
      const topTile = tiles[startRow - 1][startCol]
      if (!bars?.top && topTile.type === "letter") {
        return false // Word should be separated by a bar
      }
    }
  }

  // Check end boundary
  if (direction === "across") {
    // For across words, there should be a left bar after the end OR we're at the grid edge OR there's a blank tile to the right
    if (wordEndCol < gridWidth - 1) {
      const bars = barMap.get(`${wordEndRow},${wordEndCol + 1}`)
      const rightTile = tiles[wordEndRow][wordEndCol + 1]
      if (!bars?.left && rightTile.type === "letter") {
        return false // Word should be separated by a bar
      }
    }
  } else {
    // For down words, there should be a top bar after the end OR we're at the grid edge OR there's a blank tile below
    if (wordEndRow < gridHeight - 1) {
      const bars = barMap.get(`${wordEndRow + 1},${wordEndCol}`)
      const bottomTile = tiles[wordEndRow + 1][wordEndCol]
      if (!bars?.top && bottomTile.type === "letter") {
        return false // Word should be separated by a bar
      }
    }
  }

  // Check that there are no bars within the word
  for (let i = 1; i < answer.length; i++) {
    const row = direction === "across" ? startRow : startRow + i
    const col = direction === "across" ? startCol + i : startCol
    const bars = barMap.get(`${row},${col}`)

    if (direction === "across" && bars?.left) {
      return false // There shouldn't be a left bar within an across word
    }
    if (direction === "down" && bars?.top) {
      return false // There shouldn't be a top bar within a down word
    }
  }

  return true
}
