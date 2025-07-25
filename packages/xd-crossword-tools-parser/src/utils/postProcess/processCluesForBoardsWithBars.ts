import { CrosswordJSON, Tile, Clue } from "../../types"
import { RawClueData, PositionWithTiles } from "../clueNumbersFromBoard"

interface BarPosition {
  row: number
  col: number
  type: "left" | "right" | "top" | "bottom"
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

  const acrossPositions = _deriveAcrossCluePositions(tiles, acrossClues, metadata.splitcharacter)
  const downPositions = _deriveDownCluePositions(tiles, downClues, metadata.splitcharacter)

  console.log("DEBUG: Found", acrossPositions.length, "across positions and", downPositions.length, "down positions")

  //   // Use existing derivation functions to determine clue positions algorithmically

  //   console.log("DEBUG: Found", acrossPositions.length, "across positions and", downPositions.length, "down positions")

  //   // Convert positions to Clue format for existing bar derivation functions
    const acrossCluesForDerivation = acrossPositions.map((pos, index) => {
      const answer = pos.tiles.across
        ?.map((tile) =>
          tile.type === "letter"
            ? tile.letter
            : tile.type === "rebus"
            ? tile.word
            : tile.type === "schrodinger"
            ? tile.validLetters[0] || "A"
            : "A"
        )
        .join("") || ""
      
      console.log(`DEBUG: Across clue at (${pos.position.index},${pos.position.col}) answer: "${answer}" length: ${answer.length}`)
      
      return {
        number: index + 1,
        position: pos.position,
        answer,
        tiles: pos.tiles.across || [],
        direction: "across" as const,
        body: "",
        display: [],
      }
    })

    const downCluesForDerivation = downPositions.map((pos, index) => {
      const answer = pos.tiles.down
        ?.map((tile) =>
          tile.type === "letter"
            ? tile.letter
            : tile.type === "rebus"
            ? tile.word
            : tile.type === "schrodinger"
            ? tile.validLetters[0] || "A"
            : "A"
        )
        .join("") || ""
      
      console.log(`DEBUG: Down clue at (${pos.position.index},${pos.position.col}) answer: "${answer}" length: ${answer.length}`)
      
      return {
        number: index + 1,
        position: pos.position,
        answer,
        tiles: pos.tiles.down || [],
        direction: "down" as const,
        body: "",
        display: [],
      }
    })

    // Use a more sophisticated bar derivation that analyzes the grid structure
    const gridHeight = tiles.length
    const gridWidth = tiles[0]?.length || 0

    const allBars = _deriveAllBarsFromGridStructure(tiles, acrossPositions, downPositions)
    console.log("DEBUG: Derived bars:", allBars)

