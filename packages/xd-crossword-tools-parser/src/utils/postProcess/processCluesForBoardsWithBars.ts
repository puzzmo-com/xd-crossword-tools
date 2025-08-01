import { CrosswordJSON, Tile } from "../../types"
import { RawClueData, PositionWithTiles } from "../clueNumbersFromBoard"

export interface BarPosition {
  row: number
  col: number
  type: "left" | "top"
}

export const validateWeCanUseThisCrossword = (tiles: CrosswordJSON["tiles"]) => {
  // we only support barred grids with no rebuses or schrodingers today
  for (const row of tiles) {
    for (const tile of row) {
      if (tile.type === "rebus" || tile.type === "schrodinger" || tile.type === "blank") {
        return false
      }
    }
  }

  return true
}

export function getBarredCluePositions(
  tiles: CrosswordJSON["tiles"],
  rawClues: Map<string, RawClueData>,
  metadata: Record<string, string>
): PositionWithTiles[] {
  const positions: PositionWithTiles[] = []
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

  const acrossPositions = deriveAcrossCluePositions(tiles, acrossClues, metadata.splitcharacter)
  const downPositions = deriveDownCluePositions(tiles, downClues, metadata.splitcharacter)

  // Use a more sophisticated bar derivation that analyzes the grid structure
  const allBars = deriveAllBarsFromGridStructure(tiles, acrossPositions, downPositions)

  // Apply bars to tiles
  for (const bar of allBars) {
    const tile = tiles[bar.row][bar.col] as any
    if (!tile.design) tile.design = []
    const barDesign = `bar-${bar.type}`
    if (!tile.design.includes(barDesign)) {
      tile.design.push(barDesign)
    }
  }

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

  positions.push(...Array.from(allPositions.values()))
  return positions
}

function deriveAcrossCluePositions(
  tiles: CrosswordJSON["tiles"],
  acrossClues: RawClueData[],
  splitCharacter: string | undefined
): PositionWithTiles[] {
  const positions: PositionWithTiles[] = []
  const gridHeight = tiles.length
  const gridWidth = tiles[0]?.length || 0
  const usedPositions = new Set<string>()

  // Sort clues by number to process them in order
  const sortedClues = [...acrossClues].sort((a, b) => a.num - b.num)

  for (const clue of sortedClues) {
    // Split the answer by split character to get individual words
    const words = splitCharacter ? clue.answer.split(splitCharacter) : [clue.answer]

    // Process each word separately
    for (const word of words) {
      const answer = word.toUpperCase()
      if (answer.length === 0) continue

      // Find position in grid where the answer letters match the grid letters
      let foundPosition = false

      for (let row = 0; row < gridHeight && !foundPosition; row++) {
        for (let col = 0; col <= gridWidth - answer.length && !foundPosition; col++) {
          // Check if this position is already used
          const posKey = `${row},${col}`
          if (usedPositions.has(posKey)) continue

          // Check if this position matches the answer letters
          let matches = true

          for (let i = 0; i < answer.length; i++) {
            const tile = tiles[row][col + i]

            if (tile.type === "blank") {
              matches = false
              break
            }

            // Get the letter from the tile
            let tileChar = ""
            if (tile.type === "letter") {
              tileChar = tile.letter.toUpperCase()
            } else if (tile.type === "rebus") {
              throw new Error(`Rebus tiles are not supported in barred grids: ${tile.word}`)
            } else if (tile.type === "schrodinger") {
              // For schrodinger, check if any valid letter matches
              throw new Error(`Schrodinger tiles are not supported in barred grids: ${tile.validLetters.join(", ")}`)
            }

            if (tileChar !== answer[i]) {
              matches = false
              break
            }
          }

          if (matches) {
            // Found a matching position for this clue
            const relatedTiles: Tile[] = []
            for (let i = 0; i < answer.length; i++) {
              relatedTiles.push(tiles[row][col + i])
            }

            positions.push({
              position: { col, index: row },
              tiles: { across: relatedTiles },
            })

            // Mark this position as used
            usedPositions.add(posKey)
            foundPosition = true
          }
        }
      }
    }
  }

  return positions
}

