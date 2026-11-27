import { readFileSync } from "fs"
import { join } from "path"
import { describe, it, expect } from "vitest"
// The parser is only a dev dependency, it checks that the migrated files read as v4
import { xdToJSON, type CrosswordJSON } from "xd-crossword-tools-parser"
import { migrateXDToV4 } from "./migrateXDToV4"

const fixture = (name: string) => readFileSync(join(__dirname, "fixtures", name), "utf8")

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
    await expect(migrateXDToV4(legacy)).toMatchFileSnapshot("./fixtures/outputs/pre-v4-puzzmo-migrated.xd")
  })

  it("removes comments", () => {
    expect(legacy).toContain("<!--")
    expect(migrateXDToV4(legacy)).not.toContain("<!--")
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
    // This one uses titlecase keys, by default they are written in lowercase
    const v4 = fixture("outputs/explicit-alpha-bits.xd")
    expect(migrateXDToV4(v4, { keyCase: "titlecase" })).toEqual(v4)
    expect(migrateXDToV4(v4)).toEqual(v4.replace(/^(Title|Author|Copyright|Description):/gm, (k) => k.toLowerCase()))

    const migrated = migrateXDToV4(legacy)
    expect(migrateXDToV4(migrated)).toEqual(migrated)
  })

  it("adds headers to a file with implicit sections", () => {
    expect(migrateXDToV4(fixture("inputs/alpha-bits.xd"), { keyCase: "titlecase" })).toEqual(fixture("outputs/explicit-alpha-bits.xd"))
  })

  it("writes metadata keys in lowercase, or titlecase when asked", () => {
    const xd = (lines: string[], hint: string) =>
      `## Metadata\n\n${lines.join("\n")}\nO { background: circle }\n\n## Grid\n\nAB\n\n## Clues\n\nA1. Pair ~ AB\nA1 ${hint}\nA1 ^refS: D1\n`
    const original = xd(["Title: Keys", "AUTHOR: Orta", "splitcharacter: |", "hintEditor: Someone"], "^Hint: Two letters")

    // A line in the metadata which isn't a field, like a design rule, is left as it is
    const lower = xd(["title: Keys", "author: Orta", "splitcharacter: |", "hinteditor: Someone"], "^hint: Two letters").replace("^refS:", "^refs:")
    expect(migrateXDToV4(original)).toEqual(lower)
    expect(migrateXDToV4(lower)).toEqual(lower)

    const title = xd(["Title: Keys", "Author: Orta", "SplitCharacter: |", "HintEditor: Someone"], "^Hint: Two letters").replace("^refS:", "^Refs:")
    expect(migrateXDToV4(original, { keyCase: "titlecase" })).toEqual(title)
    expect(migrateXDToV4(title, { keyCase: "titlecase" })).toEqual(title)
    expect(migrateXDToV4(lower, { keyCase: "titlecase" })).toEqual(title)
  })

  it("turns repeated rebus keys into '|' options", () => {
    const xd = `## Metadata

title: Rebus Schrödinger
rebus: 1=O 1=A

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
    const migrated = migrateXDToV4(xd)
    expect(migrated).toEqual(xd.replace("rebus: 1=O 1=A", "rebus: 1=O|A"))
    expect(xdToJSON(xd).report.warnings.map((w) => w.message)).toEqual([
      "'1=O 1=A' repeats the rebus key '1', xd v4 gives a cell's options with '|': '1=O|A'",
    ])
    expect(xdToJSON(migrated).report.warnings).toEqual([])
    expect(puzzle(xdToJSON(migrated))).toEqual(puzzle(xdToJSON(xd)))
  })

  it("splits up rebus rules joined with ',', and escapes values v4 would read differently", () => {
    const xd = (rebus: string) => `## Metadata\n\nrebus: ${rebus}\n\n## Grid\n\n12\n3.\n\n## Clues\n\nA1. Mix ~ OILWATER\n`
    const migrated = migrateXDToV4(xd("1=OIL,2=WATER 3=|"))
    expect(migrated).toEqual(xd("1=OIL 2=WATER 3=\\|"))

    const json = xdToJSON(migrated)
    expect(json.report.errors).toEqual([])
    expect(json.report.warnings).toEqual([])
    expect(json.rebuses).toEqual({ 1: "OIL", 2: "WATER", 3: "|" })
  })

  it("leaves a rebus field it can't read as written, rather than lose a rule", () => {
    const xd = `## Metadata\n\nrebus: 1=O 1=A 23=XY|Z\n\n## Grid\n\nC1NE\n\n## Clues\n\nA1. Sugar ____ ~ CONE ~ CANE\n`
    expect(migrateXDToV4(xd)).toEqual(xd)
  })

  it("gives pre-v4 Puzzmo '*' squares a rebus key, and moves '^alt' answers onto the clue line", () => {
    const migrated = migrateXDToV4(legacy)
    expect(migrated).toContain("rebus: 1=O|A\n")
    expect(migrated).toContain("C1NE\n")
    expect(migrated).toContain("A6. Sugar ____ ~ CONE ~ CANE\n")
    expect(migrated).toContain("D2. Apple tech ~ IPOD ~ IPAD\n")
    expect(migrated).not.toContain("^alt")
  })

  it("spells out rebuses which an answer wrote with their key", () => {
    const xd = `## Metadata\n\ntitle: Rebus inside\nrebus: 1=AR 2=OR\n\n## Grid\n\nTILE\nAPEX\nC*NE\nODDS\n\n## Clues\n\nA6. Sugar ____ ~ C1NE\nA6 ^alt: C2NE\n`
    const migrated = migrateXDToV4(xd)
    expect(migrated).toContain("rebus: 1=AR 2=OR 3=AR|OR\n")
    expect(migrated).toContain("C3NE\n")
    expect(migrated).toContain("A6. Sugar ____ ~ CARNE ~ CORNE\n")
  })

  it("copies sections it doesn't know about as they are", () => {
    const unknown = `## Metapuzzle\n\n> What connects them?\n  {weird} ~ formatting\n\n## Puzzmo Extras\n\nsome: thing\nA1. Not a clue ~ NOPE\n`
    expect(migrateXDToV4(legacy + "\n" + unknown)).toEqual(migrateXDToV4(legacy) + "\n" + unknown)
  })

  it("reads a v4 clue line with many answers as answers, not as a pre-v4 body", () => {
    const xd = `## Metadata

rebus: 1=O|A

## Grid

C1NE

## Clues

A1. Sugar ____ ~ CONE ~ CANE
`
    expect(migrateXDToV4(xd)).toEqual(xd)
  })

  it("converts an image written without square brackets, which is how the pre-v4 docs had it", () => {
    const xd = `## Metadata

Title: Images

## Grid

OKGO

## Clues

A1. {!https://cdn.puzzmo.com/game-assets/california-bear.svg|a bear!} Band ~ OKGO
`
    const migrated = migrateXDToV4(xd)
    expect(migrated).toContain("A1. {!a bear | src: https://cdn.puzzmo.com/game-assets/california-bear.svg!} Band ~ OKGO\n")
    expect(xdToJSON(migrated).report.warnings).toEqual([])
    expect(xdToJSON(migrated).clues.across[0].display[0]).toEqual([
      "img",
      "https://cdn.puzzmo.com/game-assets/california-bear.svg",
      "a bear",
      false,
    ])
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

      title: Shaded

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

describe("migrateXDToV4 with Windows line endings", () => {
  it("keeps '\\r\\n' on every line, including the ones it rewrites", () => {
    const legacy = fixture("inputs/pre-v4-puzzmo.xd").replace(/\n/g, "\r\n")
    const migrated = migrateXDToV4(legacy)
    expect(migrated.replace(/\r\n/g, "")).not.toContain("\n")
    expect(migrated).toEqual(migrateXDToV4(fixture("inputs/pre-v4-puzzmo.xd")).replace(/\n/g, "\r\n"))
    expect(migrateXDToV4(migrated)).toEqual(migrated)
  })
})

describe("migrateXDToV4 and '?'", () => {
  it("leaves unfilled cells alone", () => {
    const xd = `## Metadata\n\ntitle: Draft\n\n## Grid\n\nC?NE\n\n## Clues\n\nA1. Sugar ___ ~ C?NE\n`
    expect(migrateXDToV4(xd)).toEqual(xd)
  })

  it("moves a '?' rebus key to an unused character, as '?' is reserved for unfilled cells", () => {
    const xd = `## Metadata\n\ntitle: Old\nrebus: ?=HEART 2=X?Y\n\n## Grid\n\n?S2\n\n## Clues\n\nA1. Lonely ~ HEARTSX?Y\n`
    const migrated = migrateXDToV4(xd)
    expect(migrated).toContain("rebus: 1=HEART 2=X?Y\n")
    expect(migrated).toContain("\n1S2\n")
    expect(xdToJSON(migrated).report.warnings).toEqual([])
    expect(xdToJSON(migrated).tiles[0][0]).toEqual({ type: "rebus", symbol: "1", word: "HEART" })
  })
})

describe("migrateXDToV4 and comments", () => {
  it("are removed, as xd has no comments", () => {
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

    expect(xdToJSON(migrateXDToV4(comments)).clues).toEqual(xdToJSON(original).clues)
    expect(migrateXDToV4(comments)).not.toContain("<!--")
  })
})
