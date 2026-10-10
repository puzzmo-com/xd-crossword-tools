import { readFileSync } from "fs"
import { describe, it, expect } from "vitest"
import { migrateXDToV4 } from "./migrateXDToV4"
import { xdToJSON } from "./parser/xdToJSON"
import type { CrosswordJSON } from "./types"

const fixture = (name: string) => readFileSync(`./packages/xd-crossword-tools-parser/src/parser/${name}`, "utf8")

/** The parts of a parse which describe the puzzle, rather than how the file was written */
const puzzle = (json: CrosswordJSON) => ({
  tiles: json.tiles.map((row) =>
    row.map((t) => (t.type === "schrodinger" ? { type: t.type, validOptions: [...(t.validOptions || [])].sort() } : t.type === "rebus" ? { type: "rebus", word: t.word } : t)),
  ),
  clues: [...json.clues.across, ...json.clues.down].map((c) => ({
    direction: c.direction,
    number: c.number,
    answers: c.answers.map((a) => a.answer).sort(),
    display: c.display,
    hint: c.metadata?.["hint:display"],
  })),
  design: json.design && Object.fromEntries(
    json.design.positions.flatMap((row, y) => row.map((char, x) => [`${y},${x}`, char && json.design!.styles[char]])).filter(([_, s]) => s),
  ),
  notes: json.notes,
})

describe("migrateXDToV4", () => {
  const legacy = fixture("inputs/pre-v4-puzzmo.xd")

  it("converts a pre-v4 Puzzmo file to v4", async () => {
    await expect(migrateXDToV4(legacy)).toMatchFileSnapshot("./parser/outputs/pre-v4-puzzmo-migrated.xd")
  })

  it("produces a file which parses without any deprecation warnings", () => {
    expect(xdToJSON(legacy).report.warnings.length).toBeGreaterThan(0)

    const json = xdToJSON(migrateXDToV4(legacy), true)
    expect(json.report.errors).toEqual([])
    expect(json.report.warnings).toEqual([])
  })

  it("describes the same puzzle as the original", () => {
    const before = puzzle(xdToJSON(legacy))
    const after = puzzle(xdToJSON(migrateXDToV4(legacy)))

    // Pre-v4 read D3's body up to the last ' ~ ', v4 reads it as the body "A" with the answers B and LEND
    const d3 = (p: typeof before) => p.clues.find((c) => c.direction === "down" && c.number === 3)!
    expect(d3(before)).toMatchObject({ answers: ["B", "LEND"], display: [["text", "A"]] })
    expect(d3(after)).toMatchObject({ answers: ["LEND"], display: [["text", "A ~ B means to borrow"]] })

    const withoutD3 = (p: typeof before) => ({ ...p, clues: p.clues.filter((c) => c !== d3(p)) })
    expect(withoutD3(after)).toEqual(withoutD3(before))
  })

  it("leaves a v4 file unchanged", () => {
    const v4 = fixture("outputs/explicit-alpha-bits.xd")
    expect(migrateXDToV4(v4)).toEqual(v4)

    const migrated = migrateXDToV4(legacy)
    expect(migrateXDToV4(migrated)).toEqual(migrated)
  })

  it("adds headers to a file with implicit sections", () => {
    expect(migrateXDToV4(fixture("inputs/alpha-bits.xd"))).toEqual(fixture("outputs/explicit-alpha-bits.xd"))
  })

  it("leaves rebuses and Schrödinger squares alone, as they are not fully specified in v4 yet", () => {
    const xd = `## Metadata

Title: Rebus Schrödinger
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
    expect(migrateXDToV4(xd)).toEqual(xd)
    expect(migrateXDToV4(fixture("inputs/pre-v4-puzzmo.xd"))).toContain("C*NE\n")
    expect(migrateXDToV4(fixture("inputs/pre-v4-puzzmo.xd"))).toContain("A6. Sugar ____ ~ CONE\nA6 ^alt: CANE\n")
  })

  it("reads a v4 clue line with many answers as answers, not as a pre-v4 body", () => {
    const xd = `## Metadata

Rebus: 1=O 1=A

## Grid

C1NE

## Clues

A1. Sugar ____ ~ CONE ~ CANE
`
    expect(migrateXDToV4(xd)).toEqual(xd)
  })

  it("moves split characters out of the answer and into an annotation", () => {
    const xd = `## Metadata

SplitCharacter: |

## Grid

OKGO

## Clues

A1. Band ~ OK|GO
`
    const migrated = migrateXDToV4(xd)
    expect(migrated).toContain("A1. Band ~ OKGO // OK|GO\n")
    expect(migrateXDToV4(xd.replace("~ OK|GO", "~ OK|GO ~ OK|AY (alt)"))).toContain("A1. Band ~ OKGO ~ OKAY (alt) // OK|GO OK|AY\n")
    expect(xdToJSON(migrated).report.warnings).toEqual([])
    expect(xdToJSON(migrated).clues.across[0].splits).toEqual([1])
  })

  it("creates a design section for v3 Special cells when there isn't one", () => {
    const xd = `## Metadata

Title: Shaded
Special: shaded

## Grid

aB
Cd

## Clues

A1. First ~ AB
A3. Second ~ CD

D1. Third ~ AC
D2. Fourth ~ BD
`
    const migrated = migrateXDToV4(xd)
    expect(migrated).toMatchInlineSnapshot(`
      "## Metadata

      Title: Shaded

      ## Grid

      AB
      CD

      ## Clues

      A1. First ~ AB
      A3. Second ~ CD

      D1. Third ~ AC
      D2. Fourth ~ BD

      ## Design

      S { background: shaded }

      S.
      .S
      "
    `)
    expect(puzzle(xdToJSON(migrated))).toEqual(puzzle(xdToJSON(xd)))
  })
})
