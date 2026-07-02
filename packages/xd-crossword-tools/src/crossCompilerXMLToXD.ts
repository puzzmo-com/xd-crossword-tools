import { Clue, CrosswordJSON, Tile } from "xd-crossword-tools-parser"
import { JSONToXD } from "./JSONtoXD"
import { XMLParser } from "fast-xml-parser"

// -- fast-xml-parser preserveOrder helpers (mirrors jpzToXD) --
type FxpNode = { [key: string]: any }

function nodeName(node: FxpNode): string | undefined {
  return Object.keys(node).find((k) => k !== ":@" && k !== "#text")
}

function nodeChildren(node: FxpNode): FxpNode[] {
  const name = nodeName(node)
  return name ? node[name] : []
}

function attr(node: FxpNode, key: string): string | undefined {
  return node[":@"]?.[key]
}

function findChild(nodes: FxpNode[], name: string): FxpNode | undefined {
  return nodes.find((n) => nodeName(n) === name)
}

function filterChildren(nodes: FxpNode[], name: string): FxpNode[] {
  return nodes.filter((n) => nodeName(n) === name)
}

function textContent(nodes: FxpNode[]): string {
  let result = ""
  for (const n of nodes) {
    if ("#text" in n) {
      result += n["#text"]
    } else {
      result += textContent(nodeChildren(n))
    }
  }
  return result
}

/**
 * Convert clue content (which may contain <b>, <i>, <u>, <sup>, <sub>, <a>, etc.)
 * into xd inline markup.
 */
function convertNodesToXDMarkup(nodes: FxpNode[]): string {
  if (nodes.length === 1 && nodeName(nodes[0]) === "span") {
    nodes = nodeChildren(nodes[0])
  }

  const tagMap: { [tag: string]: { open: string; close: string } } = {
    i: { open: "{/", close: "/}" },
    em: { open: "{/", close: "/}" },
    b: { open: "{*", close: "*}" },
    strong: { open: "{*", close: "*}" },
    u: { open: "{_", close: "_}" },
    s: { open: "{-", close: "-}" },
    strike: { open: "{-", close: "-}" },
    del: { open: "{-", close: "-}" },
    sub: { open: "{~", close: "~}" },
    sup: { open: "{^", close: "^}" },
  }

  let result = ""
  for (const node of nodes) {
    if ("#text" in node) {
      result += node["#text"]
      continue
    }

    const tag = nodeName(node)
    if (!tag) continue
    const children = nodeChildren(node)

    if (tag === "img") {
      const src = attr(node, "src") ?? ""
      const alt = attr(node, "alt") ?? ""
      result += alt ? `{![${src}|${alt}]!}` : `{![${src}]!}`
    } else if (tag === "a") {
      const href = attr(node, "href") ?? ""
      const text = convertNodesToXDMarkup(children)
      result += `{@${text}|${href}@}`
    } else if (tag === "br") {
      result += " "
    } else if (tag in tagMap) {
      const { open, close } = tagMap[tag]
      result += `${open}${convertNodesToXDMarkup(children)}${close}`
    } else {
      result += convertNodesToXDMarkup(children)
    }
  }

  return result
}

/** Parses an attribute like "1-6" or "5" into [start, end] (1-based, inclusive). */
function parseRange(raw: string | undefined): [number, number] | undefined {
  if (!raw) return undefined
  const parts = raw.split("-").map((p) => parseInt(p, 10))
  if (parts.some((n) => Number.isNaN(n))) return undefined
  if (parts.length === 1) return [parts[0], parts[0]]
  return [parts[0], parts[1]]
}

interface ResolvedWord {
  /** 0-based cell positions (col, row) in order along the word. */
  cells: Array<{ col: number; row: number }>
  /** Optional explicit display solution (e.g. "lady chatterleys lover"). */
  solution?: string
  /** Whether the word is flagged as part of a puzzle theme. */
  isTheme: boolean
  /** "across" if the word lies horizontally, "down" if vertical. */
  direction: "across" | "down"
}

