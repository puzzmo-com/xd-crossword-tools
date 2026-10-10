import { spellLetterTile, xdToJSON, type CrosswordJSON } from "xd-crossword-tools-parser"
import { encode, type PuzEncodeInput } from "./vendor/puzjs"

/** The .puz section which holds the original .xd document, so importing the .puz can be lossless */
export const xdPuzSectionCode = "XDOC"

/**
 * Converts a parsed .xd crossword into the input for the .puz encoder. Clues use their plain-text
 * form because .puz has no markup support, and Schrödinger squares use their first valid option.
 */
export const JSONToPuzInput = (json: CrosswordJSON): PuzEncodeInput => {
  const grid = json.tiles.map((row) =>
    row.map((tile) => {
      // .puz has no unknown letter, the embedded .xd keeps unfilled cells lossless
      if (tile.type === "letter") return spellLetterTile(tile)
      if (tile.type === "rebus") return tile.word
      if (tile.type === "schrodinger") return tile.validOptions?.[0] ?? tile.validLetters[0] ?? "."
      return "."
    }),
  )

  // Clue arrays are indexed by clue number
  const across: string[] = []
  const down: string[] = []
  for (const clue of json.clues.across) across[clue.number] = clue.plain ?? clue.body
  for (const clue of json.clues.down) down[clue.number] = clue.plain ?? clue.body

  const circles: number[] = []
  if (json.design) {
    const circleStyles = new Set<string>()
    for (const [key, style] of Object.entries(json.design.styles || {})) {
      if (style.background === "circle") circleStyles.add(key)
    }

    const width = grid[0].length
    json.design.positions.forEach((row, rowIdx) => {
      row.forEach((styleKey, colIdx) => {
        if (circleStyles.has(styleKey)) circles.push(rowIdx * width + colIdx)
      })
    })
  }

  // Pre-filled squares from the Start section go into the player's grid, flagged as given
  const progress: string[][] = grid.map((row) => row.map(() => "-"))
  const given: number[] = []
  json.start?.forEach((row, rowIdx) => {
    row.forEach((char, colIdx) => {
      if (!char || grid[rowIdx]?.[colIdx] === undefined || grid[rowIdx][colIdx] === ".") return
      const value = json.rebuses?.[char] ?? char
      progress[rowIdx][colIdx] = value.substring(0, 1)
      given.push(rowIdx * grid[0].length + colIdx)
    })
  })

  // Older .puz imports put the notes in a "description" metadata field
  const description = json.meta.description && json.meta.description !== "N/A" ? json.meta.description : ""

  return {
    grid,
    progress,
    given,
    meta: {
      title: json.meta.title || "",
      author: json.meta.author || "",
      copyright: json.meta.copyright || "",
      notes: json.notes || description,
    },
    clues: { across, down },
    circles,
  }
}

/**
 * Converts a parsed .xd crossword into the bytes of a .puz file. Pass the original .xd document as `xd`
 * to embed it in the file (solvers ignore it), which lets `puzToXD` recreate it exactly.
 */
export const JSONToPuz = (json: CrosswordJSON, options?: { xd?: string }): Uint8Array => {
  const input = JSONToPuzInput(json)
  if (options?.xd) {
    const data = new TextEncoder().encode(options.xd)
    // A .puz section can't hold more than 64KB, the .puz is still complete without it
    if (data.length <= 0xffff) input.extraSections = [{ code: xdPuzSectionCode, data }]
  }
  return encode(input)
}

/** Converts an .xd document into the bytes of a .puz file, with the .xd embedded for lossless re-import */
export const xdToPuz = (xd: string): Uint8Array => JSONToPuz(xdToJSON(xd), { xd })
