import type { CrosswordJSON, Tile } from "./types"
import { xdToJSON } from "./parser/xdToJSON"
import { addHeadersToImplicitSections, hasImplicitSections } from "./parser/implicitSections"
import { parseXDown, serializeXDown } from "./parser/xdown"
import { parseDesignRules } from "./parser/design"

/**
 * Converts an xd file written for earlier versions of the spec (or with pre-v4 Puzzmo extensions)
 * into xd v4 syntax: https://github.com/century-arcade/xdformat/blob/master/doc/xd-format-v4.md
 *
 * This works on the text, so section order, unknown sections and formatting are kept,
 * and a file which is already v4 comes back unchanged. It handles:
 *
 * - Implicit (header-less) sections get `## Headings`
 * - `<!-- -->` comment lines are removed, xd doesn't support comments
 * - Pre-v4 xdown: `{@text|url@}` links, `{![url|alt]!}` images and `{#text|light|dark#}` colors become
 *   attribute based, and text which v4 would read as markup (`{$`, ` ~ ` in a clue body) is escaped
 * - A clue body which contained ' ~ ' (pre-v4 bodies ran to the last ' ~ ') gets it escaped
 * - Split characters move out of answers into an end-of-line annotation: `~ OK|GO ~ OK|AY` becomes `~ OKGO ~ OKAY // OK|GO OK|AY`
 * - A duplicated clue line (used as a hint) becomes `^Hint:` metadata
 * - The v3 `Special: circle|shaded` field and lowercase grid cells become a `## Design` section
 * - `## Design` sections lose their `<style>` wrapper, and use '.' for unstyled cells
 *
 * Rebuses and Schrödinger squares are not fully specified in v4 yet, so `Rebus:`, `*` squares and
 * `^alt:` answers are left as they are.
 */
export function migrateXDToV4(xd: string): string {
  // Work with '\n' and put Windows line endings back at the end, so rewritten lines match the rest
  const crlf = xd.includes("\r\n")
  if (crlf) xd = xd.replace(/\r\n/g, "\n")

  if (hasImplicitSections(xd)) xd = addHeadersToImplicitSections(xd)
  xd = removeComments(xd)

  const json = xdToJSON(xd)
  const doc = splitIntoSections(xd)
  const splitChar = json.meta.splitcharacter

  const special = migrateSpecialCells(json, doc)

  // Metadata
  const metadata = doc.sections.find((s) => s.type === "metadata")
  if (metadata) {
    metadata.lines = metadata.lines.flatMap((line, i) => {
      const match = line.match(/^(\s*)([^:]+):(.*)$/)
      if (!match) return [line]

      const key = match[2].trim().toLowerCase()
      if (key === "special" && special) return []
      if (key === "rebus") return [line]
      const value = match[3].trimStart()
      const migrated = migrateXDown(value)
      return [migrated === value ? line : `${match[1]}${match[2]}: ${migrated}`]
    })
  }

  // Grid
  const grid = doc.sections.find((s) => s.type === "grid")
  if (grid && special) {
    grid.lines = grid.lines.map((line) => line.replace(/[a-z]/g, (c) => c.toUpperCase()))
  }

  // Clues
  const clues = doc.sections.find((s) => s.type === "clues")
  if (clues) {
    const seen = new Set<string>()

    clues.lines = clues.lines.flatMap((line, i) => {
      if (!line.trim()) return [line]
      const indent = line.match(/^\s*/)![0]
      const trimmed = line.trim()

      // Metadata lines
      const meta = trimmed.match(/^([AD]\d+)\s+\^([^:]*):(.*)$/i)
      if (meta) {
        const key = meta[2].trim().toLowerCase()
        const value = meta[3].trimStart()
        const migrated = migrateXDown(value)
        if ((key === "hint" || key === "revealer") && migrated !== value) return [`${indent}${meta[1]} ^${meta[2]}: ${migrated}`]
        return [line]
      }

      const parts = readClueLine(trimmed, json, splitChar)
      if (!parts) return [line]

      const ref = `${parts.dir.toUpperCase()}${parts.num}`
      const body = migrateXDown(parts.body, true)

      // A second clue for the same slot was the hint
      if (seen.has(ref)) return [`${indent}${ref} ^Hint: ${body}`]
      seen.add(ref)

      const answers = moveSplitsToAnnotation(parts.answers, splitChar)
      const newLine = `${indent}${parts.dir}${parts.num}.${body ? ` ${body}` : ""} ~ ${answers}`
      return [newLine === `${indent}${trimmed}` ? line : newLine]
    })
  }

  // Design
  let design = doc.sections.find((s) => s.type === "design")
  if (design) migrateDesignSection(design)

  if (special) {
    if (!design) {
      design = { type: "design", header: "## Design", lines: [""] }
      const notes = doc.sections.findIndex((s) => s.type === "notes")
      if (notes === -1) doc.sections.push(design)
      else doc.sections.splice(notes, 0, design)
    }
    addSpecialCellsToDesign(design, special, json)
  }

  const migrated = joinSections(doc)
  return crlf ? migrated.replace(/\n/g, "\r\n") : migrated
}

