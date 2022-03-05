import { EditorError } from "./EditorError"

export const shouldConvertToExplicitHeaders = (xd: string) => !xd.toLowerCase().includes("## ")

export const convertImplicitOrderedXDToExplicitHeaders = (xd: string) => {
  const parts = xd.split(/^$^$/gm).filter((s) => s !== "\n")

  if (parts.length < 4)
    throw new EditorError(
      `Too few un-titled sections - expected 4 or more sections, got ${parts.length}. Sections are separated by two lines.`,
      0
    )

  let notes = ""
  for (let index = 4; index < parts.length - 3; index++) {
    notes += parts[index]
  }

  let noteSection = ""
  if (notes.length)
    noteSection = `
    
## Notes
    
${notes.trim()}`

  return `## Metadata

${parts[0].trim()}

## Grid

${parts[1].trim()}

## Clues

${parts[2].trim()}

${parts[3].trim()}${noteSection}
`
}
