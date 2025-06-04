import { expect, it, describe } from "vitest"
import { xdToJSON } from "./xdparser2"

describe("Schrödinger squares", () => {
  it("parses * as Schrödinger square in grid", () => {
    const xd = `
## Metadata
Title: Test Schrödinger
Author: Test Author

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

    const result = xdToJSON(xd)

    // Check that the * was parsed as a Schrödinger tile
    const schrodingerTile = result.tiles[2][1]
    expect(schrodingerTile.type).toBe("schrodinger")
    if (schrodingerTile.type === "schrodinger") {
      expect(schrodingerTile.validLetters).toContain("O")
      expect(schrodingerTile.validLetters).toContain("A")
      expect(schrodingerTile.validLetters).toHaveLength(2)
    }
  })

  it("supports multiple alternative answers", () => {
    const xd = `
## Metadata
Title: Multiple Alternatives
Author: Test

## Grid
*BC
DEF
GHI

## Clues
A1. First letter ~ ABC
A1 ^alt: XBC
A1 ^alt1: YBC
A1 ^alt2: ZBC

D1. Down clue ~ ADG
`

    const result = xdToJSON(xd)

    const schrodingerTile = result.tiles[0][0]
    expect(schrodingerTile.type).toBe("schrodinger")
    if (schrodingerTile.type === "schrodinger") {
      expect(schrodingerTile.validLetters).toContain("A")
      expect(schrodingerTile.validLetters).toContain("X")
      expect(schrodingerTile.validLetters).toContain("Y")
      expect(schrodingerTile.validLetters).toContain("Z")
      expect(schrodingerTile.validLetters).toHaveLength(4)
    }
  })

  it("stores alt metadata in clues", () => {
    const xd = `
## Metadata
Title: Test

## Grid
*BC

## Clues
A1. Test clue ~ ABC
A1 ^alt: XBC
A1 ^alt1: YBC
`

    const result = xdToJSON(xd)
    const clue = result.clues.across[0]

    expect(clue.metadata?.alt).toBe("XBC")
    expect(clue.metadata?.alt1).toBe("YBC")
  })

  it("handles Schrödinger squares with rebuses inside them", () => {
    const xd = `
## Metadata
Title: Test Schrödinger
Author: Test Author
Rebus: 1=AR 2=OR


## Grid
TILE
APEX
C*NE
ODDS

## Clues
A1. Mosaic piece ~ TILE
A5. Pinnacle ~ APEX
A6. Sugar ____ ~ C1NE
A6 ^alt: C2NE
A7. Chances, in gambling ~ ODDS

D1. Tuesday treat ~ TACO
D2. Apple tech ~ IP1D
D2 ^alt: IP2D
D3. Complement to borrow ~ LEND
D4. Former intimates ~ EXES
`

    const result = xdToJSON(xd)

    const schrodingerTile = result.tiles[2][1]
    expect(schrodingerTile.type).toBe("schrodinger")

    if (schrodingerTile.type === "schrodinger") {
      expect(schrodingerTile.validRebuses).toBeDefined()
      expect(schrodingerTile.validRebuses).toContain("AR")
      expect(schrodingerTile.validRebuses).toContain("OR")
      expect(schrodingerTile.validLetters).toHaveLength(0)
    }
  })

  it("handles Schrödinger squares with a rebus inside it", () => {
    const xd = `
## Metadata
Title: Test Schrödinger
Author: Test Author
Rebus: 1=CC


## Grid
TILE
APEX
1*NE
ODDS

## Clues
A1. Mosaic piece ~ TILE
A5. Pinnacle ~ APEX
A6. Sugar ____ ~ CCANE
A6 ^alt: CCONE
A7. Chances, in gambling ~ ODDS

D1. Tuesday treat ~ TACCO
D2. Apple tech ~ IPAD
D2 ^alt: IPOD
D3. Complement to borrow ~ LEND
D4. Former intimates ~ EXES
`

    const result = xdToJSON(xd)

    const schrodingerTile = result.tiles[2][1]
    expect(schrodingerTile.type).toBe("schrodinger")

    if (schrodingerTile.type === "schrodinger") {
      // Valid letters from A6 (CCANE/CCONE): A, O
      // Valid letters from D2 (IPOD/IPAD): O, A
      expect(schrodingerTile.validLetters).toEqual(expect.arrayContaining(["A", "O"]))
      expect(schrodingerTile.validLetters).toHaveLength(2)
    }
  })

  it("validates that clues properly reference tiles", () => {
    const xd = `
## Metadata
Title: Test Schrödinger
Author: Test Author

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

    const result = xdToJSON(xd)

    // Check that A6 clue properly references the tiles including the Schrödinger square
    const a6Clue = result.clues.across.find((c) => c.number === 6)
    expect(a6Clue).toBeDefined()
    expect(a6Clue!.tiles).toHaveLength(4)
    expect(a6Clue!.tiles[1].type).toBe("schrodinger")

    // Check that D2 clue also references the same Schrödinger square
    const d2Clue = result.clues.down.find((c) => c.number === 2)
    expect(d2Clue).toBeDefined()
    expect(d2Clue!.tiles).toHaveLength(4)
    expect(d2Clue!.tiles[2].type).toBe("schrodinger")

    // Both clues should reference the same tile object
    expect(a6Clue!.tiles[1]).toBe(d2Clue!.tiles[2])
  })
})
