import { addHeadersToImplicitSections, hasImplicitSections } from "./legacyParser/implicitSections"
import { parseXDown, serializeXDown } from "./legacyParser/xdown"
import { type DesignStyles, parseDesignRules, serializeDesignRules } from "./legacyParser/design"
import { parseRebusField, serializeRebusField, type RebusRule } from "./legacyParser/rebus"
import {
  type Cell,
  type LegacyPuzzle,
  type LegacyTile,
  type Section,
  joinSections,
  readLegacyXD,
  splitIntoSections,
  UNFILLED_CELL,
} from "./legacyParser/readLegacyXD"

export interface MigrateOptions {
  /**
   * How metadata field names (`title:`) and clue metadata keys (`A1 ^hint:`) are written. Keys are case-insensitive
   * in xd, the default is lowercase which is what Puzzmo's puzzles and xd-crossword-tools use. The spec suggests
   * writers use titlecase (`Title:`, `A1 ^Hint:`).
   */
  keyCase?: "lowercase" | "titlecase"
}

/** Keys with more than one word, so titlecase knows where the words start */
const TITLECASE_KEYS = Object.fromEntries(
  [
    "SplitCharacter",
    "OriginalTitle",
    "PublishDate",
    "HintEditor",
    "HintLabel",
    "RevealLabel",
    "MaxHintsUntilDelay",
    "BlackSquares",
    "WhiteSpaces",
    "AcrossClues",
    "DownClues",
    "Refs",
  ].map((k) => [k.toLowerCase(), k]),
)

/** Writes a metadata field name or clue metadata key in the chosen case */
function formatKey(key: string, keyCase: "lowercase" | "titlecase") {
  // Only change what looks like a field name, not something like a design rule which ended up in the metadata
  if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u.test(key)) return key
  if (keyCase === "lowercase") return key.toLowerCase()

  const known = TITLECASE_KEYS[key.toLowerCase()]
  if (known) return known
  // A key written in camel case keeps its capitals ('amuseID' → 'AmuseID'), otherwise only its first letter is one
  const camel = key.slice(1) !== key.slice(1).toLowerCase() && key !== key.toUpperCase()
  return key[0].toUpperCase() + (camel ? key.slice(1) : key.slice(1).toLowerCase())
}

/**
 * Converts an xd file written for earlier versions of the spec (or with pre-v4 Puzzmo extensions)
 * into xd v4 syntax: https://github.com/century-arcade/xdformat/blob/master/doc/xd-format-v4.md
 *
 * This works on the text, so section order, unknown sections and formatting are kept,
 * and a file which is already v4 comes back unchanged. It handles:
 *
 * - Implicit (header-less) sections get `## Headings`, and `## Meta` becomes `## Metadata`
 * - `<!-- -->` comment lines are removed, xd doesn't support comments
 * - Pre-v4 xdown: `{@text|url@}` links, `{![url|alt]!}` images and `{#text|light|dark#}` colors become
 *   attribute based, and text which v4 would read as markup (`{$`, ` ~ ` in a clue body) is escaped
 * - A clue body which contained ' ~ ' (pre-v4 bodies ran to the last ' ~ ') gets it escaped
 * - Split characters move out of answers into an end-of-line annotation: `~ OK|GO ~ OK|AY` becomes `~ OKGO ~ OKAY // OK|GO OK|AY`
 * - A duplicated clue line (used as a hint) becomes `^Hint:` metadata
 * - The v3 `Special: circle|shaded` field and lowercase grid cells become a `## Design` section
 * - `## Design` sections lose their `<style>` wrapper, and use '.' for an unstyled cell and '#' for a black square
 * - Barred grids: the design's `bar-left` and `bar-top` move to a `## Bars` section, and `form: barred` goes
 * - The `Rebus` field: repeated keys (`1=O 1=A`) become '|' options (`1=O|A`), rules joined with ',' are split
 *   up, values v4 can't read are escaped, and a `?` key moves to an unused character
 * - Pre-v4 Puzzmo `*` squares get a rebus key whose options come from the answers through them, and `^alt:`
 *   answers move onto the clue line: `C*NE` with `A6 ^alt: CANE` becomes `C1NE`, `1=O|A` and `~ CONE ~ CANE`
 * - Answers which spelled a rebus with its key (`~ C1NE`) spell it out
 * - Metadata field names and clue metadata keys are written in lowercase (`title:`, `A1 ^hint:`), or titlecase
 *   with `{ keyCase: "titlecase" }` (`Title:`, `A1 ^Hint:`)
 *
 * v3 `/` rebus values (`1=C/P`) are left as they are, working out what each '/' meant takes knowing the puzzle.
 */