/**
 * Re-writes xdown which uses pre-v4 syntax, leaving anything else alone. The v4 parser still
 * understands the old positional links/images/colors, so if it doesn't complain the string is fine.
 */
function migrateXDown(str: string, isClueBody = false) {
  const needsEscaping = isClueBody && str.includes(" ~ ")
  if (!str.includes("{") && !needsEscaping) return str

  let deprecated = false
  const components = parseXDown(str, { onDeprecated: () => (deprecated = true) })
  return deprecated || needsEscaping ? serializeXDown(components) : str
}

type JSONClue = CrosswordJSON["clues"]["across"][number]

/**
 * Pre-v4 clue bodies ran to the *last* ' ~ ', in v4 they run to the first and each ' ~ ' after
 * that is another answer. When a line has more than one, use whichever reading fits the grid.
 */
function readClueLine(line: string, json: CrosswordJSON, splitChar?: string) {
  const ref = line.match(/^([AD])(\d+)\./i)
  if (!ref) return undefined
  const rest = line.slice(ref[0].length)
  const segments = rest.split(" ~ ")
  if (segments.length < 2) return undefined

  const dir = ref[1]
  const num = Number(ref[2])
  const clue = json.clues[dir.toUpperCase() === "A" ? "across" : "down"].find((c) => c.number === num)

  const body = (str: string) => str.replace(/^\s/, "")
  const v4 = { dir, num, clue, body: body(segments[0]), answers: segments.slice(1) }
  if (segments.length === 2) return v4

  const legacy = { dir, num, clue, body: body(segments.slice(0, -1).join(" ~ ")), answers: segments.slice(-1) }
  const fits = (answer: string) => !!clue && slotFits(clue, answer, splitChar)
  return !fits(v4.answers[0]) && fits(legacy.answers[0]) ? legacy : v4
}

/**
 * Split characters move out of the answers and into an end-of-line annotation:
 * '~ OK|GO ~ OK|AY' → '~ OKGO ~ OKAY // OK|GO OK|AY'
 */
function moveSplitsToAnnotation(segments: string[], splitChar?: string) {
  const line = segments.join(" ~ ")
  if (!splitChar || line.includes(" // ")) return line

  const annotation: string[] = []
  const plainSegments = segments.map((segment) => {
    const word = firstWord(segment)
    if (!word.includes(splitChar)) return segment
    annotation.push(word)
    const start = segment.indexOf(word)
    return segment.slice(0, start) + word.split(splitChar).join("") + segment.slice(start + word.length)
  })

  if (!annotation.length) return line
  return `${plainSegments.join(" ~ ").trimEnd()} // ${annotation.join(" ")}`
}

/** Whether an answer is one of the ways to fill the clue's slot in the grid */
function slotFits(clue: JSONClue, answer: string, splitChar?: string) {
  const word = firstWord(answer)
  const plain = splitChar ? word.split(splitChar).join("") : word
  const variants = schrodingerVariants(clue.tiles)
  return variants.length ? variants.includes(plain) : spellSlot(clue.tiles, 0) === plain
}

const firstWord = (answer: string) => answer.trim().split(/\s+/)[0]

// Sections

type Section = {
  type: string
  /** The header line, undefined for anything before the first header */
  header?: string
  lines: string[]
}

function splitIntoSections(xd: string) {
  const sections: Section[] = [{ type: "preamble", lines: [] }]

  for (const line of xd.split("\n")) {
    if (line.startsWith("## ")) {
      const title = line.slice(3).trim().toLowerCase()
      const type = ["metadata", "grid", "clues", "design", "notes"].find((t) => title.startsWith(t)) || (title === "meta" ? "metadata" : title)
      sections.push({ type, header: line, lines: [] })
      continue
    }
    sections[sections.length - 1].lines.push(line)
  }

  return { sections }
}

const joinSections = (doc: { sections: Section[] }) =>
  doc.sections
    .flatMap((s) => (s.header === undefined ? s.lines : [s.header, ...s.lines]))
    .join("\n")

/**
 * Pre-v4 Puzzmo xd allowed HTML style comments: a line starting with '<!--' until a line ending with '-->'.
 * xd has no comments, so those lines are removed.
 */
function removeComments(xd: string) {
  let inComment = false
  return xd
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim()
      if (!inComment && !trimmed.startsWith("<!--")) return true
      inComment = !trimmed.endsWith("-->")
      return false
    })
    .join("\n")
}

const findLastIndex = <T>(arr: T[], fn: (t: T) => boolean) => {
  for (let i = arr.length - 1; i >= 0; i--) if (fn(arr[i])) return i
  return -1
}

// Schrödinger squares

/** The answer spelled out for each Schrödinger variant index, the index lines up across a whole slot */
function schrodingerVariants(tiles: Tile[]) {
  const count = Math.max(0, ...tiles.map((t) => (t.type === "schrodinger" ? t.validOptions?.length || 0 : 0)))
  const variants: string[] = []
  for (let i = 0; i < count; i++) variants.push(spellSlot(tiles, i))
  return variants
}

