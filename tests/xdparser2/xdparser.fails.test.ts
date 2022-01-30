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

  it("meta needs the colon", () => {
    const xd = `
  ## Meta
  `

    expect(throwsWithError(xd)).toMatchInlineSnapshot(`
{
  "line": 0,
  "name": "XDError",
  "rawMessage": "This crossword has missing sections: 'Grid, Clues & Meta",
}
`)
  })

  it("notes are a NOOP", () => {
    const xd = `
  ## Meta
  ## Notes
  Asdasdfasfdsgdsg
  df
  gfdgdfgdfg
  
  67568756yd
  fgdfgd
  f
  ## Grid
  ## Clues
    `

    expect(throwsWithError(xd)).toMatchInlineSnapshot(`
{
  "line": 0,
  "name": "XDError",
  "rawMessage": "This crossword has missing sections: 'Grid, Clues & Meta",
}
`)
  })

  it("notes are a NOOP", () => {
    const xd = `
  ## Meta
  ## Orta's extension
  ## Notes
  ## Grid
  ## Clues
      `

    expect(throwsWithError(xd)).toMatchInlineSnapshot(`
{
  "line": 0,
  "name": "XDError",
  "rawMessage": "This crossword has missing sections: 'Grid, Clues & Meta",
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
  "rawMessage": "This crossword has missing sections: 'Grid, Clues & Meta",
}
`)
  })
})

const throwsWithError = (xd: string) => {
  try {
    xdParser(xd)
  } catch (error) {
    return JSON.parse(JSON.stringify(error))
  }
  expect("This should have failed")
}
