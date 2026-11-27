import { indexOutsideQuotes, parseDeclarations, serializeDeclarations } from "./declarations"

export type DesignStyles = Record<string, Record<string, string>>

/**
 * Parses the style definitions at the top of a `## Design` section, e.g.
 *
 *     O { background: circle }
 *     A, B {
 *       background-image: url('data:image/png;base64,iVBORw0KGgo=');
 *       background-size: 2 2
 *     }
 *
 * Selectors are single, case-sensitive, characters. A selector can be re-opened, which merges in
 * the new properties. Lots of tests in xdparser.design.test.ts
 */
export function parseDesignRules(text: string): { styles: DesignStyles; errors: string[] } {
  const styles: DesignStyles = {}
  const errors: string[] = []

  let i = 0
  while (i < text.length) {
    const open = text.indexOf("{", i)
    if (open === -1) {
      const leftover = text.slice(i).trim()
      if (leftover) errors.push(`Expected a style rule like 'O { background: circle }' but got '${leftover}'`)
      break
    }

    const close = indexOutsideQuotes(text, "}", open + 1)
    if (close === -1) {
      errors.push(`A style rule above likely does not have a closing '}'`)
      break
    }

    const selectors = text
      .slice(i, open)
      .split(",")
      .map((s) => s.trim())
    const body = parseDeclarations(text.slice(open + 1, close), { rejectCommas: true })
    errors.push(...body.errors)

    for (const selector of selectors) {
      if (!selector) {
        errors.push(`A style rule is missing its selector character`)
        continue
      }
      if ([...selector].length > 1) {
        errors.push(`Cannot have a style rule which is longer than one character: got '${selector}' - it needs to fit in a grid cell`)
      }
      styles[selector] = { ...styles[selector], ...Object.fromEntries(body.declarations) }
    }

    i = close + 1
  }

  return { styles, errors }
}

/**
 * Writes design styles back out as xd v4 rules in a canonical, compact form: properties which are
 * shared by exactly the same selectors are grouped into one rule.
 *
 *     A { background: circle; bar-top: true }        A, B, C { background: circle }
 *     B { background: circle }                  →    A, C { bar-top: true }
 *     C { background: circle; bar-top: true }
 *
 * Selectors keep their characters and order. Each selector has one value per property, so splitting
 * a selector across rules can't change what it means.
 */
export function serializeDesignRules(styles: DesignStyles) {
  const selectors = Object.keys(styles)

  // Which selectors have each 'property: value', in the order they first appear
  const owners = new Map<string, { declaration: [string, string]; selectors: string[] }>()
  for (const selector of selectors) {
    for (const [key, value] of Object.entries(styles[selector])) {
      const id = `${key}\u0000${value}`
      if (!owners.has(id)) owners.set(id, { declaration: [key, value], selectors: [] })
      owners.get(id)!.selectors.push(selector)
    }
  }

  // Declarations with the same set of selectors share a rule
  const rules = new Map<string, { selectors: string[]; declarations: [string, string][] }>()
  for (const { declaration, selectors: owned } of owners.values()) {
    const id = owned.join("\u0000")
    if (!rules.has(id)) rules.set(id, { selectors: owned, declarations: [] })
    rules.get(id)!.declarations.push(declaration)
  }

  // A style with no properties still needs to be declared
  const empty = selectors.filter((selector) => Object.keys(styles[selector]).length === 0)

  return [
    ...[...rules.values()].map((rule) => `${rule.selectors.join(", ")} { ${serializeDeclarations(rule.declarations)} }`),
    ...empty.map((selector) => `${selector} {}`),
  ].join("\n")
}

/** Whether any cell in the design has a bar, which makes this a barred grid */
export const designHasBars = (design: { styles: DesignStyles; positions: string[][] } | undefined) => {
  if (!design) return false
  const barred = new Set(
    Object.entries(design.styles)
      .filter(([_, rule]) => rule["bar-top"] === "true" || rule["bar-left"] === "true")
      .map(([selector]) => selector),
  )
  return barred.size > 0 && design.positions.some((row) => row?.some((char) => barred.has(char)))
}
