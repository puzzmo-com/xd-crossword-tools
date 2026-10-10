import { EditorError } from "../utils/EditorError"

/**
 * xd files do not need `## Headings`. Without them, sections are separated by two or more blank lines
 * and are read in a fixed order: metadata, grid, clues and then notes for anything following.
 */
export const hasImplicitSections = (xd: string) => !/^\s*## /m.test(xd)

/** Two or more blank lines, a blank line can contain whitespace */
const sectionSeparator = /\n(?:[ \t]*\r?\n){2,}/

const looksLikeClues = (section: string) =>
  section
    .trim()
    .split("\n")
    .every((line) => /^[AD]?\d+(\.| \^)/i.test(line.trim()) || line.trim() === "")

/** Converts an xd file which uses implicit sections into one with `## Headings` */
export const addHeadersToImplicitSections = (xd: string) => {
  const parts = xd
    .trim()
    .split(sectionSeparator)
    .filter((s) => s.trim() !== "")

  if (parts.length < 3)
    throw new EditorError(
      `Too few un-titled sections - expected metadata, grid and clues sections, got ${parts.length}. Sections are separated by two blank lines.`,
      0,
    )

  const [metadata, grid, ...rest] = parts

  // Some files separate the across and down clues with two blank lines too, keep those together
  const clues = [rest.shift()!]
  while (rest.length && looksLikeClues(rest[0])) clues.push(rest.shift()!)

  const notes = rest.map((n) => n.trim()).join("\n\n")
  const noteSection = notes.length ? `\n\n## Notes\n\n${notes}` : ""

  return `## Metadata

${metadata.trim()}

## Grid

${grid.trim()}

## Clues

${clues.map((c) => c.trim()).join("\n\n")}${noteSection}
`
}

/** @deprecated use hasImplicitSections */
export const shouldConvertToExplicitHeaders = hasImplicitSections
/** @deprecated use addHeadersToImplicitSections */
export const convertImplicitOrderedXDToExplicitHeaders = addHeadersToImplicitSections