function deriveDownCluePositions(
  tiles: CrosswordJSON["tiles"],
  downClues: RawClueData[],
  splitCharacter: string | undefined
): PositionWithTiles[] {
  const positions: PositionWithTiles[] = []
  const gridHeight = tiles.length
  const gridWidth = tiles[0]?.length || 0
  const usedPositions = new Set<string>()

  // Sort clues by number to process them in order
  const sortedClues = [...downClues].sort((a, b) => a.num - b.num)

  for (const clue of sortedClues) {
    // Split the answer by split character to get individual words
    const words = splitCharacter ? clue.answer.split(splitCharacter) : [clue.answer]

    // Process each word separately
    for (const word of words) {
      const answer = word.toUpperCase()
      if (answer.length === 0) continue

      // Find position in grid where the answer letters match the grid letters
      let foundPosition = false

      for (let col = 0; col < gridWidth && !foundPosition; col++) {
        for (let row = 0; row <= gridHeight - answer.length && !foundPosition; row++) {
          // Check if this position is already used
          const posKey = `${row},${col}`
          if (usedPositions.has(posKey)) continue

          // Check if this position matches the answer letters
          let matches = true

          for (let i = 0; i < answer.length; i++) {
            const tile = tiles[row + i][col]

            if (tile.type === "blank") {
              matches = false
              break
            }

            // Get the letter from the tile
            let tileChar = ""
            if (tile.type === "letter") {
              tileChar = tile.letter.toUpperCase()
            } else if (tile.type === "rebus") {
              throw new Error(`Rebus tiles are not supported in barred grids: ${tile.word}`)
            } else if (tile.type === "schrodinger") {
              // For schrodinger, check if any valid letter matches
              throw new Error(`Schrodinger tiles are not supported in barred grids: ${tile.validLetters.join(", ")}`)
            }

            if (tileChar !== answer[i]) {
              matches = false
              break
            }
          }

          if (matches) {
            // Found a matching position for this clue
            const relatedTiles: Tile[] = []
            for (let i = 0; i < answer.length; i++) {
              relatedTiles.push(tiles[row + i][col])
            }

            positions.push({
              position: { col, index: row },
              tiles: { down: relatedTiles },
            })

            // Mark this position as used
            usedPositions.add(posKey)
            foundPosition = true
          }
        }
      }
    }
  }

  return positions
}

function deriveAllBarsFromGridStructure(
  tiles: CrosswordJSON["tiles"],
  acrossPositions: PositionWithTiles[],
  downPositions: PositionWithTiles[]
): BarPosition[] {
  const bars: BarPosition[] = []
  const gridHeight = tiles.length
  const gridWidth = tiles[0]?.length || 0

  // Create word membership maps to track which word each cell belongs to
  const acrossWordMap = new Map<string, number>()
  const downWordMap = new Map<string, number>()

  // Map across word cells
  acrossPositions.forEach((pos, wordIndex) => {
    if (!pos.tiles.across) return
    const row = pos.position.index
    const startCol = pos.position.col
    for (let i = 0; i < pos.tiles.across.length; i++) {
      acrossWordMap.set(`${row},${startCol + i}`, wordIndex)
    }
  })

  // Map down word cells
  downPositions.forEach((pos, wordIndex) => {
    if (!pos.tiles.down) return
    const col = pos.position.col
    const startRow = pos.position.index
    for (let i = 0; i < pos.tiles.down.length; i++) {
      downWordMap.set(`${startRow + i},${col}`, wordIndex)
    }
  })

  // Algorithm: Add bars where adjacent cells have different word context
  // Key insight: bars separate cells that differ in EITHER across OR down word membership
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      if (tiles[row][col].type !== "letter") continue

      const cellKey = `${row},${col}`
      const acrossWord = acrossWordMap.get(cellKey)
      const downWord = downWordMap.get(cellKey)

      // Left bar: more nuanced logic based on word boundaries
      if (col > 0 && tiles[row][col - 1].type === "letter") {
        const leftKey = `${row},${col - 1}`
        const leftAcrossWord = acrossWordMap.get(leftKey)
        const leftDownWord = downWordMap.get(leftKey)

        let needsLeftBar = false

        // Primary case: different across words (word boundary)
        if (acrossWord !== leftAcrossWord) {
          needsLeftBar = true
        }
        // Secondary case: both cells are isolated horizontally but belong to different down words
        else if (acrossWord === undefined && leftAcrossWord === undefined && downWord !== leftDownWord) {
          needsLeftBar = true
        }

        if (needsLeftBar) {
          bars.push({ row, col, type: "left" })
        }
      }

      // Top bar: more nuanced logic based on word boundaries
      if (row > 0 && tiles[row - 1][col].type === "letter") {
        const topKey = `${row - 1},${col}`
        const topAcrossWord = acrossWordMap.get(topKey)
        const topDownWord = downWordMap.get(topKey)

        let needsTopBar = false

        // Primary case: different down words (word boundary)
        if (downWord !== topDownWord) {
          needsTopBar = true
        }
        // Secondary case: both cells are isolated vertically but belong to different across words
        else if (downWord === undefined && topDownWord === undefined && acrossWord !== topAcrossWord) {
          needsTopBar = true
        }

        if (needsTopBar) {
          bars.push({ row, col, type: "top" })
        }
      }
    }
  }

  return bars
}
