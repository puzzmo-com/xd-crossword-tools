import type { CrosswordJSON } from "./types"

function addSplits(answer: string, splitChar: string, splits?: number[]): string {
  if (!splits) return answer

  let withSplits = ""
  for (var i = 0; i < answer.length; i++) {
    withSplits += answer.charAt(i)
    if (splits.includes(i)) {
      withSplits += splitChar
    }
  }
  return withSplits
}

export const JSONToXD = (json: CrosswordJSON): string => {
  let xd = ""
  let splitChar = ""

  xd += `## Metadata\n\n`
  Object.entries(json.meta).forEach(([key, value]) => {
    if (key === "splitcharacter") {
      splitChar = value
    }
    xd += `${key}: ${value}\n`
  })

  xd += `\n## Grid\n\n`
  xd += json.tiles
    .map((row) =>
      row
        .map((tile) => {
          switch (tile.type) {
            case "letter":
              return tile.letter
            case "blank":
              return "."
            case "rebus":
              return tile.symbol
          }
        })
        .join("")
    )
    .join("\n")

  xd += `\n\n## Clues\n\n`
  xd += json.clues.across
    .map((clue) => {
      const answer = addSplits(clue.answer, splitChar, clue.splits)
      let line = `A${clue.number}. ${clue.body} ~ ${answer}`
      if (clue.metadata) {
        for (const key of Object.keys(clue.metadata)) {
          line += `\nA${clue.number} ^${key}: ${clue.metadata[key]}`
        }
      }
      return line
    })
    .join("\n")

  xd += `\n\n`
  xd += json.clues.down
    .map((clue) => {
      const answer = addSplits(clue.answer, splitChar, clue.splits)
      let line = `D${clue.number}. ${clue.body} ~ ${answer}`
      if (clue.metadata) {
        for (const key of Object.keys(clue.metadata)) {
          line += `\nD${clue.number} ^${key}: ${clue.metadata[key]}`
        }
      }
      return line
    })
    .join("\n")

  if (json.metapuzzle) {
    xd += `\n\n## Metapuzzle\n\n`
    xd += `${json.metapuzzle.clue}\n\n> ${json.metapuzzle.answer}`
  }

  if (json.design) {
    xd += `\n\n## Design\n\n`

    xd += "<style>\n"
    xd += Object.entries(json.design.styles).map((key) => {
      const content = Object.entries(key[1])
        .map(([key, value]) => `${key}: ${value}`)
        .join("; ")
      return `${key[0]} { ${content} } `
    })
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
