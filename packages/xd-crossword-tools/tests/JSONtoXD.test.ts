import { addSplits, JSONToXD, resolveFullClueAnswer } from "../src/JSONtoXD"
import { xdToJSON } from "xd-crossword-tools-parser"
import type { Clue, SchrodingerTile } from "xd-crossword-tools-parser"

/*
 * Utilities
 ******************************************************************************/
describe("resolveFullClueAnswer", () => {
  it("Returns the answer for basic clue", () => {
    const clue = {
      body: "to",
      answer: "AT",
      number: 1,
      position: { col: 0, index: 0 },
      tiles: [
        { type: "letter", letter: "A" },
        { type: "letter", letter: "T" },
      ],
      metadata: undefined,
    } as Clue
    expect(resolveFullClueAnswer(clue, "")).toEqual(clue.answer)
  })

  it("Returns answer for rebus clue", () => {
    const clue = {
      body: "to",
      answer: "CAT",
      number: 1,
      position: { col: 0, index: 0 },
      tiles: [
        { type: "letter", letter: "C" },
        { type: "rebus", symbol: "❶", word: "AT" },
      ],
      metadata: undefined,
    } as Clue
    expect(resolveFullClueAnswer(clue, "")).toEqual(clue.answer)
  })

  it("Returns answer for clue with pipes", () => {
    const clue = {
      body: "Band with two words.",
      answer: "OKGO",
      number: 1,
      position: { col: 0, index: 0 },
      tiles: [
        { type: "letter", letter: "O" },
        { type: "letter", letter: "K" },
        { type: "letter", letter: "G" },
        { type: "letter", letter: "O" },
      ],
      metadata: undefined,
      splits: [1],
    } as Clue
    expect(resolveFullClueAnswer(clue, "|")).toEqual("OK|GO")
  })

  it("Returns answer for rebus clue with pipes", () => {
    const clue = {
      body: "Example",
      answer: "TWITCHDOTTV",
      number: 1,
      position: { col: 0, index: 0 },
      tiles: [
        { type: "letter", letter: "T" },
        { type: "letter", letter: "W" },
        { type: "letter", letter: "I" },
        { type: "letter", letter: "T" },
        { type: "letter", letter: "C" },
        { type: "letter", letter: "H" },
        { type: "rebus", symbol: "❶", word: "DOT" },
        { type: "letter", letter: "T" },
        { type: "letter", letter: "V" },
      ],
      metadata: undefined,
      splits: [5, 6, 7],
    } as Clue
    expect(resolveFullClueAnswer(clue, "|")).toEqual("TWITCH|DOT|T|V")
  })

  it("Demonstrates correct pipe position handling with rebus squares", () => {
    // This test demonstrates the correct handling of pipes within rebus squares
    const clue = {
      body: "Not too much!",
      answer: "JUSTASKOSH",
      number: 14,
      position: { col: 0, index: 0 },
      tiles: [
        { type: "letter", letter: "J" },
        { type: "letter", letter: "U" },
        { type: "letter", letter: "S" },
        { type: "rebus", symbol: "❶", word: "TASK" },
        { type: "letter", letter: "O" },
        { type: "letter", letter: "S" },
        { type: "letter", letter: "H" },
      ],
      metadata: undefined,
      display: [["text", "Not too much!"]],
      direction: "across" as const,
      // Internal splits within the rebus at tile position 3
      rebusInternalSplits: { 3: [0, 1] }, // T|A|SK
    } as Clue

    // Should produce JUST|A|SKOSH (perfect internal rebus splits)
    expect(resolveFullClueAnswer(clue, "|")).toEqual("JUST|A|SKOSH")
  })

  it("Returns answer for clue with Schrödinger square", () => {
    const schrodingerTile: SchrodingerTile = { type: "schrodinger", validLetters: ["O", "A"], validRebuses: [] }
    const clue = {
      body: "Sugar ____",
      answer: "CONE",
      number: 6,
      position: { col: 0, index: 8 },
      tiles: [{ type: "letter", letter: "C" }, schrodingerTile, { type: "letter", letter: "N" }, { type: "letter", letter: "E" }],
      direction: "across" as const,
      display: [["text", "Sugar ____"]],
      metadata: { alt: "CANE" },
    } as Clue
    expect(resolveFullClueAnswer(clue, "")).toEqual("CONE")
  })
})