export function migrateXDToV4(xd: string, options: MigrateOptions = {}): string {
  const keyCase = options.keyCase ?? "lowercase"

  // Work with '\n' and put Windows line endings back at the end, so rewritten lines match the rest
  const crlf = xd.includes("\r\n")
  if (crlf) xd = xd.replace(/\r\n/g, "\n")

  if (hasImplicitSections(xd)) xd = addHeadersToImplicitSections(xd)
  xd = removeComments(xd)

  const puzzle = readLegacyXD(xd)
  const sections = splitIntoSections(xd)
  const section = (type: string) => sections.find((s) => s.type === type)
  // Like the parser, a file which uses ' // ' annotations without declaring a split character uses '|'
  const usesAnnotations = (section("clues")?.lines || []).some((l) => /^\s*[AD]\d+\..* ~ .* \/\/ /i.test(l))
  const splitChar = puzzle.meta.splitcharacter || (usesAnnotations ? "|" : undefined)

  const special = migrateSpecialCells(puzzle, sections)
  const keys = new KeyPicker(puzzle)
  // '?' is reserved for unfilled cells in v4, so a file which used it as a rebus key moves that key
  const rebusRename = puzzle.rebus.rules.some((r) => r.keys.includes(UNFILLED_CELL)) ? keys.next() : undefined

  // Clues are read up-front, '*' squares get their values from every answer which goes through them
  const clueSection = section("clues")
  const clueLines = clueSection ? readClueSection(clueSection.lines, puzzle, splitChar) : new Map<number, ClueLine>()
  const stars = migrateStarSquares(puzzle, clueLines, keys, splitChar)

  // Metadata
  const metadata = section("metadata")
  if (metadata) {
    if (/^## meta\s*$/i.test(metadata.header || "")) metadata.header = "## Metadata"

    let hasRebusLine = false
    metadata.lines = metadata.lines.flatMap((line) => {
      const match = line.match(/^(\s*)([^:]+):(.*)$/)
      if (!match) return [line]

      const key = match[2].trim().toLowerCase()
      if (key === "special" && special) return []
      // v4 barred grids have a Bars section, which this adds when the design had the bars
      if (key === "form" && match[3].trim().toLowerCase() === "barred") return []
      const value = match[3].trimStart()
      // The key in the chosen case, and a value only gets re-written when it changes
      const keyText = match[2].replace(match[2].trim(), formatKey(match[2].trim(), keyCase))
      const write = (migrated: string) => (migrated === value ? `${match[1]}${keyText}:${match[3]}` : `${match[1]}${keyText}: ${migrated}`)

      if (key === "rebus") {
        hasRebusLine = true
        return [write(migrateRebusField(value, { rename: rebusRename, extraOptions: stars.extraOptions, newRules: stars.rules }))]
      }
      return [write(migrateXDown(value))]
    })

    if (!hasRebusLine && stars.rules.length) addMetadataField(metadata, formatKey("rebus", keyCase), serializeRebusField(stars.rules))
  }

  // Grid
  const grid = section("grid")
  if (grid) {
    let y = 0
    grid.lines = grid.lines.map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return line
      const row = y++
      const cells = [...trimmed].map((c, x) => {
        if (special && /^[a-z]$/.test(c)) return c.toUpperCase()
        if (c === UNFILLED_CELL && rebusRename) return rebusRename
        return stars.cells.get(`${row},${x}`) ?? c
      })
      const migrated = cells.join("")
      return migrated === trimmed ? line : line.replace(trimmed, migrated)
    })
  }

  // Clues
  if (clueSection) {
    // The answers of each slot's first clue, including '^alt' ones
    const firstAnswers = new Map<string, string[]>()
    const altsMoved = new Set(stars.altLinesMoved)

    clueSection.lines = clueSection.lines.flatMap((line, i) => {
      const entry = clueLines.get(i)
      if (!entry) return [line]
      if (altsMoved.has(i)) return []

      if (entry.kind === "meta") {
        const keyText = entry.rawKey.replace(entry.rawKey.trim(), formatKey(entry.rawKey.trim(), keyCase))
        const migrated = migrateXDown(entry.value)
        if ((entry.key === "hint" || entry.key === "revealer") && migrated !== entry.value) return [`${entry.indent}${entry.ref} ^${keyText}: ${migrated}`]
        return [line.replace(`^${entry.rawKey}:`, `^${keyText}:`)]
      }

      const body = migrateXDown(entry.body, true)

      // Pre-v4 Puzzmo files used a second clue for a slot, which repeated its answer, as the hint. In v4 a slot can
      // have a clue per fill, so a second clue with answers of its own stays a clue
      const answersOf = (answers: string[]) => answers.map((a) => removeSplits(firstWord(a), splitChar))
      const first = firstAnswers.get(entry.ref)
      if (first && answersOf(entry.answers).every((a) => first.includes(a))) return [`${entry.indent}${entry.ref} ^${formatKey("hint", keyCase)}: ${body}`]
      if (!first) firstAnswers.set(entry.ref, answersOf([...entry.answers, ...(stars.altsForRef.get(entry.ref) || [])]))

      const tiles = slotTiles(puzzle, entry.ref)
      const spell = (word: string) => spellOutRebusKeys(word, tiles, puzzle, splitChar)
      const { segments, annotation } = splitOffAnnotation(entry.answers)

      // '^alt' answers join the line, and an answer which is another one once its rebuses are spelled out goes
      const plain = (answer: string) => removeSplits(firstWord(answer), splitChar)
      const answers: string[] = []
      for (const answer of [...segments.map((s) => replaceFirstWord(s, spell)), ...(stars.altsForRef.get(entry.ref) || []).map(spell)]) {
        if (!answers.some((a) => plain(a) === plain(answer))) answers.push(answer)
      }

      const answerText = moveSplitsToAnnotation(answers, annotation.map(spell), splitChar)
      const newLine = `${entry.indent}${entry.dir}${entry.num}.${body ? ` ${body}` : ""} ~ ${answerText}`
      return [newLine === `${entry.indent}${line.trim()}` ? line : newLine]
    })
  }

  // Design
  let design = section("design")
  if (design) migrateDesignSection(design, puzzle)

  if (special) {
    if (!design) {
      design = { type: "design", header: "## Design", lines: [""] }
      const notes = sections.findIndex((s) => s.type === "notes")
      if (notes === -1) sections.push(design)
      else sections.splice(notes, 0, design)
    }
    addSpecialCellsToDesign(design, special, puzzle)
  }

  // Bars: pre-v4 Puzzmo barred grids kept them in the design
  if (!puzzle.hasBarsSection) addBarsSection(sections, puzzle)
  if (design && removeBarsFromDesign(design, puzzle)) sections.splice(sections.indexOf(design), 1)

  const migrated = joinSections(sections)
  return crlf ? migrated.replace(/\n/g, "\r\n") : migrated
}

