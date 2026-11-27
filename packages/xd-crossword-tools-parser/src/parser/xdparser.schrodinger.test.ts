import { expect, it, describe } from "vitest"
import { xdToJSON } from "./xdToJSON"

describe("pre-v4 Puzzmo '*' squares", () => {
  // xd-crossword-migrator turns these into rebus keys, its fixtures have each of the files these tests used to read
  const xd = `
## Metadata
Title: Test Schrödinger

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
D4. Former intimates ~ EXES
`

  it("reads '*' as a character like any other, with a deprecation", () => {
    const json = xdToJSON(xd)
    expect(json.tiles[2][1]).toMatchObject({ type: "letter", letter: "*" })
    expect(json.report.warnings.map((w) => w.message)).toContainEqual(expect.stringContaining("'*' is a pre-v4 Puzzmo Schrödinger square"))
  })

  it("keeps '^alt' as clue metadata rather than an answer, with a deprecation", () => {
    const json = xdToJSON(xd)
    const a6 = json.clues.across.find((c) => c.number === 6)!
    expect(a6.answers.map((a) => a.answer)).toEqual(["CONE"])
    expect(a6.metadata?.alt).toBe("CANE")
    expect(json.report.warnings.filter((w) => w.message.includes("'^alt' answers are from pre-v4"))).toHaveLength(2)
  })
})

describe("Rebus-based Schrödinger squares", () => {
  it("creates Schrödinger tile from duplicate rebus keys with single letters", () => {
    const xd = `
## Metadata
Title: Test Rebus Schrödinger
Author: Test Author
Rebus: 1=O|A

## Grid
TILE
APEX
C1NE
ODDS

## Clues
A1. Mosaic piece ~ TILE
A5. Pinnacle ~ APEX
A6. Sugar ____ ~ CONE
A7. Chances, in gambling ~ ODDS

D1. Tuesday treat ~ TACO
D2. Apple tech ~ IPOD
D3. Complement to borrow ~ LEND
D4. Former intimates ~ EXES
`

    const result = xdToJSON(xd)

    const tile = result.tiles[2][1]
    expect(tile.type).toBe("schrodinger")
    if (tile.type === "schrodinger") {
      expect(tile.validLetters).toEqual(["O", "A"])
      expect(tile.validRebuses).toHaveLength(0)
      expect(tile.symbol).toBe("1")
    }
  })

  it("creates Schrödinger tile from duplicate rebus keys with multi-letter values", () => {
    const xd = `
## Metadata
Title: Test Rebus Schrödinger
Author: Test Author
Rebus: 1=OR|AR

## Grid
TILE
APEX
C1NE
ODDS

## Clues
A1. Mosaic piece ~ TILE
A5. Pinnacle ~ APEX
A6. Sugar ____ ~ CORNE
A7. Chances, in gambling ~ ODDS

D1. Tuesday treat ~ TACO
D2. Apple tech ~ IPORD
D3. Complement to borrow ~ LEND
D4. Former intimates ~ EXES
`

    const result = xdToJSON(xd)

    const tile = result.tiles[2][1]
    expect(tile.type).toBe("schrodinger")
    if (tile.type === "schrodinger") {
      expect(tile.validLetters).toHaveLength(0)
      expect(tile.validRebuses).toEqual([
        { letters: "OR", symbol: "1" },
        { letters: "AR", symbol: "1" },
      ])
      expect(tile.symbol).toBe("1")
    }
  })

  it("handles mixed single-letter and multi-letter values", () => {
    const xd = `
## Metadata
Title: Mixed
Author: Test
Rebus: 1=O|AR

## Grid
TILE
APEX
C1NE
ODDS

## Clues
A1. Mosaic piece ~ TILE
A5. Pinnacle ~ APEX
A6. Clue ~ CONE
A7. Chances, in gambling ~ ODDS

D1. Tuesday treat ~ TACO
D2. Apple tech ~ IPOD
D3. Complement to borrow ~ LEND
D4. Former intimates ~ EXES
`

    const result = xdToJSON(xd)

    const tile = result.tiles[2][1]
    expect(tile.type).toBe("schrodinger")
    if (tile.type === "schrodinger") {
      expect(tile.validLetters).toEqual(["O"])
      expect(tile.validRebuses).toEqual([{ letters: "AR", symbol: "1" }])
      expect(tile.symbol).toBe("1")
    }
  })

  it("coexists with regular single-valued rebuses", () => {
    const xd = `
## Metadata
Title: Mixed
Author: Test
Rebus: 1=O|A 2=XY

## Grid
TILE
APEX
C1N2
ODDS

## Clues
A1. Mosaic piece ~ TILE
A5. Pinnacle ~ APEX
A6. Clue ~ CONXY
A7. Chances, in gambling ~ ODDS

D1. Tuesday treat ~ TACO
D2. Apple tech ~ IPOD
D3. Complement to borrow ~ LEND
D4. Former intimates ~ EXXYS
`

    const result = xdToJSON(xd)

    // 1 is Schrödinger
    const tile1 = result.tiles[2][1]
    expect(tile1.type).toBe("schrodinger")
    if (tile1.type === "schrodinger") {
      expect(tile1.validLetters).toEqual(["O", "A"])
      expect(tile1.symbol).toBe("1")
    }

    // 2 is regular rebus
    const tile2 = result.tiles[2][3]
    expect(tile2.type).toBe("rebus")
    if (tile2.type === "rebus") {
      expect(tile2.word).toBe("XY")
      expect(tile2.symbol).toBe("2")
    }
  })

  it("doesn't add '^alt' answers to a square's options, they come from the Rebus field", () => {
    const xd = `
## Metadata
Title: Merge Test
Author: Test
Rebus: 1=O|A

## Grid
TILE
APEX
C1NE
ODDS

## Clues
A1. Mosaic piece ~ TILE
A5. Pinnacle ~ APEX
A6. Sugar ____ ~ CONE
A6 ^alt: CUNE
A7. Chances, in gambling ~ ODDS

D1. Tuesday treat ~ TACO
D2. Apple tech ~ IPOD
D3. Complement to borrow ~ LEND
D4. Former intimates ~ EXES
`

    const result = xdToJSON(xd)

    const tile = result.tiles[2][1]
    expect(tile.type).toBe("schrodinger")
    if (tile.type === "schrodinger") {
      expect(tile.validOptions).toEqual(["O", "A"])
    }
  })
})

