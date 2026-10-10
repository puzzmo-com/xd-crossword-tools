import { readFileSync } from "fs"
import { addHeadersToImplicitSections, hasImplicitSections } from "./implicitSections"

it("converts an xd with implicit sections to explicit headers", async () => {
  const xd = readFileSync("./packages/xd-crossword-tools-parser/src/parser/inputs/alpha-bits.xd", "utf8")
  const explicit = addHeadersToImplicitSections(xd)
  await expect(explicit).toMatchFileSnapshot("./outputs/implicit-alpha-bits-with-headers.xd")
})

it("correctly knows whether to do the transition", () => {
  const xd = readFileSync("./packages/xd-crossword-tools-parser/src/parser/inputs/alpha-bits.xd", "utf8")
  const explicitXD = readFileSync("./packages/xd-crossword-tools-parser/src/parser/outputs/explicit-alpha-bits.xd", "utf8")

  expect(hasImplicitSections(xd)).toBeTruthy()
  expect(hasImplicitSections(explicitXD)).toBeFalsy()
})

it("treats two or more blank lines as a section break, and one as part of a section", () => {
  const xd = `Title: Small
Author: Orta


AB
CD



A1. First ~ AB
A3. Second ~ CD

D1. Third ~ AC
D2. Fourth ~ BD


Some notes
over two lines`

  expect(addHeadersToImplicitSections(xd)).toMatchInlineSnapshot(`
    "## Metadata

    Title: Small
    Author: Orta

    ## Grid

    AB
    CD

    ## Clues

    A1. First ~ AB
    A3. Second ~ CD

    D1. Third ~ AC
    D2. Fourth ~ BD

    ## Notes

    Some notes
    over two lines
    "
  `)
})

it("keeps across and down together when they are separated by two blank lines", () => {
  const xd = `Title: Small


AB
CD


A1. First ~ AB
A3. Second ~ CD


D1. Third ~ AC
D2. Fourth ~ BD
D2 ^Hint: A hint`

  const result = addHeadersToImplicitSections(xd)
  expect(result).not.toContain("## Notes")
  expect(result).toContain("A3. Second ~ CD\n\nD1. Third ~ AC")
})