    // Apply bars to tiles
    for (const bar of allBars) {
      const tile = tiles[bar.row][bar.col] as any
      if (!tile.design) tile.design = []
      const barDesign = `bar-${bar.type}`
      if (!tile.design.includes(barDesign)) {
        tile.design.push(barDesign)
        console.log(`DEBUG: Added ${barDesign} at (${bar.row},${bar.col})`)
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

function _addBarsFromCluePositions(
  tiles: CrosswordJSON["tiles"],
  acrossPositions: PositionWithTiles[],
  downPositions: PositionWithTiles[]
) {
  console.log("DEBUG: Adding bars for", acrossPositions.length, "across positions and", downPositions.length, "down positions")

  // Create a map of occupied positions to avoid placing redundant bars
  const occupiedRanges = new Set<string>()

  // Mark all occupied horizontal ranges
  for (const pos of acrossPositions) {
    if (!pos.tiles.across) continue
    const row = pos.position.index
    const startCol = pos.position.col
    const endCol = startCol + pos.tiles.across.length - 1

    for (let col = startCol; col <= endCol; col++) {
      occupiedRanges.add(`across:${row}:${col}`)
    }
  }

  // Mark all occupied vertical ranges
  for (const pos of downPositions) {
    if (!pos.tiles.down) continue
    const col = pos.position.col
    const startRow = pos.position.index
    const endRow = startRow + pos.tiles.down.length - 1

    for (let row = startRow; row <= endRow; row++) {
      occupiedRanges.add(`down:${row}:${col}`)
    }
  }

  // Add bars for across clues - only where they separate from other words
  for (const pos of acrossPositions) {
    if (!pos.tiles.across) continue

    const row = pos.position.index
    const startCol = pos.position.col
    const endCol = startCol + pos.tiles.across.length - 1

    console.log(`DEBUG: Processing across clue at (${row},${startCol}) length ${pos.tiles.across.length}, endCol=${endCol}`)

    // Add left bar if there's a letter immediately to the left (not part of this word)
    if (startCol > 0 && tiles[row][startCol - 1].type !== "blank") {
      const tile = tiles[row][startCol] as any
      if (!tile.design) tile.design = []
      if (!tile.design.includes("bar-left")) {
        tile.design.push("bar-left")
        console.log(`DEBUG: Added left bar at (${row},${startCol})`)
      }
    }

    // Add right bar if there's a letter immediately to the right (not part of this word)
    if (endCol < tiles[row].length - 1 && tiles[row][endCol + 1].type !== "blank") {
      const tile = tiles[row][endCol] as any
      if (!tile.design) tile.design = []
      if (!tile.design.includes("bar-right")) {
        tile.design.push("bar-right")
        console.log(`DEBUG: Added right bar at (${row},${endCol})`)
      }
    }
  }

  // Add bars for down clues - only where they separate from other words
  for (const pos of downPositions) {
    if (!pos.tiles.down) continue

    const col = pos.position.col
    const startRow = pos.position.index
    const endRow = startRow + pos.tiles.down.length - 1

    console.log(`DEBUG: Processing down clue at (${startRow},${col}) length ${pos.tiles.down.length}, endRow=${endRow}`)

    // Add top bar if there's a letter immediately above (not part of this word)
    if (startRow > 0 && tiles[startRow - 1][col].type !== "blank") {
      const tile = tiles[startRow][col] as any
      if (!tile.design) tile.design = []
      if (!tile.design.includes("bar-top")) {
        tile.design.push("bar-top")
        console.log(`DEBUG: Added top bar at (${startRow},${col})`)
      }
    }

    // Add bottom bar if there's a letter immediately below (not part of this word)
    if (endRow < tiles.length - 1 && tiles[endRow + 1][col].type !== "blank") {
      const tile = tiles[endRow][col] as any
      if (!tile.design) tile.design = []
      if (!tile.design.includes("bar-bottom")) {
        tile.design.push("bar-bottom")
        console.log(`DEBUG: Added bottom bar at (${endRow},${col})`)
      }
    }
  }
}

function _deriveAcrossCluePositions(
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
    console.log(`DEBUG: Across clue ${clue.num}: words [${words.map(w => `"${w}"`).join(", ")}]`)
    
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
            console.log(`DEBUG: Found across word "${answer}" at (${row},${col})`)
          }
        }
      }

      if (!foundPosition) {
        console.log(`DEBUG: Could not find position for across word: "${answer}"`)
      }
    }
  }

  return positions
}

function _deriveDownCluePositions(tiles: CrosswordJSON["tiles"], downClues: RawClueData[], splitCharacter: string | undefined): PositionWithTiles[] {
  const positions: PositionWithTiles[] = []
  const gridHeight = tiles.length
  const gridWidth = tiles[0]?.length || 0
  const usedPositions = new Set<string>()

  // Sort clues by number to process them in order
  const sortedClues = [...downClues].sort((a, b) => a.num - b.num)

  for (const clue of sortedClues) {
    // Split the answer by split character to get individual words
    const words = splitCharacter ? clue.answer.split(splitCharacter) : [clue.answer]
    console.log(`DEBUG: Down clue ${clue.num}: words [${words.map(w => `"${w}"`).join(", ")}]`)
    
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
            console.log(`DEBUG: Found down word "${answer}" at (${row},${col})`)
          }
        }
      }

      if (!foundPosition) {
        console.log(`DEBUG: Could not find position for down word: "${answer}"`)
      }
    }
  }

  return positions
}

