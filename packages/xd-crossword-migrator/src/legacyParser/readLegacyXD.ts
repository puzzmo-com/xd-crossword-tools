import { addHeadersToImplicitSections, hasImplicitSections } from "./implicitSections"
import { type DesignStyles, parseDesignRules } from "./design"
import { parseRebusField, type RebusRule } from "./rebus"

/** The grid character for an unfilled cell, which is also how one is written in an answer */
export const UNFILLED_CELL = "?"

/** A section of an xd file as it was written, `header` is undefined for anything before the first header */
export type Section = { type: string; header?: string; lines: string[] }

export type LegacyTile =
  | { type: "blank" }
  | { type: "letter"; letter: string }
  /** A cell whose key is in the Rebus field, a key with one option is a plain rebus */
  | { type: "rebus"; key: string; options: string[] }
  /** A pre-v4 Puzzmo '*' square, its values come from the answers which go through it */
  | { type: "star" }

export type Cell = [row: number, col: number]

export interface LegacyPuzzle {
  /** Metadata fields, keyed by their lowercased name */
  meta: Record<string, string>
  rebus: ReturnType<typeof parseRebusField>
  /** The grid as written, one codepoint per cell */
  grid: string[][]
  tiles: LegacyTile[][]
  /** The cells of each numbered slot */
  slots: { across: Map<number, Cell[]>; down: Map<number, Cell[]> }
  /** The design section, with any v3 'Special' cells added to it */
  design?: { styles: DesignStyles; positions: string[][] }
  /** The bars on each cell's left and top edges: from a v4 '## Bars' section, or pre-v4 'bar-left' and 'bar-top' in the design */
  bars: (y: number, x: number) => { left: boolean; top: boolean }
  /** Whether the bars came from a v4 '## Bars' section */
  hasBarsSection: boolean
}

/**
 * Reads an xd file the way it was read before v4: v3 files, and Puzzmo's xd from before v4. This only
 * reads what the migrator needs to make decisions with, the migrator itself works on the text.
 */
export function readLegacyXD(xd: string): LegacyPuzzle {
  if (hasImplicitSections(xd)) xd = addHeadersToImplicitSections(xd)
  const sections = splitIntoSections(xd)
  const section = (type: string) => sections.find((s) => s.type === type)

  const meta: Record<string, string> = {}
  for (const line of section("metadata")?.lines || []) {
    const trimmed = line.trim()
    const colon = trimmed.indexOf(":")
    if (colon === -1) continue
    meta[trimmed.slice(0, colon).trim().toLowerCase()] = trimmed.slice(colon + 1).trimStart()
  }

  const grid = (section("grid")?.lines || []).map((l) => l.trim()).filter(Boolean).map((l) => [...l])
  const design = readDesign(section("design")?.lines || [])
  const letters = applyV3SpecialCells(meta, grid, design)

  const rebus = parseRebusField(meta.rebus || "")
  const optionsForKey = new Map<string, string[]>()
  for (const rule of rebus.rules) rule.keys.forEach((key, i) => optionsForKey.set(key, rule.options.map((o) => o[i])))

  const tiles = letters.map((row) =>
    row.map((char): LegacyTile => {
      const options = optionsForKey.get(char)
      if (options) return { type: "rebus", key: char, options }
      if (char === "." || char === "#" || char === "_") return { type: "blank" }
      if (char === "*") return { type: "star" }
      return { type: "letter", letter: char }
    }),
  )

  // A v4 file has a Bars section, a pre-v4 Puzzmo one put its bars in the design
  const barsSection = sections.find((s) => s.type === "bars")
  const barRows = (barsSection?.lines || []).map((l) => l.trim()).filter(Boolean).map((l) => [...l])
  const designBar = (y: number, x: number, side: string) => {
    const char = design?.positions[y]?.[x]
    return !!char && design!.styles[char]?.[side] === "true"
  }
  const bars = (y: number, x: number) => {
    if (barsSection) {
      const char = barRows[y]?.[x]
      return { left: char === "|" || char === "+", top: char === "-" || char === "+" }
    }
    return { left: designBar(y, x, "bar-left"), top: designBar(y, x, "bar-top") }
  }

  return { meta, rebus, grid, tiles, slots: numberSlots(tiles, bars), design, bars, hasBarsSection: !!barsSection }
}

/** Splits an xd file into its sections, keeping every line as written */
export function splitIntoSections(xd: string): Section[] {
  const sections: Section[] = [{ type: "preamble", lines: [] }]

  for (const line of xd.split("\n")) {
    if (line.startsWith("## ")) {
      const title = line.slice(3).trim().toLowerCase()
      const type = ["metadata", "grid", "clues", "design", "notes", "bars"].find((t) => title.startsWith(t)) || (title === "meta" ? "metadata" : title)
      sections.push({ type, header: line, lines: [] })
      continue
    }
    sections[sections.length - 1].lines.push(line)
  }

  return sections
}

