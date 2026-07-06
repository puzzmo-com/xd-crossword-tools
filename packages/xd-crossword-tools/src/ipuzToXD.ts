import { Clue, CrosswordJSON, CursorDirection, Tile } from "xd-crossword-tools-parser"
import { JSONToXD } from "./JSONtoXD"
import { makeGetNewRebusSymbol } from "./utils/rebusSymbols"

/** The intermediate representation of a single ipuz `puzzle` grid cell. */
interface IpuzCellInfo {
  kind: "block" | "null" | "cell"
  number?: number
  style?: Record<string, any>
  /** A pre-filled value (the ipuz `value` field on a cell object) */
  value?: string
}

/**
 * Takes the contents of an ipuz file (https://libipuz.org/spec/ipuz-spec.html) and
 * converts it to an xd file. Accepts the raw file text (including the optional
 * `ipuz(...)` JSONP wrapper) or an already-parsed JSON object.
 *
 * Supports the crossword kind, including blocks, null cells, custom `block`/`empty`
 * characters, rebus cells (multi-letter solutions), Schrödinger cells (solutions
 * with multiple candidate values, emitted as multi-valued rebus keys), circled/shaded
 * cells, barred grids, pre-filled cells and the common metadata fields.
 */
export function ipuzToXD(source: string | object): string {
  const data = typeof source === "string" ? parseIpuzJSON(source) : (source as Record<string, any>)

  const kinds: string[] = Array.isArray(data.kind) ? data.kind.filter((k: unknown) => typeof k === "string") : []
  if (!kinds.some((k) => k.includes("crossword"))) {
    throw new Error(`Only the ipuz crossword kind is supported, got: ${kinds.join(", ") || "no kind field"}`)
  }

  const width = data.dimensions?.width
  const height = data.dimensions?.height
  if (typeof width !== "number" || typeof height !== "number") {
    throw new Error("The ipuz file is missing its dimensions (dimensions.width and dimensions.height)")
  }

  if (!Array.isArray(data.puzzle)) {
    throw new Error("The ipuz file is missing its puzzle grid")
  }

  const block = typeof data.block === "string" ? data.block : "#"
  const empty = String(data.empty ?? "0")

  // -- The grid ---------------------------------------------------------------

  const parseCell = (raw: unknown): IpuzCellInfo => {
    if (raw === null || raw === "null") return { kind: "null" }
    if (raw === block) return { kind: "block" }

    if (typeof raw === "object") {
      const obj = raw as Record<string, any>
      const base = parseCell("cell" in obj ? obj.cell : empty)
      if (typeof obj.style === "object" && obj.style) base.style = obj.style
      if (typeof obj.value === "string" && obj.value !== empty) base.value = obj.value
      return base
    }

    if (String(raw) === empty) return { kind: "cell" }
    const num = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10)
    if (!Number.isNaN(num) && num > 0) return { kind: "cell", number: num }
    return { kind: "cell" }
  }

  const cells: IpuzCellInfo[][] = []
  for (let row = 0; row < height; row++) {
    const rawRow = data.puzzle[row]
    if (!Array.isArray(rawRow)) throw new Error(`The ipuz puzzle grid is missing row ${row + 1}`)
    cells.push(rawRow.map(parseCell))
  }

  // ipuz solution values can be a string, a `{ value: ... }` object or an array of
  // candidate values (which becomes a Schrödinger square)
  const resolveSolutionValues = (raw: unknown): string[] => {
    if (raw === null || raw === undefined) return []
    if (typeof raw === "string") return raw === block || raw === "null" || raw === empty ? [] : [raw]
    if (typeof raw === "number") return [String(raw)]
    if (Array.isArray(raw)) return [...new Set(raw.flatMap(resolveSolutionValues))]
    if (typeof raw === "object" && "value" in (raw as object)) return resolveSolutionValues((raw as Record<string, any>).value)
    return []
  }

  const getNewRebusSymbol = makeGetNewRebusSymbol()
  const rebusSymbols = new Map<string, string>() // word -> symbol

  // Schrödinger squares become a multi-valued rebus key (e.g. "1=O 1=A"), cells
  // with the same set of possible values share a symbol - same as the Amuse importer
  const schrodingerSymbols = new Map<string, string>() // values-key -> symbol
  const schrodingerRebusEntries: string[] = []
  let nextSchrodingerSymbol = 1

  const tiles: Tile[][] = cells.map((row, rowI) =>
    row.map((info, colI) => {
      if (info.kind !== "cell") return { type: "blank" } as Tile
      const values = resolveSolutionValues(data.solution?.[rowI]?.[colI])
      // Like the jpz importer, missing solutions become '?'
      if (values.length === 0) return { type: "letter", letter: "?", clues: {} } as Tile

      if (values.length > 1) {
        const valuesKey = values.join("/")
        let symbol = schrodingerSymbols.get(valuesKey)
        if (!symbol) {
          symbol = String(nextSchrodingerSymbol++)
          schrodingerSymbols.set(valuesKey, symbol)
          for (const value of values) schrodingerRebusEntries.push(`${symbol}=${value}`)
        }
        return {
          type: "schrodinger",
          validLetters: values.filter((v) => [...v].length === 1),
          validRebuses: values.filter((v) => [...v].length > 1).map((letters) => ({ letters, symbol: symbol! })),
          validOptions: [...values],
          symbol,
          clues: {},
        } as Tile
      }

      const solution = values[0]
      if ([...solution].length > 1) {
        let symbol = rebusSymbols.get(solution)
        if (!symbol) {
          symbol = getNewRebusSymbol()
          rebusSymbols.set(solution, symbol)
        }
        return { type: "rebus", symbol, word: solution, clues: {} } as Tile
      }
      return { type: "letter", letter: solution, clues: {} } as Tile
    })
  )

  // -- Bars (barred grids) ------------------------------------------------------
  // ipuz puts bars on the cell they are drawn on via style.barred ("T", "L", "TL",
  // also "R"/"B" which xd represents as a bar on the adjacent cell instead)

  const barLeft = new Set<string>()
  const barTop = new Set<string>()
  cells.forEach((row, rowI) =>
    row.forEach((info, colI) => {
      const barred = info.style?.barred
      if (typeof barred !== "string") return
      const sides = barred.toUpperCase()
      if (sides.includes("L")) barLeft.add(`${rowI},${colI}`)
      if (sides.includes("T")) barTop.add(`${rowI},${colI}`)
      if (sides.includes("R") && colI < width - 1) barLeft.add(`${rowI},${colI + 1}`)
      if (sides.includes("B") && rowI < height - 1) barTop.add(`${rowI + 1},${colI}`)
    })
  )
  const hasBars = barLeft.size > 0 || barTop.size > 0

  // -- Word positions -------------------------------------------------------------

  const isFillable = (row: number, col: number) =>
    row >= 0 && row < height && col >= 0 && col < width && cells[row][col].kind === "cell"

  // Is there a word boundary between (row, col) and the next cell in the direction?
  const boundaryAfter = (row: number, col: number, direction: CursorDirection) => {
    const [nextRow, nextCol] = direction === "across" ? [row, col + 1] : [row + 1, col]
    if (!isFillable(nextRow, nextCol)) return true
    return direction === "across" ? barLeft.has(`${nextRow},${nextCol}`) : barTop.has(`${nextRow},${nextCol}`)
  }

  const startsWord = (row: number, col: number, direction: CursorDirection) => {
    if (!isFillable(row, col)) return false
    const [prevRow, prevCol] = direction === "across" ? [row, col - 1] : [row - 1, col]
    const boundaryBefore = !isFillable(prevRow, prevCol) || (direction === "across" ? barLeft.has(`${row},${col}`) : barTop.has(`${row},${col}`))
    // Single-cell entries don't count as words
    return boundaryBefore && !boundaryAfter(row, col, direction)
  }

  // Standard crossword numbering, used when the puzzle grid doesn't declare numbers
  // (or clues are given as bare strings)
  const computedStarts: Record<CursorDirection, { number: number; row: number; col: number }[]> = { across: [], down: [] }
  const declaredPositions = new Map<number, { row: number; col: number }>()
  let autoNumber = 0
  cells.forEach((row, rowI) =>
    row.forEach((info, colI) => {
      const across = startsWord(rowI, colI, "across")
      const down = startsWord(rowI, colI, "down")
      if (across || down) autoNumber++
      if (across) computedStarts.across.push({ number: autoNumber, row: rowI, col: colI })
      if (down) computedStarts.down.push({ number: autoNumber, row: rowI, col: colI })
      if (info.number !== undefined) declaredPositions.set(info.number, { row: rowI, col: colI })
    })
  )

  const walkTiles = (row: number, col: number, direction: CursorDirection): Tile[] => {
    const word: Tile[] = []
    let [r, c] = [row, col]
    while (isFillable(r, c)) {
      word.push(tiles[r][c])
      if (boundaryAfter(r, c, direction)) break
      if (direction === "across") c++
      else r++
    }
    return word
  }

  // -- Clues ---------------------------------------------------------------------

  const clues: CrosswordJSON["clues"] = { across: [], down: [] }

  for (const [key, clueList] of Object.entries(data.clues ?? {})) {
    // Keys are "Across"/"Down", sometimes with a variety suffix like "Across:Straight"
    const direction: CursorDirection | undefined = /across/i.test(key) ? "across" : /down/i.test(key) ? "down" : undefined
    if (!direction || !Array.isArray(clueList)) continue

    clueList.forEach((entry, entryIndex) => {
      // A clue is a [number, text] tuple, an { number, clue, cells } object, or a bare string
      let number: number | undefined
      let body: string | undefined
      let explicitCells: Array<[number, number]> | undefined
      let enumeration: string | undefined

      if (Array.isArray(entry) && entry.length >= 2) {
        number = typeof entry[0] === "number" ? entry[0] : Number.parseInt(String(entry[0]), 10)
        body = typeof entry[1] === "string" ? entry[1] : undefined
      } else if (typeof entry === "object" && entry !== null) {
        const obj = entry as Record<string, any>
        if (obj.number !== undefined) number = typeof obj.number === "number" ? obj.number : Number.parseInt(String(obj.number), 10)
        if (typeof obj.clue === "string") body = obj.clue
        if (Array.isArray(obj.cells)) explicitCells = obj.cells
        if (typeof obj.enumeration === "string") enumeration = obj.enumeration
      } else if (typeof entry === "string") {
        body = entry
      }

      if (body === undefined) {
        console.warn(`Skipping unrecognised ipuz ${direction} clue at index ${entryIndex}`)
        return
      }

      // Bare-string clues have no number: pair them up with the grid's word starts in order
      if (number === undefined || Number.isNaN(number)) {
        number = computedStarts[direction][entryIndex]?.number
      }
      if (number === undefined) {
        console.warn(`Could not determine a number for ipuz ${direction} clue "${body}"`)
        return
      }

      let position = declaredPositions.get(number) ?? computedStarts[direction].find((start) => start.number === number)
      if (explicitCells && explicitCells.length) {
        // ipuz cells are [col, row], 1-based
        position = { row: explicitCells[0][1] - 1, col: explicitCells[0][0] - 1 }
      }
      if (!position) {
        console.warn(`Could not find a grid position for ipuz clue ${direction} ${number}`)
        return
      }

      const clueTiles = explicitCells
        ? explicitCells.map(([col, row]) => tiles[row - 1][col - 1])
        : walkTiles(position.row, position.col, direction)

      // Schrödinger squares use their first option, so the answer reads as one coherent solution
      const answer = clueTiles
        .map((tile) => {
          if (tile.type === "letter") return tile.letter
          if (tile.type === "rebus") return tile.word
          if (tile.type === "schrodinger") return tile.validOptions?.[0] ?? tile.validLetters[0] ?? ""
          return ""
        })
        .join("")

      if (!answer) {
        console.warn(`Skipping ipuz clue ${direction} ${number} with an empty answer`)
        return
      }

      const clue: Clue = {
        number,
        body: body.replace(/\n/g, " ").trim() + (enumeration ? ` (${enumeration})` : ""),
        position: { col: position.col, index: position.row },
        answer,
        direction,
        display: [],
        tiles: clueTiles,
      }
      clues[direction].push(clue)
    })
  }

  clues.across.sort((a, b) => a.number - b.number)
  clues.down.sort((a, b) => a.number - b.number)

  // -- Design (circles, shades and bars) -------------------------------------------

  const design = generateDesign(cells, { barLeft, barTop })

  // -- Pre-filled cells -------------------------------------------------------------

  let start: string[][] | undefined
  cells.forEach((row, rowI) =>
    row.forEach((info, colI) => {
      if (info.kind !== "cell" || !info.value) return
      if (!start) start = Array.from({ length: height }, () => [])
      start[rowI][colI] = info.value
    })
  )

  // -- Metadata ---------------------------------------------------------------------

  const meta: CrosswordJSON["meta"] = {
    title: str(data.title),
    author: str(data.author),
    editor: str(data.editor),
    date: str(data.date),
    copyright: str(data.copyright),
  }
  const extras = ["publisher", "publication", "url", "uniqueid", "intro", "difficulty", "origin"] as const
  for (const key of extras) {
    if (typeof data[key] === "string" && data[key].trim()) meta[key] = data[key].trim()
  }
  if (hasBars) meta.form = "barred"
  const rebusEntries = [...rebusSymbols.entries()].map(([word, symbol]) => `${symbol}=${word}`)
  const metaRebus = [...rebusEntries, ...schrodingerRebusEntries].join(" ")
  if (metaRebus) meta.rebus = metaRebus

  const notes = [data.notes, data.explanation].filter((n) => typeof n === "string" && n.trim()).join("\n\n")

  const crosswordJSON: CrosswordJSON = {
    meta,
    tiles,
    clues,
    notes,
    rebuses: Object.fromEntries([...rebusSymbols.entries()].map(([word, symbol]) => [symbol, word])),
    unknownSections: {},
    report: { success: true, errors: [], warnings: [] },
    ...(design && { design }),
    ...(start && { start }),
  }

  return JSONToXD(crosswordJSON)
}

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "")

