import { xdParser } from "../../lib/xdparser2"

describe("errors", () => {
  it("blanks give errors", () => {
    expect(throwsWithError("")).toMatchInlineSnapshot(`
  {
    "line": 0,
    "name": "XDError",
    "rawMessage": "Not got anything to work with yet",
  }
  `)
  })

  it("headers with indentation get a specific error", () => {
    const xd = `
  ## Meta
asda asdasda
  `

    expect(throwsWithError(xd)).toMatchInlineSnapshot(`
{
  "line": 0,
  "name": "XDError",
  "rawMessage": "Too few un-titled sections - expected 4 or more sections, got 1. Sections are separated by two lines.",
}
`)
  })

  it("meta needs the colon", () => {
    const xd = `
## Meta
asda asdasda
  `

    expect(throwsWithError(xd)).toMatchInlineSnapshot(`
{
  "line": 0,
  "name": "XDError",
  "rawMessage": "Too few un-titled sections - expected 4 or more sections, got 1. Sections are separated by two lines.",
}
`)
  })

  it("Throws when you have an unknown subheading", () => {
    const xd = `
## Meta
## Orta's extension
## Notes
## Grid
## Clues
  `

    expect(throwsWithError(xd, true)).toMatchInlineSnapshot(`
{
  "line": 0,
  "name": "XDError",
  "rawMessage": "Too few un-titled sections - expected 4 or more sections, got 1. Sections are separated by two lines.",
}
`)
  })

  it("handles bad meta", () => {
    const xd = `
## Meta

this line needs a colon`

    expect(throwsWithError(xd)).toMatchInlineSnapshot(`
{
  "line": 0,
  "name": "XDError",
  "rawMessage": "Too few un-titled sections - expected 4 or more sections, got 2. Sections are separated by two lines.",
}
`)
  })
})

it("checks that the grid is set up", () => {
  const xd = `
## Meta
## Grid
## Clues
`

  expect(throwsWithError(xd)).toMatchInlineSnapshot(`
{
  "line": 0,
  "name": "XDError",
  "rawMessage": "Too few un-titled sections - expected 4 or more sections, got 1. Sections are separated by two lines.",
}
`)
})

it("checks that all the sections are there", () => {
  const xd = `
## Meta
## Grid
`

  expect(throwsWithError(xd)).toMatchInlineSnapshot(`
{
  "line": 0,
  "name": "XDError",
  "rawMessage": "Too few un-titled sections - expected 4 or more sections, got 1. Sections are separated by two lines.",
}
`)
})

it("checks that all the sections are there", () => {
  const xd = `
## Meta
## Grid
## Clues

a2. asda
`

  expect(throwsWithError(xd)).toMatchInlineSnapshot(`
{
  "line": 0,
  "name": "XDError",
  "rawMessage": "Too few un-titled sections - expected 4 or more sections, got 2. Sections are separated by two lines.",
}
`)
})

const throwsWithError = (xd: string, strict = true) => {
  try {
    xdParser(xd, strict)
  } catch (error) {
    return JSON.parse(JSON.stringify(error))
  }
  expect("This should have failed")
}
