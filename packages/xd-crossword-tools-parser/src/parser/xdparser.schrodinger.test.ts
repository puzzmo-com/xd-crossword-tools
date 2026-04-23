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
      expect(schrodingerTile.validRebuses).toEqual(expect.arrayContaining([
        { letters: "AR", symbol: "1" },
        { letters: "OR", symbol: "2" }
      ]))
      expect(schrodingerTile.validRebuses).toHaveLength(2)
      expect(schrodingerTile.validLetters).toHaveLength(0)
    }
  })

  it("handles Schrödinger squares with in a clue with a rebus", () => {
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

describe("Rebus-based Schrödinger squares", () => {
  it("produces the same tile data as the star-based approach", () => {
    const starBased = `
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

    const rebusBased = `
## Metadata
Title: Test Schrödinger
Author: Test Author
Rebus: 1=O 1=A

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

    const starResult = xdToJSON(starBased)
    const rebusResult = xdToJSON(rebusBased)

    // Both should have a Schrödinger tile at [2][1]
    const starTile = starResult.tiles[2][1]
    const rebusTile = rebusResult.tiles[2][1]
    expect(starTile.type).toBe("schrodinger")
    expect(rebusTile.type).toBe("schrodinger")

    if (starTile.type === "schrodinger" && rebusTile.type === "schrodinger") {
      // Same valid letters
      expect(rebusTile.validLetters).toEqual(expect.arrayContaining(starTile.validLetters))
      expect(rebusTile.validLetters).toHaveLength(starTile.validLetters.length)

      // Same valid rebuses (both empty for single-letter case)
      expect(rebusTile.validRebuses).toEqual(starTile.validRebuses)

      // Same clue references
      expect(rebusTile.clues).toEqual(starTile.clues)

      // Rebus-based has a symbol, star-based does not
      expect(rebusTile.symbol).toBe("1")
      expect(starTile.symbol).toBeUndefined()
    }

    // Clue tiles should reference Schrödinger tiles in both cases
    const starA6 = starResult.clues.across.find((c) => c.number === 6)
    const rebusA6 = rebusResult.clues.across.find((c) => c.number === 6)
    expect(starA6!.tiles[1].type).toBe("schrodinger")
    expect(rebusA6!.tiles[1].type).toBe("schrodinger")

    // Star-based has alt metadata, rebus-based does not
    expect(starA6!.metadata?.alt).toBe("CANE")
    expect(rebusA6!.metadata).toBeUndefined()
  })

  it("creates Schrödinger tile from duplicate rebus keys with single letters", () => {
    const xd = `
## Metadata
Title: Test Rebus Schrödinger
Author: Test Author
Rebus: 1=O 1=A

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
Rebus: 1=OR 1=AR

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
Rebus: 1=O 1=AR

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
Rebus: 1=O 1=A 2=XY

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

  it("merges with ^alt values", () => {
    const xd = `
## Metadata
Title: Merge Test
Author: Test
Rebus: 1=O 1=A

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
      // O and A from rebus, U from ^alt
      expect(tile.validLetters).toContain("O")
      expect(tile.validLetters).toContain("A")
      expect(tile.validLetters).toContain("U")
      expect(tile.validLetters).toHaveLength(3)
    }
  })
})
