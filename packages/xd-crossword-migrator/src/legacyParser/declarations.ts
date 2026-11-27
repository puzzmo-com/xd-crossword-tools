/**
 * The xd v4 spec uses one CSS-like `key: value; key: value` syntax in two places: the rule bodies
 * of the `## Design` section, and the attributes of xdown links/images (`{@text | href: url@}`).
 * This is the shared reader for both.
 *
 * - Whitespace around keys and values is trimmed, whitespace within a value is kept
 * - Declarations are separated by `;`, a trailing `;` is fine
 * - A key ends at the first `:`, so a value can contain unquoted colons (`href: https://...`)
 * - Quoted values (`'...'` or `"..."`) can contain `;`, `:`, `,` and `}` - a value which is
 *   entirely quoted has its quotes removed, `url('...')` keeps them
 */
export function parseDeclarations(body: string, opts: { rejectCommas?: boolean } = {}) {
  const declarations: [key: string, value: string][] = []
  const errors: string[] = []

  for (const decl of splitOutsideQuotes(body, ";")) {
    if (!decl.trim()) continue

    const colon = indexOutsideQuotes(decl, ":")
    if (colon === -1) {
      errors.push(`Expected a 'key: value' pair but got '${decl.trim()}'`)
      continue
    }

    const key = decl.slice(0, colon).trim().toLowerCase()
    const rawValue = decl.slice(colon + 1).trim()
    if (opts.rejectCommas && indexOutsideQuotes(rawValue, ",") !== -1) {
      errors.push(`Commas are not allowed inside style rules, use semicolons (;) to separate properties: '${decl.trim()}'`)
    }

    declarations.push([key, unquote(rawValue)])
  }

  return { declarations, errors }
}

/** Writes declarations back out, quoting any value which would not survive being re-read */
export function serializeDeclarations(declarations: [key: string, value: string][]) {
  return declarations.map(([key, value]) => `${key}: ${quoteIfNeeded(value)}`).join("; ")
}

/** Splits on a character which is not inside a quoted string */
export function splitOutsideQuotes(str: string, char: string) {
  const parts: string[] = []
  let start = 0
  let quote: string | undefined
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (quote) {
      if (c === quote) quote = undefined
    } else if (c === "'" || c === '"') {
      quote = c
    } else if (c === char) {
      parts.push(str.slice(start, i))
      start = i + 1
    }
  }
  parts.push(str.slice(start))
  return parts
}

/** indexOf, but ignoring anything inside a quoted string */
export function indexOutsideQuotes(str: string, char: string, from = 0) {
  let quote: string | undefined
  for (let i = from; i < str.length; i++) {
    const c = str[i]
    if (quote) {
      if (c === quote) quote = undefined
    } else if (c === "'" || c === '"') {
      quote = c
    } else if (c === char) {
      return i
    }
  }
  return -1
}

const unquote = (value: string) => {
  if (value.length >= 2 && (value[0] === "'" || value[0] === '"') && value[value.length - 1] === value[0]) {
    const inner = value.slice(1, -1)
    // Only strip when it really is a single quoted string, not `'a' 'b'`
    if (!inner.includes(value[0])) return inner
  }
  return value
}

const quoteIfNeeded = (value: string) => {
  const startsQuoted = value[0] === "'" || value[0] === '"'
  const hasDelimiter = indexOutsideQuotes(value, ";") !== -1 || indexOutsideQuotes(value, "}") !== -1
  const needsQuotes = startsQuoted || hasDelimiter || value !== value.trim()
  if (!needsQuotes) return value
  return value.includes("'") ? `"${value}"` : `'${value}'`
}