/** The letters in a slot, using the given variant index for any Schrödinger squares */
const spellSlot = (tiles: Tile[], variant: number) =>
  tiles
    .map((t) => {
      if (t.type === "letter") return t.letter
      if (t.type === "rebus") return t.word
      if (t.type === "schrodinger") return t.validOptions?.[variant] ?? t.validOptions?.[0] ?? ""
      return ""
    })
    .join("")

// Design

function migrateDesignSection(design: Section) {
  const rules = parseDesignRules(
    design.lines
      .join("\n")
      .replace(/<\/?style>/g, "")
      .split("\n")
      .filter((l) => l.includes("{") || l.includes("}") || l.includes(":"))
      .join("\n"),
  ).styles

  let insideRule = false
  let inGrid = false
  design.lines = design.lines.flatMap((line, i) => {

    if (!inGrid) {
      if (/<\/?style>/.test(line)) {
        const without = line.replace(/<\/?style>/g, "")
        if (!without.trim()) return []
        line = without.trimEnd()
      }

      const trimmed = line.trim()
      if (insideRule || trimmed.includes("{") || !trimmed) {
        for (const char of trimmed) {
          if (char === "{") insideRule = true
          if (char === "}") insideRule = false
        }
        return [line]
      }
      inGrid = true
    }

    if (!line.trim()) return [line]
    // '.' marks an unstyled cell in v4, pre-v4 files also used '#' and spaces
    const indent = line.match(/^\s*/)![0]
    const row = [...line.trim()].map((c) => (!rules[c] && (c === "#" || c === " ") ? "." : c)).join("")
    return [indent + row]
  })

  // Tidy up blank lines left behind by a removed <style> line at the very top
  while (design.lines.length > 1 && !design.lines[0].trim() && !design.lines[1].trim()) design.lines.shift()
}

type SpecialCells = { kind: "circle" | "shaded"; cells: [number, number][] }

function migrateSpecialCells(json: CrosswordJSON, doc: { sections: Section[] }): SpecialCells | undefined {
  const kind = json.meta.special?.trim().toLowerCase()
  if (kind !== "circle" && kind !== "shaded") return undefined

  const grid = doc.sections.find((s) => s.type === "grid")
  if (!grid) return undefined

  const cells: [number, number][] = []
  grid.lines
    .filter((l) => l.trim())
    .forEach((line, y) => [...line.trim()].forEach((c, x) => /^[a-z]$/.test(c) && cells.push([y, x])))

  return cells.length ? { kind, cells } : undefined
}

function addSpecialCellsToDesign(design: Section, special: SpecialCells, json: CrosswordJSON) {
  // The parser has already picked a style character for these cells
  const [y0, x0] = special.cells[0]
  const char = json.design?.positions[y0]?.[x0] || (special.kind === "circle" ? "O" : "S")

  const contentIndexes = design.lines.map((l, i) => (l.trim() ? i : -1)).filter((i) => i !== -1)
  const gridStart = contentIndexes.find((i) => !design.lines[i].includes("{") && !design.lines[i].includes("}") && !design.lines[i].includes(":"))

  const existingRules = parseDesignRules(design.lines.slice(0, gridStart ?? design.lines.length).join("\n")).styles
  const rule = `${char} { background: ${special.kind} }`

  if (gridStart === undefined) {
    // No design grid yet, so make one the size of the puzzle
    const rows = json.tiles.map((row) => row.map(() => "."))
    for (const [y, x] of special.cells) if (rows[y]) rows[y][x] = char
    const insertAt = contentIndexes.length ? contentIndexes[contentIndexes.length - 1] + 1 : 1
    const newLines = [...(existingRules[char] ? [] : [rule]), "", ...rows.map((r) => r.join(""))]
    if (!contentIndexes.length) design.lines = ["", ...newLines, ""]
    else design.lines.splice(insertAt, 0, ...newLines)
    return
  }

  const gridLineIndexes = contentIndexes.filter((i) => i >= gridStart)
  for (const [y, x] of special.cells) {
    const lineIndex = gridLineIndexes[y]
    if (lineIndex === undefined) continue
    const line = design.lines[lineIndex]
    const indent = line.match(/^\s*/)![0]
    const cells = [...line.trim()]
    // A cell can only have one style, so leave any which already have one
    if (cells[x] === "." || cells[x] === undefined) {
      while (cells.length < x) cells.push(".")
      cells[x] = char
    }
    design.lines[lineIndex] = indent + cells.join("")
  }

  if (existingRules[char]) return

  // Put the new rule after the last existing one, or before the grid
  const lastRule = findLastIndex(design.lines.slice(0, gridStart), (l) => l.includes("}"))
  if (lastRule === -1) design.lines.splice(gridStart, 0, rule, "")
  else design.lines.splice(lastRule + 1, 0, rule)
}