/**
 * Re-writes xdown which uses pre-v4 syntax, leaving anything else alone. The xdown reader still
 * understands the old positional links/images/colors, so if it doesn't complain the string is fine.
 */
function migrateXDown(str: string, isClueBody = false) {
  const needsEscaping = isClueBody && str.includes(" ~ ")
  if (!str.includes("{") && !needsEscaping) return str

  let deprecated = false
  const components = parseXDown(str, { onDeprecated: () => (deprecated = true) })
  return deprecated || needsEscaping ? serializeXDown(components) : str
}

/** Adds a metadata field after the last one, indented like the others */
function addMetadataField(metadata: Section, key: string, value: string) {
  const fields = metadata.lines.map((l, i) => (l.match(/^\s*[^:\s][^:]*:/) ? i : -1)).filter((i) => i !== -1)
  const last = fields[fields.length - 1]
  const indent = last === undefined ? "" : metadata.lines[fields[0]].match(/^\s*/)![0]
  const line = `${indent}${key}: ${value}`
  if (last === undefined) metadata.lines.splice(metadata.lines[0]?.trim() === "" ? 1 : 0, 0, line)
  else metadata.lines.splice(last + 1, 0, line)
}

// Clue lines

type ClueLine =
  | { kind: "clue"; indent: string; ref: string; dir: string; num: number; body: string; answers: string[] }
  | { kind: "meta"; indent: string; ref: string; key: string; rawKey: string; value: string }