function resolveWord(wordEl: FxpNode): ResolvedWord | undefined {
  const xRange = parseRange(attr(wordEl, "x"))
  const yRange = parseRange(attr(wordEl, "y"))
  const solution = attr(wordEl, "solution")
  const isTheme = attr(wordEl, "is-theme") === "true"

  // Explicit <cells x= y=/> children take precedence (matches the jpz style usage).
  const cellChildren = filterChildren(nodeChildren(wordEl), "cells")
  if (cellChildren.length > 0) {
    const cells = cellChildren.map((c) => ({
      col: parseInt(attr(c, "x")!, 10) - 1,
      row: parseInt(attr(c, "y")!, 10) - 1,
    }))
    const allSameRow = cells.every((c) => c.row === cells[0].row)
    const allSameCol = cells.every((c) => c.col === cells[0].col)
    const direction: "across" | "down" = allSameCol && !allSameRow ? "down" : "across"
    return { cells, solution, isTheme, direction }
  }

  if (!xRange || !yRange) return undefined

  const cells: Array<{ col: number; row: number }> = []
  if (xRange[0] !== xRange[1] && yRange[0] === yRange[1]) {
    for (let x = xRange[0]; x <= xRange[1]; x++) cells.push({ col: x - 1, row: yRange[0] - 1 })
    return { cells, solution, isTheme, direction: "across" }
  }
  if (yRange[0] !== yRange[1] && xRange[0] === xRange[1]) {
    for (let y = yRange[0]; y <= yRange[1]; y++) cells.push({ col: xRange[0] - 1, row: y - 1 })
    return { cells, solution, isTheme, direction: "down" }
  }
  // Single cell or diagonal — treat as across by default.
  for (let x = xRange[0]; x <= xRange[1]; x++) {
    for (let y = yRange[0]; y <= yRange[1]; y++) cells.push({ col: x - 1, row: y - 1 })
  }
  return { cells, solution, isTheme, direction: "across" }
}

/**
 * Convert a word's explicit display solution (e.g. "rear-view", "fashion photographer")
 * into the split indexes JSONToXD expects: a value of N means "insert the split
 * character after grid tile N", i.e. between tiles N and N+1.
 */
function splitsFromSolution(solution: string, cellCount: number): number[] {
  const splits: number[] = []
  let cellIndex = 0
  for (const ch of [...solution]) {
    if (ch === " " || ch === "-") {
      if (cellIndex > 0 && cellIndex < cellCount) splits.push(cellIndex - 1)
    } else {
      cellIndex++
    }
  }
  return splits
}

/**
 * Convert a `format` attribute like "4,5", "4-4", or "3,11,5" into split indexes.
 * Comma and hyphen both mark a split boundary. Used as a fallback when a `<word>`
 * has no `solution=` attribute but the clue's `format` carries length info.
 */
function splitsFromFormat(format: string, cellCount: number): number[] {
  const lengths = format.split(/[,\-]/).map((p) => parseInt(p.trim(), 10))
  if (lengths.some((n) => !Number.isFinite(n) || n <= 0)) return []
  if (lengths.length < 2) return []
  if (lengths.reduce((a, b) => a + b, 0) !== cellCount) return []
  const splits: number[] = []
  let running = 0
  for (let i = 0; i < lengths.length - 1; i++) {
    running += lengths[i]
    splits.push(running - 1)
  }
  return splits
}

/**
 * Pick a single-character symbol for a rebus entry, avoiding collisions with
 * the upper-case letters used in the grid and with anything already assigned.
 */
function pickRebusSymbol(used: Set<string>): string {
  const candidates = "0123456789abcdefghijklmnopqrstuvwxyz"
  for (const c of candidates) if (!used.has(c)) return c
  throw new Error("Ran out of rebus symbols (more than 36 distinct rebuses)")
}

/**
 * Converts a crossword-compiler XML string (the format published from Crossword Compiler,
 * documented at https://crossword.info/xml/rectangular-puzzle.xsd) into an xd file.
 */
