import { serializeDesignRules, spellLetterTile } from "xd-crossword-tools-parser"
import type { Clue, CrosswordJSON, Tile } from "xd-crossword-tools-parser"

/** The letters a tile contributes to an answer, with the rest of the answer used to tell a Schrödinger square's values apart */
const lettersForTile = (tile: Tile, restOfAnswer: string) => {
  switch (tile.type) {
    case "rebus":
      return tile.word
    case "letter":
      return spellLetterTile(tile)
    case "schrodinger": {
      const values = tile.validOptions?.length ? tile.validOptions : [...tile.validRebuses.map((r) => r.letters), ...tile.validLetters]
      const spelled = values.filter((value) => restOfAnswer.startsWith(value)).sort((a, b) => [...b].length - [...a].length)[0]
      return spelled || [...restOfAnswer][0] || "*"
    }
    case "blank":
      // This shouldn't happen in a clue answer
      return ""
    default:
      throw new Error(`Invalid tile type: ${(tile as any).type}`)
  }
}

export function resolveFullClueAnswer(clue: Clue, splitChar: string) {
  // For simple cases (no rebus, no splits, no internal splits), just return the answer directly
  const hasRebus = clue.tiles.some((t) => t.type === "rebus")
  const hasSplits = clue.splits && clue.splits.length > 0
  const hasInternalSplits = clue.rebusInternalSplits && Object.keys(clue.rebusInternalSplits).length > 0

  if (!hasRebus && !hasSplits && !hasInternalSplits) {
    return clue.answer
  }

  // Build the answer tile by tile, applying internal splits to multi-letter squares (rebuses, and
  // Schrödinger squares which this answer fills with a rebus).
  // Work in Unicode code points to avoid surrogate pair issues.
  let result = ""
  const answerCodePoints = [...clue.answer]
  let currentCharIndex = 0

  for (let tileIndex = 0; tileIndex < clue.tiles.length; tileIndex++) {
    const tile = clue.tiles[tileIndex]

    // Add split before this tile if needed
    if (clue.splits && clue.splits.includes(tileIndex - 1)) {
      result += splitChar
    }

    const letters = [...lettersForTile(tile, answerCodePoints.slice(currentCharIndex).join(""))]
    const internalSplits = clue.rebusInternalSplits?.[tileIndex] || []
    for (let i = 0; i < letters.length; i++) {
      if (i > 0 && internalSplits.includes(i - 1)) {
        result += splitChar
      }
      result += letters[i]
    }

    currentCharIndex += letters.length
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

/** Converts a CrosswordJSON back into an xd v4 file */
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
              return spellLetterTile(tile)
            case "blank":
              return tile.spacer ? "_" : "."
            case "rebus":
              return tile.symbol
            case "schrodinger":
              return tile.symbol || "*"
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
        const sc = splitChar || "|"
        const answers = clue.answers?.length ? clue.answers : [{ answer: clue.answer }]

        // Pre-v4 '^alt' answers are kept as metadata, so they aren't repeated on the clue line
        const altMetadata = Object.entries(clue.metadata || {})
          .filter(([key]) => /^alt\d*$/.test(key))
          .map(([_, value]) => String(value).split(sc).join(""))
        const lineAnswers = answers.filter((a, i) => i === 0 || !altMetadata.includes(a.answer))

        // Split characters go in an end-of-line annotation: '~ OKGO ~ OKAY // OK|GO OK|AY'
        const withSplits = lineAnswers.map((a, i) =>
          resolveFullClueAnswer(i === 0 ? clue : { ...clue, answer: a.answer, splits: a.splits, rebusInternalSplits: a.rebusInternalSplits }, sc),
        )
        const plain = withSplits.map((a) => a.split(sc).join(""))
        const annotation = withSplits.filter((a, i) => a !== plain[i])
        const answerText = plain.join(" ~ ") + (annotation.length ? ` // ${annotation.join(" ")}` : "")

        let line = `${direction}${clue.number}. ${clue.body} ~ ${answerText}`
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
    xd += serializeDesignRules(json.design.styles)
    xd += "\n\n"

    // '.' marks an unstyled cell, and an unstyled black square is echoed as '#' so that the
    // design grid has the shape of the puzzle to read it against
    xd += `${json.tiles
      .map((tileRow, rowI) => {
        const row = json.design!.positions[rowI] || []
        return tileRow.map((tile, i) => row[i] || (tile.type === "blank" ? "#" : ".")).join("")
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