/** Reads each clue and clue metadata line, keyed by its index in the section */
function readClueSection(lines: string[], puzzle: LegacyPuzzle, splitChar?: string) {
  const entries = new Map<number, ClueLine>()
  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return
    const indent = line.match(/^\s*/)![0]

    const meta = trimmed.match(/^([AD]\d+)\s+\^([^:]*):(.*)$/i)
    if (meta) {
      entries.set(i, { kind: "meta", indent, ref: meta[1].toUpperCase(), key: meta[2].trim().toLowerCase(), rawKey: meta[2], value: meta[3].trimStart() })
      return
    }

    const parts = readClueLine(trimmed, puzzle, splitChar)
    if (parts) entries.set(i, { kind: "clue", indent, ref: `${parts.dir.toUpperCase()}${parts.num}`, ...parts })
  })
  return entries
}

/**
 * Pre-v4 clue bodies ran to the *last* ' ~ ', in v4 they run to the first and each ' ~ ' after
 * that is another answer. When a line has more than one, use whichever reading fits the grid.
 */
function readClueLine(line: string, puzzle: LegacyPuzzle, splitChar?: string) {
  const ref = line.match(/^([AD])(\d+)\./i)
  if (!ref) return undefined
  const rest = line.slice(ref[0].length)
  const segments = rest.split(" ~ ")
  if (segments.length < 2) return undefined

  const dir = ref[1]
  const num = Number(ref[2])
  const tiles = slotTiles(puzzle, `${dir.toUpperCase()}${num}`)

  const body = (str: string) => str.replace(/^\s/, "")
  const v4 = { dir, num, body: body(segments[0]), answers: segments.slice(1) }
  if (segments.length === 2) return v4

  const legacy = { dir, num, body: body(segments.slice(0, -1).join(" ~ ")), answers: segments.slice(-1) }
  const fits = (answer: string) => !!tiles && slotFits(tiles, answer, splitChar)
  return !fits(v4.answers[0]) && fits(legacy.answers[0]) ? legacy : v4
}

const slotTiles = (puzzle: LegacyPuzzle, ref: string) => {
  const cells = puzzle.slots[ref[0] === "A" ? "across" : "down"].get(Number(ref.slice(1)))
  return cells?.map(([y, x]) => puzzle.tiles[y][x])
}

/** Whether an answer is one of the ways to fill a slot, a '*' square takes any one character */
function slotFits(tiles: LegacyTile[], answer: string, splitChar?: string) {
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = tiles
    .map((tile) => {
      if (tile.type === "letter") return escape(tile.letter)
      if (tile.type === "star") return "."
      if (tile.type === "rebus") return `(?:${[...tile.options, tile.key].map(escape).join("|")})`
      return ""
    })
    .join("")
  return new RegExp(`^${pattern}$`, "u").test(removeSplits(firstWord(answer), splitChar))
}

/** Separates the answers from an end-of-line ' // ' annotation, the answers written with split characters */
function splitOffAnnotation(segments: string[]) {
  const text = segments.join(" ~ ")
  const start = text.indexOf(" // ")
  if (start === -1) return { segments, annotation: [] as string[] }
  return { segments: text.slice(0, start).split(" ~ "), annotation: text.slice(start + 4).trim().split(/\s+/).filter(Boolean) }
}

/**
 * Split characters move out of the answers and into an end-of-line annotation:
 * '~ OK|GO ~ OK|AY' → '~ OKGO ~ OKAY // OK|GO OK|AY'. A line which already has an annotation keeps it.
 */
