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
  "line": 1,
  "name": "XDError",
  "rawMessage": "This header has spaces before it, this is likely an accidental indentation",
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
  "line": 2,
  "name": "XDError",
  "rawMessage": "Could not find a ':' separating the meta item's name from its value",
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
  "line": 2,
  "name": "XDError",
  "rawMessage": "Two # headers are reserved for the system, they can only be: Grid, Clues, Notes, Meta, Design, Metapuzzle & Start. Got 'Orta's extension'. You can use ### headers for inside notes.",
}
`)
  })

  it("handles bad meta", () => {
    const xd = `
## Meta

this line needs a colon`

    expect(throwsWithError(xd)).toMatchInlineSnapshot(`
{
  "line": 3,
  "name": "XDError",
  "rawMessage": "Could not find a ':' separating the meta item's name from its value",
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
  "line": 3,
  "name": "XDError",
  "rawMessage": "This grid section does not have a working grid",
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
  "rawMessage": "This crossword has missing sections: 'Clues' - saw Meta & Grid",
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
  "line": 5,
  "name": "XDError",
  "rawMessage": "This clue does not match the format of 'A[num]. [clue] ~ [answer]'",
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
