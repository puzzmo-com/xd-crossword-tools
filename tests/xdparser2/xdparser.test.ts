import { xdParser } from "../../lib/xdparser2"

it("Smallest, legal but totally illogical example", () => {
  const xd = `
## Meta
## Notes
## Grid
## Clues
`

  xdParser(xd)
})

describe("meta", () => {
  it("grabs the details from the meta", () => {
    const xd = `
## Meta
Rebus: 1=M&F 2=L&T 3=M|F
Title: Alpha-Bits
Author: Drew Hodson
Copyright: © 2021
Description: N/A
Design: O={ background: circle }
SomethingWithColon: here's an example: of something

## Notes
## Grid
## Clues
`

    const { meta } = xdParser(xd)
    expect(meta).toMatchInlineSnapshot(`
{
  "author": "Drew Hodson",
  "copyright": "© 2021",
  "date": "Not set",
  "description": "N/A",
  "design": "O={ background: circle }",
  "editor": "Not set",
  "rebus": "1=M&F 2=L&T 3=M|F",
  "somethingwithcolon": "here's an example: of something",
  "title": "Alpha-Bits",
}
`)
  })
})

describe("clues", () => {
  it("Sets clues up", () => {
    const xd = `
Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16


BULB
OK#O
L##O
DESK


A1. Gardener's concern. ~ BULB
A4. A reasonable statement. ~ OK
A5. Not chipped. ~ CRISP

D1. To _ly go. ~ BOLD
D2. Bigger than britain. ~ UK
D3. A conscious tree. ~ BOOK
`

    const { clues } = xdParser(xd)
    expect(clues).toMatchInlineSnapshot(`
{
  "across": [
    {
      "answer": "BULB",
      "main": "Gardener's concern.",
      "number": 1,
      "position": {
        "col": 0,
        "index": 0,
      },
      "second": undefined,
    },
    {
      "answer": "OK",
      "main": "A reasonable statement.",
      "number": 4,
      "position": {
        "col": 0,
        "index": 1,
      },
      "second": undefined,
    },
    {
      "answer": "CRISP",
      "main": "Not chipped.",
      "number": 5,
      "position": {
        "col": 0,
        "index": 3,
      },
      "second": undefined,
    },
  ],
  "down": [
    {
      "answer": "BOLD",
      "main": "To _ly go.",
      "number": 1,
      "position": {
        "col": 0,
        "index": 0,
      },
      "second": undefined,
    },
    {
      "answer": "UK",
      "main": "Bigger than britain.",
      "number": 2,
      "position": {
        "col": 1,
        "index": 0,
      },
      "second": undefined,
    },
    {
      "answer": "BOOK",
      "main": "A conscious tree.",
      "number": 3,
      "position": {
        "col": 3,
        "index": 0,
      },
      "second": undefined,
    },
  ],
}
`)
  })

  it("handles double clues", () => {
    const xd = `
Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16


BULB
OK#O
L##O
DESK


A1. Gardener's concern. ~ BULB
A1. Turned on with a flick. ~ BULB
A4. A reasonable statement. ~ OK
A4. All __. ~ OK
A5. Not chipped. ~ CRISP
A5. Fried. ~ CRISP

D1. To _ly go. ~ BOLD
D1. When you want to make some text stronger. ~ BOLD
D2. Bigger than britain. ~ UK
D2. A union which left europe. ~ UK
D3. A conscious tree. ~ BOOK
D3. Registering with a restaurant. ~ BOOK
`

    const { clues } = xdParser(xd)
    const allClues = [...clues.across, ...clues.down]
    const focused = allClues.map((c) => ({ first: c.main, second: c.second }))
    expect(focused).toMatchInlineSnapshot(`
[
  {
    "first": "Gardener's concern.",
    "second": "BULB",
  },
  {
    "first": "A reasonable statement.",
    "second": "OK",
  },
  {
    "first": "Not chipped.",
    "second": "CRISP",
  },
  {
    "first": "To _ly go.",
    "second": "BOLD",
  },
  {
    "first": "Bigger than britain.",
    "second": "UK",
  },
  {
    "first": "A conscious tree.",
    "second": "BOOK",
  },
]
`)
  })
})

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
  "rawMessage": "This crossword has missing sections: 'Grid & Clues",
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

    expect(throwsWithError(xd)).toMatchInlineSnapshot(`undefined`)
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
  "line": 2,
  "name": "XDError",
  "rawMessage": "Two # headers are reserved for the system, they can only be: Grid, Clues, Notes, Meta, Design & Metapuzzle. Got 'Orta's extension'. You can use ### headers for inside notes.",
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

const throwsWithError = (xd: string) => {
  try {
    xdParser(xd)
  } catch (error) {
    return JSON.parse(JSON.stringify(error))
  }
  expect("This should have failed")
}
