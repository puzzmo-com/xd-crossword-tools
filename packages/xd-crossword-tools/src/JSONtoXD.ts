import type { Clue, CrosswordJSON, Tile } from "xd-crossword-tools-parser"

export function resolveFullClueAnswer(rebusMap: CrosswordJSON["rebuses"], clue: Clue, splitChar: string) {
  // For simple cases (no rebus, no splits), just return the answer directly
  const hasRebus = clue.tiles.some((t) => t.type === "rebus")
  const hasSplits = clue.splits && clue.splits.length > 0

  if (!hasRebus && !hasSplits) {
    return clue.answer
  }

  // In order to correctly pipe rebus clues, we must temporarily substitute in rebus symbols
  const replacedWithSymbol = clue.tiles
    .map((t: Tile) => {
      if (t.type === "rebus") {
        return t.symbol
      } else if (t.type === "letter") {
        return t.letter
      } else if (t.type === "schrodinger") {
        // For Schrödinger tiles that appear as regular letter tiles with "*",
        // we need to get the actual letter from the answer
        const tileIndex = clue.tiles.indexOf(t)
        return clue.answer[tileIndex] || "*"
      } else if (t.type === "blank") {
        return "" // This shouldn't happen in a clue answer
      }
      throw new Error(`Invalid tile type: ${(t as any).type}`)
    })
    .join("")

  // now, apply splits after the replace
  const withSplits = addSplits(replacedWithSymbol, splitChar, clue.splits)

  // now, replace symbols with words again
  const answer = withSplits
    .split("")
    .map((char) => {
      if (rebusMap[char]) {
        return rebusMap[char]
      }
      return char
    })
    .join("")

  return answer
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
          .join(";")

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

  return xd
}
