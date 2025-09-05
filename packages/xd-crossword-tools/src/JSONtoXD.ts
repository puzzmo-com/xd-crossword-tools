import type { Clue, CrosswordJSON, Tile } from "xd-crossword-tools-parser"

export function resolveFullClueAnswer(rebusMap: CrosswordJSON["rebuses"], clue: Clue, splitChar: string) {
  // For simple cases (no rebus, no splits, no internal splits), just return the answer directly
  const hasRebus = clue.tiles.some((t) => t.type === "rebus")
  const hasSplits = clue.splits && clue.splits.length > 0
  const hasInternalSplits = clue.rebusInternalSplits && Object.keys(clue.rebusInternalSplits).length > 0

  if (!hasRebus && !hasSplits && !hasInternalSplits) {
    return clue.answer
  }

  // Build the answer tile by tile, applying internal splits to rebus tiles
  let result = ""
  let currentCharIndex = 0
  
  for (let tileIndex = 0; tileIndex < clue.tiles.length; tileIndex++) {
    const tile = clue.tiles[tileIndex]
    
    // Add split before this tile if needed
    if (clue.splits && clue.splits.includes(tileIndex - 1)) {
      result += splitChar
    }
    
    if (tile.type === "rebus") {
      const rebusWord = tile.word
      const internalSplits = clue.rebusInternalSplits?.[tileIndex] || []
      
      // Add each character of the rebus word, with internal splits
      for (let i = 0; i < rebusWord.length; i++) {
        if (internalSplits.includes(i - 1)) {
          result += splitChar
        }
        result += rebusWord[i]
      }
    } else if (tile.type === "letter") {
      result += tile.letter
    } else if (tile.type === "schrodinger") {
      // Get the actual letter from the answer at this position
      result += clue.answer[currentCharIndex] || "*"
    } else if (tile.type === "blank") {
      // This shouldn't happen in a clue answer
      result += ""
    } else {
      throw new Error(`Invalid tile type: ${(tile as any).type}`)
    }
    
    // Update character index for Schrödinger tiles
    if (tile.type === "rebus") {
      currentCharIndex += tile.word.length
    } else if (tile.type !== "blank") {
      currentCharIndex++
    }
  }

  return result
}

export function addSplits(answer: string, splitChar: string, splits?: number[]): string {
  if (!splits) return answer

  let withSplits = ""
  for (let i = 0; i < answer.length; i++) {
    if (splits.includes(i)) {
      withSplits += answer[i]
      withSplits += splitChar
    } else {
      withSplits += answer[i]
    }
  }
  return withSplits
}

export const JSONToXD = (json: CrosswordJSON): string => {
  let xd = ""
  let splitChar = ""

  xd += `## Metadata\n\n`
  Object.entries(json.meta).forEach(([key, value]) => {
    if (key.includes(":")) return
    if (key === "splitcharacter") {
      splitChar = value
    }
    xd += `${key}: ${value}\n`
  })

  xd += `\n## Grid\n\n`
  xd += json.tiles
    .map((row) =>
      row
        .map((tile: Tile) => {
          switch (tile.type) {
            case "letter":
              return tile.letter
            case "blank":
              return "."
            case "rebus":
              return tile.symbol
            case "schrodinger":
              return "*"
            default:
              throw new Error(`Unknown tile type: ${(tile as any).type}`)
          }
        })
        .join("")
    )
    .join("\n")

  const getCluesXD = (clues: Clue[], direction: "A" | "D") => {
    return clues
      .map((clue) => {
        const final = resolveFullClueAnswer(json.rebuses, clue, splitChar)
        let line = `${direction}${clue.number}. ${clue.body} ~ ${final}`
        if (clue.metadata) {
          let printed = false
          for (const key of Object.keys(clue.metadata)) {
            if (key.includes(":")) continue
            printed = true
            line += `\n${direction}${clue.number} ^${key}: ${clue.metadata[key]}`
          }
          if (printed) line += "\n"
        }
        return line
      })
      .join("\n")
  }

  xd += `\n\n## Clues\n\n`
  xd += getCluesXD(json.clues.across, "A")

  xd += `\n\n`
  xd += getCluesXD(json.clues.down, "D")

  if (json.metapuzzle) {
    xd += `\n\n## Metapuzzle\n\n`
    xd += `${json.metapuzzle.clue}\n\n> ${json.metapuzzle.answer}`
  }

  if (json.design) {
    xd += `\n\n## Design\n\n`

    xd += "<style>\n"
    xd += Object.entries(json.design.styles)
      .map((key) => {
        const content = Object.entries(key[1])
          .map(([key, value]) => `${key}: ${value}`)
          .join("; ")

        return `${key[0]} { ${content} }`
      })
      .join("\n")

    xd += "\n</style>\n\n"

    xd += `${json.design.positions
      .map((row, rowI) => {
        let line = ""
        json.tiles[0].forEach((_, i) => {
          if (row[i]) {
            line += row[i]
          } else {
            if (json.tiles[rowI][i].type === "blank") {
              line += "#"
            } else {
              line += "."
            }
          }
        })
        return line
      })
      .join("\n")}\n`
  }

  if (json.start) {
    xd += `\n\n## Start\n\n`

    xd += `${json.start
      .map((row, rowI) => {
        let line = ""
        json.tiles[0].forEach((_, i) => {
          if (row[i]) {
            line += row[i]
          } else {
            if (json.tiles[rowI][i].type === "blank") {
              line += "#"
            } else {
              line += "."
            }
          }
        })
        return line
      })
      .join("\n")}\n`
  }

  if (json.notes) {
    xd += `\n\n## Notes\n\n`
    xd += json.notes
  }

  // Add unknown sections
  for (const [key, section] of Object.entries(json.unknownSections)) {
    xd += `\n\n## ${section.title}\n\n`
    xd += section.content
  }

  return xd
}
