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
  /** Pre-v4 syntax which still reads, `migrateXDToV4` can update it */
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
 * Pre-v4 fields still read, with deprecations: repeated keys (`1=O 1=A`) become one rule's
 * options, and rules joined with ',' (`1=OIL,2=WATER`) are split up.
 */
export function parseRebusField(field: string): RebusFieldParse {
  const result: RebusFieldParse = { rules: [], errors: [], deprecations: [], unreadable: [] }
  if (!field.trim()) return result

  // The rule each key was declared in (and how it was written), to find keys which are declared twice
  const ruleForKey = new Map<string, { rule: RebusRule; text: string }>()
  const repeated = new Map<string, string[]>()

  for (const text of splitIntoRuleTexts(field, result)) {
    const parsed = parseRebusRule(text)
    let rule: RebusRule
    if ("error" in parsed) {
      result.errors.push(parsed.error)
      // A pre-v4 value was a literal string, so read it as one when it can't be read as v4
      if (parsed.literal === undefined) {
        result.unreadable.push(text)
        continue
      }
      rule = { keys: [parsed.key!], options: [[parsed.literal]] }
    } else {
      rule = parsed.rule
    }

    const [key] = rule.keys
    const existing = rule.keys.length === 1 ? ruleForKey.get(key) : undefined

    // Pre-v4 Schrödinger cells repeated the key once per value: '1=O 1=A'
    if (existing && existing.rule.keys.length === 1) {
      const options = existing.rule.options
      for (const option of rule.options) if (!options.some((o) => o[0] === option[0])) options.push(option)
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
    const { rule } = ruleForKey.get(key)!
    result.deprecations.push(
      `'${texts.join(" ")}' repeats the rebus key '${key}', xd v4 gives a cell's options with '|': '${serializeRebusRule(rule)}'`,
    )
  }

  return result
}

/** Splits the field on whitespace, and splits up pre-v4 rules which were joined with ',' */
function splitIntoRuleTexts(field: string, result: RebusFieldParse) {
  const texts: string[] = []
  for (const token of field.trim().split(/[ \t]+/)) {
    const pieces = splitUnescaped(token, ",")
    // Only when every piece is a rule of its own, '1=A,B' is a value with a (reserved) comma in it
    const joinedRules = pieces.length > 1 && pieces.every((p) => /^[^=]+=./u.test(p))
    if (!joinedRules) {
      texts.push(token)
      continue
    }
    result.deprecations.push(`Rebus rules are separated by spaces in xd v4, ',' is reserved: use '${pieces.join(" ")}' instead of '${token}'`)
    texts.push(...pieces)
  }
  return texts
}

type RuleParse =
  | { rule: RebusRule }
  | {
      error: string
      /** For a single key rule, the key */
      key?: string
      /** For a single key rule, its value as a pre-v4 literal string */
      literal?: string
    }

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
  const fail = (error: string): RuleParse => (single ? { error, key: keys[0], literal: value || undefined } : { error })

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