function _deriveBarPositionsFromAcrossClues(clues: Clue[], gridWidth: number): BarPosition[] {
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

      // Add right bar if this is not the last cell of the row
      if (endCol < gridWidth - 1) {
        bars.push({
          row,
          col: endCol,
          type: "right",
        })
      }
    }
  }

  return bars
}

function _deriveBarPositionsFromDownClues(clues: Clue[], gridHeight: number): BarPosition[] {
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

      // Add bottom bar if this is not the last cell of the column
      if (endRow < gridHeight - 1) {
        bars.push({
          row: endRow,
          col,
          type: "bottom",
        })
      }
    }
  }

  return bars
}

function _deriveAllBarsFromGridStructure(
  tiles: CrosswordJSON["tiles"],
  acrossPositions: PositionWithTiles[],
  downPositions: PositionWithTiles[]
): BarPosition[] {
  const bars: BarPosition[] = []
  const gridHeight = tiles.length
  const gridWidth = tiles[0]?.length || 0

  // Create a map of occupied cells by direction
  const acrossOccupied = new Set<string>()
  const downOccupied = new Set<string>()

  // Mark all cells occupied by across words
  for (const pos of acrossPositions) {
    if (!pos.tiles.across) continue
    const row = pos.position.index
    const startCol = pos.position.col
    for (let i = 0; i < pos.tiles.across.length; i++) {
      acrossOccupied.add(`${row},${startCol + i}`)
    }
  }

  // Mark all cells occupied by down words
  for (const pos of downPositions) {
    if (!pos.tiles.down) continue
    const col = pos.position.col
    const startRow = pos.position.index
    for (let i = 0; i < pos.tiles.down.length; i++) {
      downOccupied.add(`${startRow + i},${col}`)
    }
  }

  // Add bars where across words need separation
  for (let row = 0; row < gridHeight; row++) {
    let inAcrossWord = false
    let acrossStart = -1

    for (let col = 0; col <= gridWidth; col++) {
      const cellKey = `${row},${col}`
      const hasAcross = acrossOccupied.has(cellKey)

      if (hasAcross && !inAcrossWord) {
        // Starting a new across word
        inAcrossWord = true
        acrossStart = col
        // Add left bar if there's a letter to the left that's not part of this word
        if (col > 0 && tiles[row][col - 1].type === "letter") {
          bars.push({ row, col, type: "left" })
        }
      } else if (!hasAcross && inAcrossWord) {
        // Ending an across word
        inAcrossWord = false
        // Add right bar if there's a letter to the right
        if (col < gridWidth && tiles[row][col].type === "letter") {
          bars.push({ row, col: col - 1, type: "right" })
        }
      }
    }
  }

  // Add bars where down words need separation
  for (let col = 0; col < gridWidth; col++) {
    let inDownWord = false
    let downStart = -1

    for (let row = 0; row <= gridHeight; row++) {
      const cellKey = `${row},${col}`
      const hasDown = downOccupied.has(cellKey)

      if (hasDown && !inDownWord) {
        // Starting a new down word
        inDownWord = true
        downStart = row
        // Add top bar if there's a letter above that's not part of this word
        if (row > 0 && tiles[row - 1][col].type === "letter") {
          bars.push({ row, col, type: "top" })
        }
      } else if (!hasDown && inDownWord) {
        // Ending a down word
        inDownWord = false
        // Add bottom bar if there's a letter below
        if (row < gridHeight && tiles[row][col].type === "letter") {
          bars.push({ row: row - 1, col, type: "bottom" })
        }
      }
    }
  }

  return bars
}