export function crossCompilerXMLToXD(xmlString: string): string {
  const fxpParser = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    processEntities: false,
    trimValues: false,
  })

  const parsed: FxpNode[] = fxpParser.parse(xmlString)

  // Root is <crossword-compiler> (or <crossword-compiler-applet> for the applet
  // variant), though some syndicators publish <rectangular-puzzle> as the root.
  const root = parsed.find((n) => {
    const name = nodeName(n)
    return name !== undefined && name !== "?xml"
  })
  if (!root) throw new Error("Could not find root element in crossword-compiler XML")

  const rectangularPuzzle = nodeName(root) === "rectangular-puzzle" ? root : findChild(nodeChildren(root), "rectangular-puzzle")
  if (!rectangularPuzzle) throw new Error("Could not find rectangular-puzzle element in crossword-compiler XML")

  const rpChildren = nodeChildren(rectangularPuzzle)
  const crosswordEl = findChild(rpChildren, "crossword")
  if (!crosswordEl) throw new Error("Could not find crossword element in crossword-compiler XML")

  // Metadata
  const metadataEl = findChild(rpChildren, "metadata")
  const metaChildren = metadataEl ? nodeChildren(metadataEl) : []
  const readMeta = (tag: string): string => {
    const el = findChild(metaChildren, tag)
    return el ? textContent(nodeChildren(el)).trim() : ""
  }

  // Key order and "Not set" fallbacks match the xd parser's defaults, so the
  // generated xd survives an xd → JSON → xd round trip unchanged.
  const meta: CrosswordJSON["meta"] = {
    title: readMeta("title") || "Untitled",
    author: readMeta("creator") || "Unknown Author",
    date: readMeta("created") || "Not set",
    editor: readMeta("editor") || "Not set",
  }
  const copyright = readMeta("copyright") || readMeta("rights")
  const description = readMeta("description")
  const publisher = readMeta("publisher")
  if (copyright) meta.copyright = copyright
  if (description) meta.description = description
  if (publisher) meta.publisher = publisher

  // Solver instructions (sibling of <crossword>) become the Notes section.
  const instructionsEl = findChild(rpChildren, "instructions")
  const notes = instructionsEl ? textContent(nodeChildren(instructionsEl)).trim() : ""

  // Grid
  const cwChildren = nodeChildren(crosswordEl)
  const gridEl = findChild(cwChildren, "grid")
  if (!gridEl) throw new Error("Could not find grid element in crossword-compiler XML")

  const gridWidth = parseInt(attr(gridEl, "width")!, 10)
  const gridHeight = parseInt(attr(gridEl, "height")!, 10)
  const tiles: Tile[][] = Array.from({ length: gridHeight }, () => Array(gridWidth).fill({ type: "blank" }))

  // Rebus tracking — symbol assignment is shared across the whole grid so the
  // same multi-letter solution always maps to the same symbol.
  const rebuses: Record<string, string> = {}
  const rebusByWord: Record<string, string> = {}
  const usedSymbols = new Set<string>()

  // Track decorative cell features so we can render a single Design section.
  type CellDecor = { left?: boolean; top?: boolean; circle?: boolean }
  const cellDecor: { [key: string]: CellDecor } = {}
  let hasAnyBars = false
  let hasAnyCircle = false

  // Pre-filled letters become a sparse Start grid.
  const start: string[][] = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(""))
  let hasAnyStart = false

  const gridChildren = nodeChildren(gridEl)
  for (const cell of filterChildren(gridChildren, "cell")) {
    const x = parseInt(attr(cell, "x")!, 10) - 1
    const y = parseInt(attr(cell, "y")!, 10) - 1

    const type = attr(cell, "type")
    if (type === "block" || type === "void") {
      tiles[y][x] = { type: "blank" }
      continue
    }

    const solution = attr(cell, "solution") ?? "?"
    const upper = solution.toUpperCase()

    if (upper.length > 1) {
      // Multi-letter cell ⇒ rebus. Re-use a symbol for the same word.
      let symbol = rebusByWord[upper]
      if (!symbol) {
        symbol = pickRebusSymbol(usedSymbols)
        usedSymbols.add(symbol)
        rebusByWord[upper] = symbol
        rebuses[symbol] = upper
      }
      tiles[y][x] = { type: "rebus", symbol, word: upper }
    } else {
      tiles[y][x] = { type: "letter", letter: upper }
    }

    // Bars
    if (attr(cell, "left-bar") === "true" || attr(cell, "top-bar") === "true") {
      meta.form = "barred"
      const key = `${y},${x}`
      if (!cellDecor[key]) cellDecor[key] = {}
      if (attr(cell, "left-bar") === "true") cellDecor[key].left = true
      if (attr(cell, "top-bar") === "true") cellDecor[key].top = true
      hasAnyBars = true
    }

    // Circles
    if (attr(cell, "background-shape") === "circle") {
      const key = `${y},${x}`
      if (!cellDecor[key]) cellDecor[key] = {}
      cellDecor[key].circle = true
      hasAnyCircle = true
    }

    // Pre-filled letters: any `solve-state` (the letters the solver starts with)
    // or `hint="true"` (filled-in helper cell) belongs in the Start section.
    const solveState = attr(cell, "solve-state")
    if (solveState && solveState.length > 0) {
      start[y][x] = solveState.toUpperCase()
      hasAnyStart = true
    } else if (attr(cell, "hint") === "true") {
      start[y][x] = upper
      hasAnyStart = true
    }
  }

  // Resolve every word into its grid cells.
  const wordEls = filterChildren(cwChildren, "word")
  const wordMap = new Map<string, ResolvedWord>()
  for (const wordEl of wordEls) {
    const id = attr(wordEl, "id")
    if (!id) continue
    const resolved = resolveWord(wordEl)
    if (resolved) wordMap.set(id, resolved)
  }

  // Build the joined answer letters and the matching tile list for a word.
  const collectWordCells = (word: ResolvedWord): { answer: string; tiles: Tile[] } => {
    let answer = ""
    const wordTiles: Tile[] = []
    for (const { col, row } of word.cells) {
      const tile = tiles[row]?.[col]
      if (!tile) continue
      wordTiles.push(tile)
      if (tile.type === "letter") answer += tile.letter
      else if (tile.type === "rebus") answer += tile.word
    }
    return { answer, tiles: wordTiles }
  }

  // Clues — up to two <clues> blocks (across + down). The direction can be
  // ambiguous (titles are sometimes empty), so we infer from each word's geometry.
  const clueEls: FxpNode[] = []
  for (const cluesEl of filterChildren(cwChildren, "clues")) {
    for (const c of filterChildren(nodeChildren(cluesEl), "clue")) clueEls.push(c)
  }

  const clues: CrosswordJSON["clues"] = { across: [], down: [] }
  const splitChar = "|"
  let anySplits = false

  for (const clueEl of clueEls) {
    const wordID = attr(clueEl, "word")
    if (!wordID) continue
    const word = wordMap.get(wordID)
    if (!word) continue

    const numAttr = attr(clueEl, "number")
    const number = numAttr ? parseInt(numAttr, 10) : NaN
    if (!Number.isFinite(number)) continue

    const body = convertNodesToXDMarkup(nodeChildren(clueEl)).trim()
    const { answer, tiles: wordTiles } = collectWordCells(word)
    if (!answer) continue

    // Splits: prefer the word's explicit solution (e.g. "rear-view"), otherwise
    // fall back to the clue's format attribute (e.g. "4-4").
    let splits: number[] = []
    if (word.solution) {
      splits = splitsFromSolution(word.solution, wordTiles.length)
    }
    if (splits.length === 0) {
      const format = attr(clueEl, "format")
      if (format) splits = splitsFromFormat(format, wordTiles.length)
    }
    if (splits.length > 0) anySplits = true

    // Per-clue metadata (citation, hint URL, tags, theme flag).
    const metadata: Record<string, string> = {}
    const citation = attr(clueEl, "citation")
    if (citation) metadata.citation = citation
    const hintUrl = attr(clueEl, "hint-url")
    if (hintUrl) metadata.hintURL = hintUrl
    const tags = attr(clueEl, "tags")
    if (tags) metadata.tags = tags
    if (word.isTheme) metadata.theme = "true"

    const first = word.cells[0]
    const clue: Clue = {
      number,
      body,
      answer: answer.toUpperCase(),
      position: { col: first.col, index: first.row },
      direction: word.direction === "across" ? "across" : "down",
      display: [],
      tiles: wordTiles,
      ...(splits.length > 0 && { splits }),
      ...(Object.keys(metadata).length > 0 && { metadata }),
    }
    clues[word.direction].push(clue)
  }

  if (anySplits) meta.splitcharacter = splitChar

  clues.across.sort((a, b) => a.number - b.number)
  clues.down.sort((a, b) => a.number - b.number)

  // Build a unified Design section covering bars and circles.
  let design: CrosswordJSON["design"] | undefined
  if (hasAnyBars || hasAnyCircle) {
    const styleMap = new Map<string, string>()
    const positions: string[][] = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(""))
    let styleLetterCode = 65 // 'A'

    for (const [cellKey, decor] of Object.entries(cellDecor)) {
      const [y, x] = cellKey.split(",").map(Number)
      const styleKey = `${decor.left ? "L" : ""}${decor.top ? "T" : ""}${decor.circle ? "C" : ""}`
      if (!styleKey) continue
      if (!styleMap.has(styleKey)) styleMap.set(styleKey, String.fromCharCode(styleLetterCode++))
      positions[y][x] = styleMap.get(styleKey)!
    }

    const styles: { [key: string]: { [prop: string]: string } } = {}
    for (const [styleKey, letter] of styleMap) {
      const styleObj: { [prop: string]: string } = {}
      if (styleKey.includes("L")) styleObj["bar-left"] = "true"
      if (styleKey.includes("T")) styleObj["bar-top"] = "true"
      if (styleKey.includes("C")) styleObj["background"] = "circle"
      styles[letter] = styleObj
    }

    design = { styles, positions }
  }

  // Rebus map goes through meta.rebus, joined as "0=AB 1=CD".
  if (Object.keys(rebuses).length > 0) {
    meta.rebus = Object.entries(rebuses)
      .map(([symbol, word]) => `${symbol}=${word}`)
      .join(" ")
  }

  const crosswordJSON: CrosswordJSON = {
    meta,
    tiles,
    clues,
    notes,
    rebuses,
    unknownSections: {},
    report: { success: true, errors: [], warnings: [] },
    ...(design && { design }),
    ...(hasAnyStart && { start }),
  }

  return JSONToXD(crosswordJSON)
}
