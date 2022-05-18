import { readdirSync, readFileSync } from "fs"
import { xdParser } from "../../lib/xdparser2"

it("Smallest, legal but totally illogical example", () => {
  const xd = `
## Metadata
## Notes
## Grid
## Clues
`

  xdParser(xd, false)
})

describe("meta", () => {
  it("grabs the details from the meta", () => {
    const xd = `
## Metadata
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

    const { meta } = xdParser(xd, false)
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

describe("meta", () => {
  it("grabs the details from the meta", () => {
    const xd = `
## Metadata
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

    const { meta } = xdParser(xd, false)
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

describe("metapuzzle", () => {
  it("can handle the metapuzzle", () => {
    const xd = `
## Metadata
## Notes
## Grid
## Clues
## Metapuzzle

Hello world, multiline
sure thing. This is legal in markdown,

> The answer
  `

    const { metapuzzle } = xdParser(xd, false)
    expect(metapuzzle).toMatchInlineSnapshot(`
{
  "answer": "Hello world, multiline
sure thing. This is legal in markdown,",
  "clue": "The answer",
}
`)
  })
})

describe("start", () => {
  it("can handle the start", () => {
    const xd = `
## Metadata
## Notes
## Grid
## Clues
## Start

GO..##FOR#IT...
 ....#...#.....
WIN..#...#.....
####....#...###
H...#.....#....
I......#...#...
......#........
##...#...#...##
........#......
...#...#.......
....#.....#....
###...#....####
.....#...#.....
.....#...#.....
.....#...##....

  `

    const { start } = xdParser(xd, false)
    expect(start).toMatchInlineSnapshot(`
[
  [
    "G",
    "O",
    ,
    ,
    ,
    ,
    "F",
    "O",
    "R",
    ,
    "I",
    "T",
  ],
  [],
  [
    "W",
    "I",
    "N",
  ],
  [],
  [
    "H",
  ],
  [
    "I",
  ],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
]
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
A5. The office centerpiece. ~ DESK

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
      "splits": [],
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
      "splits": [],
    },
    {
      "answer": "DESK",
      "main": "The office centerpiece.",
      "number": 5,
      "position": {
        "col": 0,
        "index": 3,
      },
      "second": undefined,
      "splits": [],
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
      "splits": [],
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
      "splits": [],
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
      "splits": [],
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
A5. The office centerpiece. ~ DESK
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
    "second": "Turned on with a flick.",
  },
  {
    "first": "A reasonable statement.",
    "second": "All __.",
  },
  {
    "first": "The office centerpiece.",
    "second": "Fried.",
  },
  {
    "first": "To _ly go.",
    "second": "When you want to make some text stronger.",
  },
  {
    "first": "Bigger than britain.",
    "second": "A union which left europe.",
  },
  {
    "first": "A conscious tree.",
    "second": "Registering with a restaurant.",
  },
]
`)
  })

  it("parses splitCharacter correctly", () => {
    const xd = `
Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16
SplitCharacter: |


OKGO
H##B
O##J
H##E
O##C
H##T


A1. Band with two words. ~ OK|GO

D1. Reverse santa. ~ OH|OH|OH
D2. A thing. ~ OBJECT
`

    const { clues } = xdParser(xd)
    expect(clues).toMatchInlineSnapshot(`
{
  "across": [
    {
      "answer": "OKGO",
      "main": "Band with two words.",
      "number": 1,
      "position": {
        "col": 0,
        "index": 0,
      },
      "second": undefined,
      "splits": [
        1,
      ],
    },
  ],
  "down": [
    {
      "answer": "OHOHOH",
      "main": "Reverse santa.",
      "number": 1,
      "position": {
        "col": 0,
        "index": 0,
      },
      "second": undefined,
      "splits": [
        1,
        4,
      ],
    },
    {
      "answer": "OBJECT",
      "main": "A thing.",
      "number": 2,
      "position": {
        "col": 3,
        "index": 0,
      },
      "second": undefined,
      "splits": [],
    },
  ],
}
`)
  })
})

describe("comments", () => {
  it("ignores comments", () => {
    const original = `Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16


BULB
OK#O
L##O
DESK


A1. Gardener's concern. ~ BULB
A4. A reasonable statement. ~ OK
A5. The office centerpiece. ~ DESK

D1. To _ly go. ~ BOLD
D2. Bigger than britain. ~ UK
D3. A conscious tree. ~ BOOK`

    const comments = `Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16


<!-- A comment -->
BULB
OK#O
L##O
DESK


A1. Gardener's concern. ~ BULB
A4. A reasonable statement. ~ OK
A5. The office centerpiece. ~ DESK

<!-- A multiline comment
A1. Gardener's concern. ~ BULB
A4. A reasonable statement. ~ OK
A5. The office centerpiece. ~ DESK
-->
D1. To _ly go. ~ BOLD
D2. Bigger than britain. ~ UK
D3. A conscious tree. ~ BOOK
`

    expect(xdParser(original)).toEqual(xdParser(comments))
  })
})

it("notes are a NOOP", () => {
  const xd = `
## Metadata
## Notes
Asdasdfasfdsgdsg
df
gfdgdfgdfg

67568756yd
fgdfgd
f
## Grid
## Clues`

  expect(xdParser(xd, false).notes).toContain("67568756yd")
})

// it("notes are a NOOP", () => {
//   const xd = readFileSync("./tests/xdparser2/inputs/example.xd", "utf8")
//   const json = xdParser(xd, false)

//   const length = json.tiles[0].length
//   for (const tiles of json.tiles) {
//     expect(tiles.length).toEqual(length)
//   }
// })
