import type { Clue, CrosswordJSON } from "./types"
import { replaceWordWithSymbol } from "./xdparser2"

function replaceSymbolWithWord(strWithSymbol: string, symbol: string, word: string) {
  const characters = [...strWithSymbol]
  const mapped = characters.map(c => c === symbol ? word : c)
  return mapped.join("")
}

function addSplits(answer: string, splitChar: string, splits?: number[]): string {
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

  const getCluesXD = (clues: Clue[], direction: "A" | "D") => {
    return clues
      .map((clue) => {
        // if rebus exists in meta, then that means that there is going to be a rebus
        // if no rebus then no rebus puzzle
        const [symbol, word] = json.meta.rebus ? json.meta.rebus.split("=") : ["", ""]
        const replacedWithSymbol = replaceWordWithSymbol(clue.answer, clue.tiles, symbol)
        const splitsIn = addSplits(replacedWithSymbol, splitChar, clue.splits)
        const final = replaceSymbolWithWord(splitsIn, symbol, word)
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
