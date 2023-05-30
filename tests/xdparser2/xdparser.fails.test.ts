import { xdParser } from "../../lib/xdparser2"

describe("errors", () => {
  it("blanks give errors", () => {
    expect(throwsWithError("")).toMatchInlineSnapshot(`
[
  {
    "length": 1,
    "message": "xd is an empty file",
    "position": {
      "col": 0,
      "index": 0,
    },
    "type": "syntax",
  },
]
`)
  })

  it("headers with indentation get a specific error", () => {
    const xd = `
  ## Meta
asda asdasda
  `

    expect(throwsWithError(xd)).toMatchInlineSnapshot(`
[
  {
    "length": 1,
    "message": "This header has spaces before it, this is likely an accidental indentation",
    "position": {
      "col": 0,
      "index": 1,
    },
    "type": "syntax",
  },
  {
    "length": 1,
    "message": "This crossword has missing sections: 'Grid, Clues & Metadata' - saw no section",
    "position": {
      "col": 0,
      "index": 4,
    },
    "type": "syntax",
  },
]
`)
  })

  it("meta needs the colon", () => {
    const xd = `
## Meta
asda asdasda
  `

    expect(throwsWithError(xd)).toMatchInlineSnapshot(`
[
  {
    "length": 1,
    "message": "Could not find a ':' separating the meta item's name from its value",
    "position": {
      "col": 0,
      "index": 2,
    },
    "type": "syntax",
  },
  {
    "length": 1,
    "message": "This crossword has missing sections: 'Grid & Clues' - saw Metadata",
    "position": {
      "col": 0,
      "index": 4,
    },
    "type": "syntax",
  },
]
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
[
  {
    "length": 1,
    "message": "Two # headers are reserved for the system, they can only be: Grid, Clues, Notes, Metadata, Metapuzzle, Start, Design & Design-style. Got 'Orta's extension'. You can use ### headers for inside notes.",
    "position": {
      "col": 0,
      "index": 2,
    },
    "type": "syntax",
  },
  {
    "length": 1,
    "message": "This crossword does not have a working grid",
    "position": {
      "col": 0,
      "index": 4,
    },
    "type": "syntax",
  },
]
`)
  })

  it("handles bad meta", () => {
    const xd = `
## Meta

this line needs a colon`

    expect(throwsWithError(xd)).toMatchInlineSnapshot(`
[
  {
    "length": 1,
    "message": "Could not find a ':' separating the meta item's name from its value",
    "position": {
      "col": 0,
      "index": 3,
    },
    "type": "syntax",
  },
  {
    "length": 1,
    "message": "This crossword has missing sections: 'Grid & Clues' - saw Metadata",
    "position": {
      "col": 0,
      "index": 4,
    },
    "type": "syntax",
  },
]
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
[
  {
    "length": 1,
    "message": "This crossword does not have a working grid",
    "position": {
      "col": 0,
      "index": 2,
    },
    "type": "syntax",
  },
]
`)
})

it("checks that all the sections are there", () => {
  const xd = `
## Meta
## Grid
`

  expect(throwsWithError(xd)).toMatchInlineSnapshot(`
[
  {
    "length": 1,
    "message": "This crossword has missing sections: 'Clues' - saw Metadata & Grid",
    "position": {
      "col": 0,
      "index": 4,
    },
    "type": "syntax",
  },
  {
    "length": 1,
    "message": "This crossword does not have a working grid",
    "position": {
      "col": 0,
      "index": 2,
    },
    "type": "syntax",
  },
]
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
[
  {
    "clueNum": 5,
    "clueType": "A",
    "length": 1,
    "message": "The clue 'a2. asda' does not match either the format of 'A[num]. [clue] ~ [answer]' for a clue, or 'A[num] ^[hint]: [clue]' for a clue's metadata.",
    "position": {
      "col": 0,
      "index": 5,
    },
    "type": "clue_msg",
  },
  {
    "length": 1,
    "message": "This crossword does not have a working grid",
    "position": {
      "col": 0,
      "index": 2,
    },
    "type": "syntax",
  },
]
`)
})

const throwsWithError = (xd: string, strict = true) => {
  // try {
  return xdParser(xd, strict).report.errors
  // } catch (error) {
  //   return JSON.parse(JSON.stringify(error))
  // }
  // expect("This should have failed")
}