function moveSplitsToAnnotation(segments: string[], existing: string[], splitChar?: string) {
  const withAnnotation = (answers: string[], annotation: string[]) =>
    annotation.length ? `${answers.join(" ~ ").trimEnd()} // ${annotation.join(" ")}` : answers.join(" ~ ")
  if (!splitChar || existing.length) return withAnnotation(segments, existing)

  const annotation: string[] = []
  const plainSegments = segments.map((segment) => {
    const word = firstWord(segment)
    if (!word.includes(splitChar)) return segment
    annotation.push(word)
    return replaceFirstWord(segment, (w) => w.split(splitChar).join(""))
  })
  return withAnnotation(plainSegments, annotation)
}

const firstWord = (answer: string) => answer.trim().split(/\s+/)[0]
const removeSplits = (word: string, splitChar?: string) => (splitChar ? word.split(splitChar).join("") : word)

/** Changes the answer at the start of a ' ~ ' segment, leaving any text after it */
function replaceFirstWord(segment: string, fn: (word: string) => string) {
  const word = firstWord(segment)
  if (!word) return segment
  const start = segment.indexOf(word)
  return segment.slice(0, start) + fn(word) + segment.slice(start + word.length)
}

// Rebus keys

/** Characters which can become a new rebus key, in the order they are used */
const KEY_CANDIDATES = [..."123456789@$%&+!<>0", ...Array.from({ length: 20 }, (_, i) => String.fromCodePoint(0x2460 + i))]

/** Hands out rebus keys which the file doesn't use yet */
class KeyPicker {
  private used: Set<string>
  constructor(puzzle: LegacyPuzzle) {
    this.used = new Set([...puzzle.grid.flat(), ...puzzle.rebus.rules.flatMap((r) => r.keys), ...puzzle.rebus.unreadable.map((r) => r.split("=")[0]).flatMap((k) => [...k])])
  }
  next() {
    const key = KEY_CANDIDATES.find((c) => !this.used.has(c))
    if (!key) throw new Error("xd-crossword-migrator: ran out of characters to use as rebus keys")
    this.used.add(key)
    return key
  }
}

/**
 * Re-writes the 'Rebus' field in xd v4 syntax when it has pre-v4 parts: repeated keys ('1=O 1=A') become one
 * rule's options ('1=O|A'), rules joined with ',' are split up, and a value which v4 can't read (like '1=|') is
 * escaped, as pre-v4 values were literal strings. A '?' key moves to `rename`, options from '^alt' answers are
 * added, and the rules for '*' squares go on the end. Anything else is left as written.
 *
 * '/' (as in '1=C/P') has no meaning in v4. The v3 corpus used it for several different things, so working out
 * what each '/' meant takes knowing the puzzle, and those values are left as they are.
 */
function migrateRebusField(field: string, changes: { rename?: string; extraOptions: Map<string, string[]>; newRules: RebusRule[] }) {
  const { rules, errors, deprecations, unreadable } = parseRebusField(field)
  const renames = !!changes.rename && rules.some((r) => r.keys.includes(UNFILLED_CELL))
  const changed = errors.length || deprecations.length || renames || changes.extraOptions.size || changes.newRules.length
  if (!changed) return field

  // Writing out the rules would lose any which couldn't be read, so leave those for a person to fix
  if (unreadable.length) return changes.newRules.length ? `${field.trim()} ${serializeRebusField(changes.newRules)}` : field

  const migrated = rules.map((rule) => ({
    keys: rule.keys.map((k) => (k === UNFILLED_CELL && changes.rename ? changes.rename : k)),
    options: rule.keys.length === 1 ? [...rule.options, ...(changes.extraOptions.get(rule.keys[0]) || []).map((o) => [o])] : rule.options,
  }))
  return serializeRebusField([...migrated, ...changes.newRules])
}

/** The single value of a rebus key with one option, for answers which spelled a rebus with its key */
const plainRebusWord = (puzzle: LegacyPuzzle, char: string) => {
  const rule = puzzle.rebus.rules.find((r) => r.keys.length === 1 && r.keys[0] === char && r.options.length === 1)
  return rule?.options[0][0]
}

/**
 * Pre-v4 answers could spell a rebus with its key ('C1NE' for CARNE), v4 answers always spell it out.
 * Only a key in a rebus or '*' square's place is spelled out, a key elsewhere is a letter of the answer.
 */
