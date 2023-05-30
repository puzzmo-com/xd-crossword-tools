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
      "body": "Gardener's concern.",
      "metadata": undefined,
      "number": 1,
      "position": {
        "col": 0,
        "index": 0,
      },
    },
    {
      "answer": "OK",
      "body": "A reasonable statement.",
      "metadata": undefined,
      "number": 4,
      "position": {
        "col": 0,
        "index": 1,
      },
    },
    {
      "answer": "DESK",
      "body": "The office centerpiece.",
      "metadata": undefined,
      "number": 5,
      "position": {
        "col": 0,
        "index": 3,
      },
    },
  ],
  "down": [
    {
      "answer": "BOLD",
      "body": "To _ly go.",
      "metadata": undefined,
      "number": 1,
      "position": {
        "col": 0,
        "index": 0,
      },
    },
    {
      "answer": "UK",
      "body": "Bigger than britain.",
      "metadata": undefined,
      "number": 2,
      "position": {
        "col": 1,
        "index": 0,
      },
    },
    {
      "answer": "BOOK",
      "body": "A conscious tree.",
      "metadata": undefined,
      "number": 3,
      "position": {
        "col": 3,
        "index": 0,
      },
    },
  ],
}
`)
  })

  it("handles whitespace lines in the clues ", () => {
    const xd = `## Meta

Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16


## Grid

BULB
OK#O
L##O
DESK


## Clues

A1. Gardener's concern. ~ BULB
A1 ^Hint: Turned on with a flick.

A4. A reasonable statement. ~ OK
A4 ^Hint: All __.

A5. The office centerpiece. ~ DESK
A5 ^Hint: Fried.

D1. To _ly go. ~ BOLD
D1 ^Hint: When you want to make some text stronger.

D2. Bigger than britain. ~ UK
D2 ^Hint: A union which left europe.

D3. A conscious tree. ~ BOOK
D3 ^Hint: Registering with a restaurant. 
`

    const { clues } = xdParser(xd)
    const allClues = [...clues.across, ...clues.down]

    expect(allClues.map((c) => ({ clue: c.body, hint: c.metadata?.hint }))).toMatchInlineSnapshot(`
[
  {
    "clue": "Gardener's concern.",
    "hint": "Turned on with a flick.",
  },
  {
    "clue": "A reasonable statement.",
    "hint": "All __.",
  },
  {
    "clue": "The office centerpiece.",
    "hint": "Fried.",
  },
  {
    "clue": "To _ly go.",
    "hint": "When you want to make some text stronger.",
  },
  {
    "clue": "Bigger than britain.",
    "hint": "A union which left europe.",
  },
  {
    "clue": "A conscious tree.",
    "hint": "Registering with a restaurant.",
  },
]
`)
  })

  it("handles automatically converting double clues to hint syntax when not in strict mode", () => {
    const old = `
Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16


BULB
OK#O
L##O
DESK


A1. Gardener's concern. ~ BULB
A1. Turned on with a flick. ~ ANSWER
A4. A reasonable statement. ~ OK
A4. All __. ~ OK
A5. The office centerpiece. ~ DESK
A5. Fried. ~ DESO

D1. To _ly go. ~ BOLD
D1. When you want to make some text stronger. ~ BOLD
D2. Bigger than britain. ~ UK
D2. A union which left europe. ~ UK
D3. A conscious tree. ~ BOOK
D3. Registering with a restaurant.  ~ BOOK
    `

    const { clues } = xdParser(old, false)
    const allClues = [...clues.across, ...clues.down]
    allClues.forEach((f) => {
      expect(f.metadata?.hint).toBeTruthy()
    })

    expect(allClues.map((c) => c.metadata?.hint)).toMatchInlineSnapshot(`
[
  "Turned on with a flick.",
  "All __.",
  "Fried.",
  "When you want to make some text stronger.",
  "A union which left europe.",
  "Registering with a restaurant. ",
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
      "body": "Band with two words.",
      "metadata": undefined,
      "number": 1,
      "position": {
        "col": 0,
        "index": 0,
      },
      "splits": [
        1,
      ],
    },
  ],
  "down": [
    {
      "answer": "OHOHOH",
      "body": "Reverse santa.",
      "metadata": undefined,
      "number": 1,
      "position": {
        "col": 0,
        "index": 0,
      },
      "splits": [
        1,
        3,
      ],
    },
    {
      "answer": "OBJECT",
      "body": "A thing.",
      "metadata": undefined,
      "number": 2,
      "position": {
        "col": 3,
        "index": 0,
      },
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
