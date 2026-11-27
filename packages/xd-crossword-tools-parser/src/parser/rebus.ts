import type { Tile } from "../types"

/**
 * One rule from the 'Rebus' field. `1=EIGHT|8` is `{ keys: ["1"], options: [["EIGHT"], ["8"]] }`, and a rule with
 * several keys links its cells: `12=(SC)(EG)|SE|CG` is `{ keys: ["1", "2"], options: [["SC", "EG"], ["S", "E"], ["C", "G"]] }`.
 */
export interface RebusRule {
  /** The grid characters which this rule declares, more than one links those cells together */
  keys: string[]
  /**
   * Each option has one segment per key, in key order. The first option is the solution, an empty
   * string is a cell which is correct when left empty (written `()`)
   */
  options: string[][]
}

export interface RebusFieldParse {
  rules: RebusRule[]
  /** Things which are not valid xd v4, the field is still read as well as it can be */
  errors: string[]
  /** Pre-v4 syntax, which is read by the v4 rules and so doesn't mean what it used to. xd-crossword-migrator can update it */
  deprecations: string[]
  /** Rules which couldn't be read at all, as written, so they are not in `rules` */
  unreadable: string[]
}

/** Characters with a meaning in the 'Rebus' field, which have to be escaped with '\' to be used in a value */
const RESERVED = new Set(["|", ",", "(", ")", "\\"])

/**
 * Reads the xd v4 'Rebus' field: whitespace separated rules, each of which gives one or more keys a
 * '|' separated list of options - https://github.com/century-arcade/xdformat/blob/master/doc/xd-format-v4.md#rebus
 *
 *     Rebus: 1=HEART 2=EIGHT|8 3=()|H 12345=CIGAR|PENIS
 *
 * Pre-v4 syntax gets a deprecation, and is read as v4: of repeated keys (`1=O 1=A`) only the first
 * rule counts, and rules joined with ',' (`1=OIL,2=WATER`) can't be read.
 */
export function parseRebusField(field: string): RebusFieldParse {
  const result: RebusFieldParse = { rules: [], errors: [], deprecations: [], unreadable: [] }
  if (!field.trim()) return result

  // The rule each key was declared in (and how it was written), to find keys which are declared twice
  const ruleForKey = new Map<string, { rule: RebusRule; text: string }>()
  const repeated = new Map<string, string[]>()

  for (const text of field.trim().split(/[ \t]+/)) {
    // Pre-v4 NYT files joined rules with ',', which v4 reserves
    const pieces = splitUnescaped(text, ",")
    if (pieces.length > 1 && pieces.every((p) => /^[^=]+=./u.test(p))) {
      result.deprecations.push(
        `Rebus rules are separated by spaces in xd v4, ',' is reserved so '${text}' can't be read: use '${pieces.join(" ")}'. xd-crossword-migrator can convert this file.`,
      )
      result.unreadable.push(text)
      continue
    }

    const parsed = parseRebusRule(text)
    if ("error" in parsed) {
      result.errors.push(parsed.error)
      result.unreadable.push(text)
      continue
    }

    const { rule } = parsed
    const [key] = rule.keys
    const existing = rule.keys.length === 1 ? ruleForKey.get(key) : undefined

    // Pre-v4 Schrödinger cells repeated the key once per value: '1=O 1=A', in v4 only the first counts
    if (existing && existing.rule.keys.length === 1) {
      if (!repeated.has(key)) repeated.set(key, [existing.text])
      repeated.get(key)!.push(text)
      continue
    }

    const alreadyDeclared = rule.keys.filter((k) => ruleForKey.has(k))
    if (alreadyDeclared.length) {
      result.errors.push(`The rebus key '${alreadyDeclared[0]}' is declared more than once, a key can only be in one rule`)
      result.unreadable.push(text)
      continue
    }

    rule.keys.forEach((k) => ruleForKey.set(k, { rule, text }))
    result.rules.push(rule)
  }

  for (const [key, texts] of repeated) {
    const merged = texts.map((t) => t.slice(t.indexOf("=") + 1)).join("|")
    result.deprecations.push(
      `'${texts.join(" ")}' repeats the rebus key '${key}', and xd v4 only reads the first. A cell's options go in one rule: '${key}=${merged}'. xd-crossword-migrator can convert this file.`,
    )
  }

  return result
}