function spellOutRebusKeys(word: string, tiles: LegacyTile[] | undefined, puzzle: LegacyPuzzle, splitChar?: string) {
  if (!tiles || !puzzle.rebus.rules.length) return word

  const chars = [...word]
  let out = ""
  let i = 0
  const take = (count: number) => {
    // Split characters don't belong to a square, so they come along as they are
    for (let taken = 0; i < chars.length && taken < count; i++) {
      out += chars[i]
      if (chars[i] !== splitChar) taken++
    }
  }
  const restWithoutSplits = () => removeSplits(chars.slice(i).join(""), splitChar)

  for (const tile of tiles) {
    while (i < chars.length && chars[i] === splitChar) out += chars[i++]
    if (i >= chars.length) break

    if (tile.type === "rebus" || tile.type === "star") {
      const options = tile.type === "rebus" ? tile.options.filter(Boolean).sort((a, b) => [...b].length - [...a].length) : []
      const spelled = options.find((o) => restWithoutSplits().startsWith(o))
      if (spelled) {
        take([...spelled].length)
        continue
      }
      const char = chars[i]
      const expansion = plainRebusWord(puzzle, char) ?? (tile.type === "rebus" && char === tile.key ? tile.options[0] : undefined)
      if (expansion !== undefined) {
        out += expansion
        i++
        continue
      }
      // A '()' square the answer leaves empty
      if (tile.type === "rebus" && tile.options.includes("")) continue
    }
    take(1)
  }
  return out + chars.slice(i).join("")
}

// Schrödinger squares

/**
 * Pre-v4 Puzzmo files marked a Schrödinger square with '*', and gave its other values with '^alt' answers.
 * Each '*' square becomes a rebus key whose options are the values from the answers through it, in the order
 * they were read: a clue's first answer and its '^alt's, then the rest of its answers. Like the parser did,
 * only a clue with more than one answer adds values. Squares with the same options share a key.
 *
 * '^alt' answers through a square from the Rebus field add their values to its options too.
 */
function migrateStarSquares(puzzle: LegacyPuzzle, clueLines: Map<number, ClueLine>, keys: KeyPicker, splitChar?: string) {
  const values = new Map<string, string[]>()
  const fallback = new Map<string, string>()
  const extraOptions = new Map<string, string[]>()
  const altsForRef = new Map<string, string[]>()
  const altLinesMoved: number[] = []

  const clueRefs = new Set([...clueLines.values()].filter((e) => e.kind === "clue").map((e) => e.ref))
  for (const [i, entry] of clueLines) {
    if (entry.kind !== "meta" || !/^alt\d*$/.test(entry.key) || !clueRefs.has(entry.ref)) continue
    if (!altsForRef.has(entry.ref)) altsForRef.set(entry.ref, [])
    altsForRef.get(entry.ref)!.push(firstWord(entry.value))
    altLinesMoved.push(i)
  }

  const add = (map: Map<string, string[]>, key: string, value: string) => {
    if (!map.has(key)) map.set(key, [])
    if (!map.get(key)!.includes(value)) map.get(key)!.push(value)
  }

  const seen = new Set<string>()
  for (const entry of clueLines.values()) {
    if (entry.kind !== "clue" || seen.has(entry.ref)) continue
    seen.add(entry.ref)
    const cells = puzzle.slots[entry.ref[0] === "A" ? "across" : "down"].get(entry.num)
    if (!cells) continue
    const tiles = cells.map(([y, x]) => puzzle.tiles[y][x])
    if (!tiles.some((t) => t.type === "star" || (t.type === "rebus" && t.options.length > 1))) continue

    const answers = entry.answers.map((a) => removeSplits(firstWord(a), splitChar))
    const alts = (altsForRef.get(entry.ref) || []).map((a) => removeSplits(a, splitChar))

    const lists: [answers: string[], starsOnly: boolean][] = [
      [[answers[0], ...alts], false],
      [answers, true],
    ]
    for (const [list, starsOnly] of lists) {
      if (list.length < 2) continue
      for (const answer of list) {
        const inSlot = valuesInSlot(answer, tiles, puzzle)
        tiles.forEach((tile, t) => {
          const value = inSlot[t]
          if (value === undefined) return
          if (tile.type === "star") add(values, cellKey(cells[t]), value)
          else if (!starsOnly && tile.type === "rebus" && isOneKeyRule(puzzle, tile.key) && !tile.options.includes(value)) add(extraOptions, tile.key, value)
        })
      }
    }

    // A '*' square which no clue gives alternatives for still gets the value from its first answer
    const first = valuesInSlot(answers[0], tiles, puzzle)
    tiles.forEach((tile, t) => tile.type === "star" && first[t] !== undefined && !fallback.has(cellKey(cells[t])) && fallback.set(cellKey(cells[t]), first[t]!))
  }

  // Give each set of options a key, a single letter can go straight into the grid
  const cells = new Map<string, string>()
  const rules: RebusRule[] = []
  const keyForOptions = new Map<string, string>()
  puzzle.tiles.forEach((row, y) =>
    row.forEach((tile, x) => {
      if (tile.type !== "star") return
      const options = values.get(cellKey([y, x])) || (fallback.has(cellKey([y, x])) ? [fallback.get(cellKey([y, x]))!] : [])
      if (!options.length) return
      if (options.length === 1 && /^[A-Z]$/.test(options[0])) {
        cells.set(cellKey([y, x]), options[0])
        return
      }
      const id = options.join("\u0000")
      if (!keyForOptions.has(id)) {
        const key = keys.next()
        keyForOptions.set(id, key)
        rules.push({ keys: [key], options: options.map((o) => [o]) })
      }
      cells.set(cellKey([y, x]), keyForOptions.get(id)!)
    }),
  )

  return { cells, rules, extraOptions, altsForRef, altLinesMoved }
}

