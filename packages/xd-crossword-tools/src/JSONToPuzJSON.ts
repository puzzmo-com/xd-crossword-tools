import type { CrosswordJSON } from "xd-crossword-parser"

// https://github.com/rjkat/confuzzle/blob/master/%40confuzzle/readpuz/readpuz.js

/**
 * If you want to convert a .xd to .puz, use this fn
 *
 * @param json
 * @returns {any} a JSON object that can be used to create a .puz file via @confuzzle/writepuz
 */

export const JSONToPuzJSON = (json: CrosswordJSON, config?: { filled?: true }): any => {
  const stringOfPuzzle = json.tiles
    .map((row) =>
      row
        .map((m) => {
          if (m.type === "blank") {
            return "."
          }
          if (m.type === "letter") {
            return m.letter
          }
          throw new Error("JSON to PuzJSON does not support rebuses I'm afraid")
        })
        .join("")
    )
    .join("")

  const puz = {
    title: json.meta.title,
    author: json.meta.author,
    clues: [...json.clues.across, ...json.clues.down].map((c) => {
      let clueText = c.body
      if (c.metadata?.hint) {
        clueText += ` // ${c.metadata.hint}`
      }
      return clueText
    }),
    copyright: json.meta.copyright,
    hasState: true,
    height: json.tiles[0].length,
    width: json.tiles.length,
    note: json.meta.notes,
    sections: [] as any[],
    solution: stringOfPuzzle,
    state: config?.filled ? stringOfPuzzle : "",
  }

  // Adds the circles
  if (json.design) {
    // Any styles which have a background of circle:
    // background: circle
    const stylesWithO = new Set()
    for (const key in json.design.styles) {
      if (Object.prototype.hasOwnProperty.call(json.design.styles, key)) {
        const element = json.design.styles[key]
        if (element.background === "circle") {
          stylesWithO.add(key)
        }
      }
    }

    // So far we only handle the circles
    const data: number[] = []

    json.design.positions.forEach((tiles) => {
      for (let index = 0; index < tiles.length; index++) {
        const element = tiles[index]

        if (stylesWithO.has(element)) {
          data.push(128)
        } else {
          data.push(0)
        }
      }
    })

    if (data.length) {
      const bytes = Uint8Array.from(data)
      puz.sections.push({
        // FWIW: I dont think this is right
        checksum: checksum(bytes),
        data: bytes,
        title: "GEXT",
      })
    }
  }

  return puz
}

// Taken from https://github.com/rjkat/confuzzle/blob/d57433d7f514bc012d78a09b25531778976dc04e/%40confuzzle/writepuz/writepuz.js#L4
// MIT License: https://github.com/rjkat/confuzzle/blob/master/LICENSE
//
function checksum(base: Uint8Array, c?: number, len?: number) {
  if (c === undefined) c = 0x0000
  if (base === undefined) return c

  let x = Buffer.from(base)
  if (len === undefined) len = x.length

  for (let i = 0; i < len; i++) {
    if (c & 0x0001) c = ((c >>> 1) + 0x8000) & 0xffff
    else c = c >>> 1
    c = (c + x[i]) & 0xffff
  }
  return c
}