type RuleParse = { rule: RebusRule } | { error: string }

/** Reads a single rule, like `1=EIGHT|8` or `12=(SC)(EG)|SE|CG` */
export function parseRebusRule(text: string): RuleParse {
  const equals = text.indexOf("=")
  if (equals === -1) return { error: `The rebus rule '${text}' is missing the '=' between its key and its options` }

  const keys = [...text.slice(0, equals)]
  const value = text.slice(equals + 1)
  if (!keys.length) return { error: `The rebus rule '${text}' is missing a key before the '='` }

  const reservedKey = keys.find((k) => RESERVED.has(k))
  if (reservedKey) return { error: `'${reservedKey}' can't be a rebus key, it has a meaning in the Rebus field` }

  const twice = keys.find((k, i) => keys.indexOf(k) !== i)
  if (twice) return { error: `The rebus rule '${text}' declares the key '${twice}' twice` }

  const single = keys.length === 1
  const fail = (error: string): RuleParse => ({ error })

  const options: string[][] = []
  for (const optionText of splitUnescaped(value, "|")) {
    if (single) {
      const parsed = parseValue(optionText)
      if (typeof parsed !== "string") return fail(`The rebus rule '${text}' ${parsed.error}`)
      options.push([parsed])
      continue
    }

    const segments = parseLinked(optionText)
    if (!Array.isArray(segments)) return fail(`The rebus rule '${text}' ${segments.error}`)
    if (segments.length !== keys.length) {
      return fail(
        `The rebus rule '${text}' has ${keys.length} keys, so each option needs ${keys.length} segments, but '${optionText}' has ${segments.length}`,
      )
    }
    options.push(segments)
  }

  if (!single && options.length < 2) {
    return fail(`The rebus rule '${text}' links cells which change together, so it needs more than one option. Unlinked cells are separate rules: '${keys.map((k, i) => `${k}=${options[0]?.[i] ?? ""}`).join(" ")}'`)
  }

  return { rule: { keys, options } }
}

/** A single key's option: text, or text in parentheses. `()` is an empty cell */
function parseValue(optionText: string): string | { error: string } {
  if (optionText === "") return { error: `has an empty option, a cell which is correct when left empty is written '()'` }
  if (optionText.startsWith("(") && optionText.endsWith(")") && optionText.length > 1) return parseText(optionText.slice(1, -1), true)
  return parseText(optionText, false)
}

/** An option of a rule with several keys, one segment per key: a character, an escape, or text in parentheses */
function parseLinked(optionText: string): string[] | { error: string } {
  if (optionText === "") return { error: `has an empty option, a cell which is correct when left empty is written '()'` }

  const chars = [...optionText]
  const segments: string[] = []
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    if (char === "\\") {
      const escaped = chars[++i]
      if (escaped === undefined || !RESERVED.has(escaped)) return { error: badEscape(escaped) }
      segments.push(escaped)
    } else if (char === "(") {
      const close = findUnescaped(chars, ")", i + 1)
      if (close === -1) return { error: `has a '(' without a ')'` }
      const inner = parseText(chars.slice(i + 1, close).join(""), true)
      if (typeof inner !== "string") return inner
      segments.push(inner)
      i = close
    } else if (RESERVED.has(char)) {
      return { error: reservedInValue(char) }
    } else {
      segments.push(char)
    }
  }
  return segments
}

/** Characters and escapes, without any of the reserved characters */
function parseText(text: string, allowEmpty: boolean): string | { error: string } {
  if (!text && !allowEmpty) return { error: `has an empty option, a cell which is correct when left empty is written '()'` }

  const chars = [...text]
  let result = ""
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    if (char === "\\") {
      const escaped = chars[++i]
      if (escaped === undefined || !RESERVED.has(escaped)) return { error: badEscape(escaped) }
      result += escaped
    } else if (RESERVED.has(char)) {
      return { error: reservedInValue(char) }
    } else {
      result += char
    }
  }
  return result
}