const cellKey = ([y, x]: Cell) => `${y},${x}`
const isOneKeyRule = (puzzle: LegacyPuzzle, key: string) => puzzle.rebus.rules.some((r) => r.keys.length === 1 && r.keys[0] === key)

/** What an answer puts in each square of its slot, a rebus key in a square's place is that rebus */
function valuesInSlot(answer: string, tiles: LegacyTile[], puzzle: LegacyPuzzle) {
  const chars = [...answer]
  const values: (string | undefined)[] = []
  let i = 0
  tiles.forEach((tile, t) => {
    if (i >= chars.length) return
    const rest = chars.slice(i).join("")

    if (tile.type === "rebus" && tile.options.length === 1) {
      const word = tile.options[0]
      i += rest.startsWith(word) ? [...word].length : chars[i] === tile.key ? 1 : [...word].length
      return
    }
    if (tile.type === "rebus") {
      const option = tile.options.filter((o) => o && rest.startsWith(o)).sort((a, b) => [...b].length - [...a].length)[0]
      if (option) {
        values[t] = option
        i += [...option].length
        return
      }
    }

    const char = chars[i++]
    values[t] = plainRebusWord(puzzle, char) ?? char
  })
  return values
}

// Sections

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

// Design

/** An unstyled cell is a '.', except a black square which echoes the grid's shape with a '#' */
const unstyledDesignCell = (tile: LegacyTile | undefined) => (tile?.type === "blank" ? "#" : ".")

function migrateDesignSection(design: Section, puzzle: LegacyPuzzle) {
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
  let gridRow = 0
  design.lines = design.lines.flatMap((line) => {
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
    // '.' marks an unstyled cell in v4, pre-v4 files also used '#' and spaces. A black square keeps
    // its '#' (a style character without a rule is legal v4) so the design echoes the grid's shape.
    const tiles = puzzle.tiles[gridRow++] || []
    const indent = line.match(/^\s*/)![0]
    const row = [...line.trim()].map((c, x) => (!rules[c] && (c === "#" || c === " " || c === ".") ? unstyledDesignCell(tiles[x]) : c)).join("")
    return [indent + row]
  })

  // Tidy up blank lines left behind by a removed <style> line at the very top
  while (design.lines.length > 1 && !design.lines[0].trim() && !design.lines[1].trim()) design.lines.shift()
}

// Bars

/**
 * Pre-v4 Puzzmo barred grids put their bars in the design, as `bar-left` and `bar-top`. In v4 the bars which end
 * entries go in a `## Bars` section after the grid: '|' on a cell's left edge, '-' on its top edge, '+' on both.
 */