describe("addSplits", () => {
  it("Returns answer without splits", () => {
    expect(addSplits("SEDIMENT", "|")).toEqual("SEDIMENT")
  })
  it("Returns answer with a split", () => {
    expect(addSplits("OKGO", "|", [1])).toEqual("OK|GO")
  })
  it("Returns answer with multiple splits", () => {
    expect(addSplits("HOHOHO", "|", [1, 3])).toEqual("HO|HO|HO")
  })
})

/*
 * Main
 ******************************************************************************/
describe("JSONtoXD", () => {
  const xd = `
## Metadata\n\n
Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16
SplitCharacter: |

## Grid\n\n
OKGO
H##B
O##J
H##E
O##C
H##T

## Clues\n\n
A1. Band with two words. ~ OK|GO

D1. Reverse santa. ~ OH|OH|OH
D2. A thing. ~ OBJECT
`

  it("parses splitCharacter correctly", () => {
    const json = xdToJSON(xd)
    const newXD = JSONToXD(json)
    expect(newXD).toMatchInlineSnapshot(`
"## Metadata

title: Square
author: Orta
date: 2021-03-16
editor: Orta Therox
splitcharacter: |

## Grid

OKGO
H..B
O..J
H..E
O..C
H..T

## Clues

A1. Band with two words. ~ OK|GO

D1. Reverse santa. ~ OH|OH|OH
D2. A thing. ~ OBJECT"
`)
  })

  it("handles clue meta lines well", () => {
    const xd = `
## Meta

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
D3 ^Hint: Registering with a restaurant. `

    const json = xdToJSON(xd)
    const newXD = JSONToXD(json)
    expect(newXD).toMatchInlineSnapshot(`
"## Metadata

title: Square
author: Orta
date: 2021-03-16
editor: Orta Therox

## Grid

BULB
OK.O
L..O
DESK

## Clues

A1. Gardener's concern. ~ BULB
A1 ^hint: Turned on with a flick.

A4. A reasonable statement. ~ OK
A4 ^hint: All __.

A5. The office centerpiece. ~ DESK
A5 ^hint: Fried.


D1. To _ly go. ~ BOLD
D1 ^hint: When you want to make some text stronger.

D2. Bigger than britain. ~ UK
D2 ^hint: A union which left europe.

D3. A conscious tree. ~ BOOK
D3 ^hint: Registering with a restaurant.
"
`)
  })

  it("handles design section with more than one element", () => {
    const json = xdToJSON(xd)
    json.design = {
      styles: {
        A: {
          background: "circle",
        },
        B: {
          background: "dot",
        },
      },
      positions: [],
    }
    const newXD = JSONToXD(json)
    expect(newXD.split("## Design")[1].trim()).toMatchInlineSnapshot(`
"<style>
A { background: circle }
B { background: dot }
</style>"
`)
  })

  it("recreates clues for puzzle with rebus", () => {
    const puzzle = `## Metadata

title: Rebus Example
author: Penelope Rudow
date: 2024-01-01
editor: Steve The Cat
rebus: ❶=AT

## Grid

AT
R❶

## Clues

A1. to ~ AT
A3. rodent ~ RAT

D1. the letter r ~ AR
D2. skin ink ~ TAT`

    const json = xdToJSON(puzzle)
    const newXD = JSONToXD(json)
    expect(newXD).toEqual(puzzle)
  })

  it("recreates clues for puzzle with multiple rebuses", () => {
    const puzzle = `## Metadata

title: Rebus Example
author: Penelope Rudow
date: 2024-01-01
editor: Steve The Cat
rebus: ❶=AT ❷=AP

## Grid

AT.CO
R❶.❷E

## Clues

A1. to ~ AT
A3. company ~ CO
A5. rodent ~ RAT
A6. human ~ APE

D1. the letter r ~ AR
D2. skin ink ~ TAT
D3. hat ~ CAP
D4. two vowels ~ OE`

    const json = xdToJSON(puzzle)
    const newXD = JSONToXD(json)
    expect(newXD).toEqual(puzzle)
  })

  it("handles Schrödinger squares correctly", () => {
    const puzzle = `## Metadata

title: Test Schrödinger
author: Test Author
date: 2025-01-01
editor: Test

## Grid

TILE
APEX
C*NE
ODDS

## Clues

A1. Mosaic piece ~ TILE
A5. Pinnacle ~ APEX
A6. Sugar ____ ~ CONE
A6 ^alt: CANE

A7. Chances, in gambling ~ ODDS

D1. Tuesday treat ~ TACO
D2. Apple tech ~ IPOD
D2 ^alt: IPAD

D3. Complement to borrow ~ LEND
D4. Former intimates ~ EXES`

    const json = xdToJSON(puzzle)
    const newXD = JSONToXD(json)

    // Check that the grid contains the * character
    expect(newXD).toContain("C*NE")

    // Check that alt metadata is preserved
    expect(newXD).toContain("A6 ^alt: CANE")
    expect(newXD).toContain("D2 ^alt: IPAD")

    // The output should be equivalent to the input
    expect(newXD).toEqual(puzzle)
  })

  it("Perfect round-trip with pipes within rebus squares", () => {
    // This demonstrates perfect round-trip conversion with internal rebus splits
    const puzzle = `## Metadata

title: Pipe Bug Test
author: Test
date: 2025-01-01
editor: Penelope Rudow
rebus: ❶=TASK
splitcharacter: |

## Grid

JUS❶OSH

## Clues

A1. Not too much! ~ JUST|A|SKOSH\n\n`

    const json = xdToJSON(puzzle)
    const newXD = JSONToXD(json)

    // Perfect round-trip: internal rebus splits are preserved
    expect(newXD).toEqual(puzzle)
  })

  it("Handles mixed regular and internal rebus splits", () => {
    // Test case with both regular splits and internal rebus splits
    const clue = {
      body: "Mixed example",
      answer: "TWITCHDOTTV",
      number: 1,
      position: { col: 0, index: 0 },
      tiles: [
        { type: "letter", letter: "T" },
        { type: "letter", letter: "W" },
        { type: "letter", letter: "I" },
        { type: "letter", letter: "T" },
        { type: "letter", letter: "C" },
        { type: "letter", letter: "H" },
        { type: "rebus", symbol: "❶", word: "DOT" },
        { type: "letter", letter: "T" },
        { type: "letter", letter: "V" },
      ],
      metadata: undefined,
      display: [["text", "Mixed example"]],
      direction: "across" as const,
      splits: [5, 6, 7], // Split after TWITCH, after rebus, and after T
      rebusInternalSplits: { 6: [0] }, // D|OT within rebus
    } as Clue

    // Should produce TWITCH|D|OT|T|V
    expect(resolveFullClueAnswer(clue, "|")).toEqual("TWITCH|D|OT|T|V")
  })

  it("unknown section content does not grow through repeated round-trips", () => {
    const puzzle = `## Metadata

title: Round Trip Test
author: Test
date: 2025-01-01
editor: Test

## Grid

BULB
OK.O
L..O
DESK

## Clues

A1. Gardener's concern. ~ BULB
A1 ^hint: Turned on with a flick.

A4. A reasonable statement. ~ OK
A4 ^hint: All __.

A5. The office centerpiece. ~ DESK
A5 ^hint: Fried.


D1. To _ly go. ~ BOLD
D1 ^hint: When you want to make some text stronger.

D2. Bigger than britain. ~ UK
D2 ^hint: A union which left europe.

D3. A conscious tree. ~ BOOK
D3 ^hint: Registering with a restaurant.

## Line Breaks

A1. nbsp:4
D1. wbr:3`

    let xdString = puzzle
    for (let i = 0; i < 10; i++) {
      const json = xdToJSON(xdString)
      // Simulate a clue edit like the studio does
      json.clues.across[0].body = `Gardener's concern (edit ${i}).`
      xdString = JSONToXD(json)
    }

    const finalJSON = xdToJSON(xdString)
    expect(finalJSON.unknownSections["line-breaks"].content).toBe("A1. nbsp:4\nD1. wbr:3")
  })

  it("Handles multiple internal splits in same rebus", () => {
    // Test case with multiple internal splits in the same rebus
    const clue = {
      body: "All internal splits",
      answer: "JUSTASKOSH",
      number: 1,
      position: { col: 0, index: 0 },
      tiles: [
        { type: "letter", letter: "J" },
        { type: "letter", letter: "U" },
        { type: "letter", letter: "S" },
        { type: "rebus", symbol: "❶", word: "TASK" },
        { type: "letter", letter: "O" },
        { type: "letter", letter: "S" },
        { type: "letter", letter: "H" },
      ],
      metadata: undefined,
      display: [["text", "All internal splits"]],
      direction: "across" as const,
      rebusInternalSplits: { 3: [0, 1] },
    } as Clue

    // Should produce JUST|A|SKOSH
    expect(resolveFullClueAnswer(clue, "|")).toEqual("JUST|A|SKOSH")
  })
})