const badEscape = (char: string | undefined) =>
  char === undefined
    ? `ends with a '\\', write a literal backslash as '\\\\'`
    : `has '\\${char}', which isn't an escape: '\\' can only escape '|', ',', '(', ')' and '\\'`

const reservedInValue = (char: string) => `has a '${char}' which has a meaning in the Rebus field, write a literal '${char}' as '\\${char}'`

/** Splits on a separator, skipping over anything escaped with '\' */
function splitUnescaped(text: string, separator: string) {
  const parts: string[] = []
  let current = ""
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\\" && i + 1 < text.length) {
      current += text[i] + text[i + 1]
      i++
    } else if (text[i] === separator) {
      parts.push(current)
      current = ""
    } else {
      current += text[i]
    }
  }
  parts.push(current)
  return parts
}

function findUnescaped(chars: string[], target: string, from: number) {
  for (let i = from; i < chars.length; i++) {
    if (chars[i] === "\\") i++
    else if (chars[i] === target) return i
  }
  return -1
}

// Writing

const escapeRebusText = (text: string) => [...text].map((c) => (RESERVED.has(c) ? `\\${c}` : c)).join("")

/** Writes a rule in xd v4 syntax: `1=EIGHT|8`, `1=()|H`, `12=(SC)(EG)|SE|CG` */
export function serializeRebusRule(rule: RebusRule): string {
  const single = rule.keys.length === 1
  const options = rule.options.map((option) =>
    single
      ? option[0] === ""
        ? "()"
        : escapeRebusText(option[0])
      : option.map((segment) => ([...segment].length === 1 ? escapeRebusText(segment) : `(${escapeRebusText(segment)})`)).join(""),
  )
  return `${rule.keys.join("")}=${options.join("|")}`
}

/** Writes a whole 'Rebus' field in xd v4 syntax */
export const serializeRebusField = (rules: RebusRule[]) => rules.map(serializeRebusRule).join(" ")

// Checking

/**
 * Whether a grid is solved, following https://github.com/century-arcade/xdformat/blob/master/doc/xd-format-v4.md#checking-a-solve
 *
 * Every letter cell holds its letter and every rebus rule is solved: a cell from a rule with one key holds
 * one of its options, and the cells of a linked rule all hold their segments of the same option. An
 * entry is a cell's string, '' for an empty cell. Case matters. A grid with unfilled ('?') cells has no
 * known solution, so it can't be solved.
 *
 * @param tiles the tiles from `xdToJSON`
 * @param entries what is in each cell, indexed `[row][col]` like `tiles`
 */
export function isGridSolved(tiles: Tile[][], entries: string[][]): boolean {
  const linked = new Map<string, { options: string[]; entry: string }[]>()

  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      const tile = tiles[y][x]
      const entry = entries[y]?.[x] ?? ""

      if (tile.type === "blank") continue
      if (tile.type === "letter") {
        if (tile.unfilled || entry !== tile.letter) return false
      } else if (tile.type === "rebus") {
        if (entry !== tile.word) return false
      } else {
        const options = tile.validOptions?.length ? tile.validOptions : [...tile.validLetters, ...tile.validRebuses.map((r) => r.letters)]
        if (!options.includes(entry)) return false
        if (tile.linked) {
          if (!linked.has(tile.linked)) linked.set(tile.linked, [])
          linked.get(tile.linked)!.push({ options, entry })
        }
      }
    }
  }

  // Every cell of a linked rule has to come from the same option
  for (const cells of linked.values()) {
    const count = Math.max(...cells.map((c) => c.options.length))
    let solved = false
    for (let p = 0; p < count && !solved; p++) solved = cells.every((c) => c.options[p] === c.entry)
    if (!solved) return false
  }

  return true
}