describe("validOptions variant indexes", () => {
  it("preserves declaration order for rebus-based squares, including mixed letter/rebus values", () => {
    const xd = `
## Metadata
Title: Ordering
Author: Test
Rebus: 1=O|AR|E

## Clues
A1. Clue ~ CONE

## Grid
C1NE
ODDS
DDDD
SSSS
`

    const result = xdToJSON(xd)

    const tile = result.tiles[0][1]
    expect(tile.type).toBe("schrodinger")
    if (tile.type === "schrodinger") {
      // One ordered list: position is the variant index. The validLetters/validRebuses
      // split would collapse "O" (letter index 0) and "AR" (rebus index 0) onto the same index.
      expect(tile.validOptions).toEqual(["O", "AR", "E"])
      expect(tile.validLetters).toEqual(["O", "E"])
      expect(tile.validRebuses).toEqual([{ letters: "AR", symbol: "1" }])
    }
  })

  it("gives every schrodinger square in a word the same variant order, for per-clue index checking", () => {
    const xd = `
## Metadata
Title: Two cells one word
Author: Test
Rebus: 1=C|B 2=T|D

## Clues
A1. Pet sound ~ CAT

## Grid
1A2
ODD
GGG
`

    const result = xdToJSON(xd)

    const one = result.tiles[0][0]
    const two = result.tiles[0][2]
    expect(one.type).toBe("schrodinger")
    expect(two.type).toBe("schrodinger")
    if (one.type === "schrodinger" && two.type === "schrodinger") {
      // CAT resolves both cells to index 0, BAD resolves both to index 1
      expect(one.validOptions).toEqual(["C", "B"])
      expect(two.validOptions).toEqual(["T", "D"])
    }
  })
})