function addBarsSection(sections: Section[], puzzle: LegacyPuzzle) {
  const rows = puzzle.tiles.map((row, y) =>
    row
      .map((tile, x) => {
        if (tile.type === "blank") return "#"
        const { left, top } = puzzle.bars(y, x)
        return left && top ? "+" : left ? "|" : top ? "-" : "."
      })
      .join(""),
  )
  if (!rows.some((row) => /[|+-]/.test(row))) return

  const grid = sections.findIndex((s) => s.type === "grid")
  sections.splice(grid + 1, 0, { type: "bars", header: "## Bars", lines: ["", ...rows, ""] })
}

/**
 * Takes `bar-left` and `bar-top` out of the design's rules, as the bars are in the Bars section now. A cell whose
 * rule only had bars is unstyled. Returns whether nothing is left, so the design section can go.
 */
function removeBarsFromDesign(design: Section, puzzle: LegacyPuzzle) {
  // The rules come first, the grid starts at the first line which isn't part of a rule
  let insideRule = false
  let gridStart = design.lines.length
  for (let i = 0; i < design.lines.length; i++) {
    const trimmed = design.lines[i].trim()
    if (!insideRule && trimmed && !trimmed.includes("{")) {
      gridStart = i
      break
    }
    for (const char of trimmed) {
      if (char === "{") insideRule = true
      if (char === "}") insideRule = false
    }
  }

  const { styles } = parseDesignRules(design.lines.slice(0, gridStart).join("\n"))
  if (!Object.values(styles).some((rule) => "bar-left" in rule || "bar-top" in rule)) return false

  const kept: DesignStyles = {}
  for (const [char, rule] of Object.entries(styles)) {
    const { "bar-left": _left, "bar-top": _top, ...rest } = rule
    if (Object.keys(rest).length) kept[char] = rest
  }
  if (!Object.keys(kept).length) return true

  let row = 0
  const grid = design.lines.slice(gridStart).map((line) => {
    if (!line.trim()) return line
    const tiles = puzzle.tiles[row++] || []
    const indent = line.match(/^\s*/)![0]
    return indent + [...line.trim()].map((c, x) => (styles[c] && !kept[c] ? unstyledDesignCell(tiles[x]) : c)).join("")
  })
  design.lines = ["", ...serializeDesignRules(kept).split("\n"), "", ...grid]
  return false
}

type SpecialCells = { kind: "circle" | "shaded"; cells: Cell[] }

function migrateSpecialCells(puzzle: LegacyPuzzle, sections: Section[]): SpecialCells | undefined {
  const kind = puzzle.meta.special?.trim().toLowerCase()
  if (kind !== "circle" && kind !== "shaded") return undefined

  const grid = sections.find((s) => s.type === "grid")
  if (!grid) return undefined

  const cells: Cell[] = []
  grid.lines
    .filter((l) => l.trim())
    .forEach((line, y) => [...line.trim()].forEach((c, x) => /^[a-z]$/.test(c) && cells.push([y, x])))

  return cells.length ? { kind, cells } : undefined
}

function addSpecialCellsToDesign(design: Section, special: SpecialCells, puzzle: LegacyPuzzle) {
  // The reader has already picked a style character for these cells
  const [y0, x0] = special.cells[0]
  const char = puzzle.design?.positions[y0]?.[x0] || (special.kind === "circle" ? "O" : "S")

  const contentIndexes = design.lines.map((l, i) => (l.trim() ? i : -1)).filter((i) => i !== -1)
  const gridStart = contentIndexes.find((i) => !design.lines[i].includes("{") && !design.lines[i].includes("}") && !design.lines[i].includes(":"))

  const existingRules = parseDesignRules(design.lines.slice(0, gridStart ?? design.lines.length).join("\n")).styles
  const rule = `${char} { background: ${special.kind} }`

  if (gridStart === undefined) {
    // No design grid yet, so make one the size of the puzzle
    const rows: string[][] = puzzle.tiles.map((row) => row.map(unstyledDesignCell))
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
    if (cells[x] === "." || cells[x] === "#" || cells[x] === undefined) {
      while (cells.length < x) cells.push(unstyledDesignCell(puzzle.tiles[y]?.[cells.length]))
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