/** Strips the optional `ipuz(...)` JSONP wrapper and parses the JSON payload */
function parseIpuzJSON(source: string): Record<string, any> {
  let text = source.replace(/^﻿/, "").trim()
  if (text.startsWith("ipuz(")) {
    text = text.slice("ipuz(".length).replace(/\)\s*;?\s*$/, "")
  }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    throw new Error(`Expected an ipuz file but the contents were not valid JSON: ${(error as Error).message}`)
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Expected an ipuz file but the contents were not a JSON object")
  }
  return data as Record<string, any>
}

/**
 * Builds the xd Design section styles for circled (style.shapebg), shaded
 * (style.highlight / style.color) and barred cells. Each unique combination of
 * flags on a cell gets its own style letter - 'O' for a plain circle and 'S' for
 * a plain shade by convention, then 'A', 'B', ... for anything else.
 */
function generateDesign(cells: IpuzCellInfo[][], bars: { barLeft: Set<string>; barTop: Set<string> }): CrosswordJSON["design"] {
  const height = cells.length
  const width = cells[0]?.length ?? 0

  const styles: Record<string, Record<string, string>> = {}
  const comboLetters = new Map<string, string>()
  const positions: string[][] = Array.from({ length: height }, () => Array(width).fill(""))

  const usedLetters = new Set<string>()
  const nextGenericLetter = () => {
    for (let code = 65; code <= 90; code++) {
      const letter = String.fromCharCode(code)
      if (!usedLetters.has(letter)) return letter
    }
    throw new Error("Ran out of design style letters")
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const info = cells[row][col]
      if (info.kind !== "cell") continue

      const circle = info.style?.shapebg === "circle"
      const shade = info.style?.highlight === true || typeof info.style?.color === "string"
      const left = bars.barLeft.has(`${row},${col}`)
      const top = bars.barTop.has(`${row},${col}`)
      if (!circle && !shade && !left && !top) continue

      const combo = [circle && "circle", shade && "shade", left && "bar-left", top && "bar-top"].filter(Boolean).join("+")
      let letter = comboLetters.get(combo)
      if (!letter) {
        if (combo === "circle" && !usedLetters.has("O")) letter = "O"
        else if (combo === "shade" && !usedLetters.has("S")) letter = "S"
        else letter = nextGenericLetter()
        usedLetters.add(letter)
        comboLetters.set(combo, letter)

        // xd only has one background per style, so a circle wins over a shade
        const style: Record<string, string> = {}
        if (circle) style["background"] = "circle"
        else if (shade) style["background"] = "shade"
        if (left) style["bar-left"] = "true"
        if (top) style["bar-top"] = "true"
        styles[letter] = style
      }
      positions[row][col] = letter
    }
  }

  if (comboLetters.size === 0) return undefined
  return { styles, positions }
}