export const joinSections = (sections: Section[]) =>
  sections.flatMap((s) => (s.header === undefined ? s.lines : [s.header, ...s.lines])).join("\n")

/** Style rules, then a grid of style characters. Pre-v4 Puzzmo files wrapped the rules in `<style>` */
function readDesign(lines: string[]): LegacyPuzzle["design"] {
  let rules = ""
  const rows: string[] = []
  const scan = { insideRule: false, quote: undefined as string | undefined }

  for (const content of lines) {
    const trimmed = content.trim()
    // Once we have hit the grid, everything else is grid
    if (rows.length) {
      if (trimmed) rows.push(trimmed)
      continue
    }

    const ruleLine = content.replace(/<\/?style>/g, "")
    const ruleTrimmed = ruleLine.trim()
    if (!scan.insideRule && ruleTrimmed && !ruleTrimmed.includes("{")) {
      rows.push(trimmed)
      continue
    }
    rules += ruleLine + "\n"
    scanDesignRuleText(ruleLine + "\n", scan)
  }

  if (!rules.trim() && !rows.length) return undefined
  const { styles } = parseDesignRules(rules)
  const positions = rows.map((row) => {
    const cells: string[] = []
    ;[...row].forEach((c, i) => {
      if (!styles[c] && (c === " " || c === "." || c === "#")) return
      cells[i] = c
    })
    return cells
  })
  return { styles, positions }
}

function scanDesignRuleText(text: string, state: { insideRule: boolean; quote: string | undefined }) {
  for (const char of text) {
    if (state.quote) {
      if (char === state.quote) state.quote = undefined
    } else if (!state.insideRule) {
      if (char === "{") state.insideRule = true
    } else if (char === "'" || char === '"') {
      state.quote = char
    } else if (char === "}") {
      state.insideRule = false
    }
  }
}

/**
 * v3 used lowercase grid letters with a 'Special: circle' or 'Special: shaded' field. Those cells get a
 * style in the design, picked the same way xd-crossword-tools-parser did, and are read as capitals.
 */
function applyV3SpecialCells(meta: Record<string, string>, grid: string[][], design: LegacyPuzzle["design"]) {
  const letters = grid.map((row) => [...row])
  const special = meta.special?.trim().toLowerCase()
  if (special !== "circle" && special !== "shaded") return letters

  const cells: Cell[] = []
  grid.forEach((row, y) => row.forEach((c, x) => /^[a-z]$/.test(c) && cells.push([y, x])))
  if (!cells.length) return letters

  const styles = design?.styles || {}
  const preferred = special === "circle" ? "O" : "S"
  const existing = Object.entries(styles).find(([_, rule]) => rule.background === special && Object.keys(rule).length === 1)
  const char = existing?.[0] ?? [preferred, ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"].find((c) => !styles[c])!

  const target = design || { styles, positions: [] }
  target.styles[char] = { background: special }
  for (const [y, x] of cells) {
    letters[y][x] = letters[y][x].toUpperCase()
    if (!target.positions[y]) target.positions[y] = []
    if (!target.positions[y][x]) target.positions[y][x] = char
  }
  return letters
}

/** Standard crossword numbering, a barred grid also ends words at its bars */
function numberSlots(tiles: LegacyTile[][], bars: LegacyPuzzle["bars"]): LegacyPuzzle["slots"] {
  const open = (y: number, x: number) => !!tiles[y]?.[x] && tiles[y][x].type !== "blank"
  const bar = (y: number, x: number, side: "bar-left" | "bar-top") => (side === "bar-left" ? bars(y, x).left : bars(y, x).top)

  const slots: LegacyPuzzle["slots"] = { across: new Map(), down: new Map() }
  let number = 0
  tiles.forEach((row, y) =>
    row.forEach((_, x) => {
      if (!open(y, x)) return
      const across = (!open(y, x - 1) || bar(y, x, "bar-left")) && open(y, x + 1) && !bar(y, x + 1, "bar-left")
      const down = (!open(y - 1, x) || bar(y, x, "bar-top")) && open(y + 1, x) && !bar(y + 1, x, "bar-top")
      if (!across && !down) return
      number++

      if (across) {
        const cells: Cell[] = [[y, x]]
        for (let i = x + 1; open(y, i) && !bar(y, i, "bar-left"); i++) cells.push([y, i])
        slots.across.set(number, cells)
      }
      if (down) {
        const cells: Cell[] = [[y, x]]
        for (let i = y + 1; open(i, x) && !bar(i, x, "bar-top"); i++) cells.push([i, x])
        slots.down.set(number, cells)
      }
    }),
  )
  return slots
}
