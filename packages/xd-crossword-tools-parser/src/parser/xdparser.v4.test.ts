import { describe, it, expect } from "vitest"
import { xdToJSON } from "./xdToJSON"

const puzzle = (clues: string, extra = "") => `## Metadata

Title: v4
${extra}
## Grid

TILE
APEX
C1NE
ODDS

## Clues

${clues}
`

describe("xd v4 clue lines", () => {
  it("ends the body at the first ' ~ ', and reads every answer after it", () => {
    const json = xdToJSON(puzzle(`A6. Sugar ____ ~ CONE ~ CANE`, "Rebus: 1=O 1=A"))
    const a6 = json.clues.across.find((c) => c.number === 6)!
    expect(a6.body).toBe("Sugar ____")
    expect(a6.answer).toBe("CONE")
    expect(a6.answers).toEqual([{ answer: "CONE" }, { answer: "CANE" }])
  })

  it("only uses the first word of an answer", () => {
    const json = xdToJSON(puzzle(`A1. Mosaic piece ~ TILE (4 letters)`))
    expect(json.clues.across[0].answer).toBe("TILE")
  })

  it("reads a ' ~ ' written as a literal as part of the body", () => {
    const json = xdToJSON(puzzle(`A1. What {\\~\\} means ~ TILE`))
    expect(json.clues.across[0].body).toBe("What {\\~\\} means")
    expect(json.clues.across[0].plain).toBe("What ~ means")
  })

  it("treats clue metadata keys as case-insensitive", () => {
    const json = xdToJSON(puzzle(`A1. Mosaic piece ~ TILE\nA1 ^REFS: A5 D1\nA1 ^Hint: A {/flat/} thing`))
    expect(json.clues.across[0].metadata).toMatchObject({ refs: "A5 D1", hint: "A {/flat/} thing", "hint:plain": "A flat thing" })
  })

  it("explains that uniclues are not supported yet", () => {
    const json = xdToJSON(puzzle(`1. Reposition an icon ~ TILE`))
    expect(json.report.errors.map((e) => e.message)).toContain("Uniclue clues (a clue number without an A or D) are not supported yet: '1. Reposition an icon ~ TILE'")
  })
})

describe("xd v4 metadata", () => {
  it("treats keys as case-insensitive", () => {
    const json = xdToJSON(`## Metadata\n\nTITLE: Upper\nauThor: Mixed\n\n## Grid\n\nAB\n\n## Clues\n\nA1. Hi ~ AB`)
    expect(json.meta.title).toBe("Upper")
    expect(json.meta.author).toBe("Mixed")
  })

  it("errors on a repeated key in strict mode", () => {
    const json = xdToJSON(`## Metadata\n\nTitle: One\ntitle: Two\n\n## Grid\n\nAB\n\n## Clues\n\nA1. Hi ~ AB`, true)
    expect(json.report.errors.map((e) => e.message)).toContain("The metadata field 'title' has already been set, a key can only be used once")
  })
})

describe("xd v4 grids", () => {
  it("reads one codepoint per cell, so emoji can be rebus keys", () => {
    const json = xdToJSON(`## Metadata\n\nRebus: 🐱=CAT\n\n## Grid\n\n🐱S\n\n## Clues\n\nA1. Felines ~ CATS`)
    expect(json.tiles[0]).toEqual([
      { type: "rebus", symbol: "🐱", word: "CAT" },
      { type: "letter", letter: "S" },
    ])
    expect(json.report.errors).toEqual([])
  })

  it("reads '_' as a spacer", () => {
    const json = xdToJSON(`## Metadata\n\nTitle: Spacer\n\n## Grid\n\n_AB\nCD_\n\n## Clues\n\nA1. Hi ~ AB\nA2. Hi ~ CD\n\nD1. Hi ~ AD`)
    expect(json.report.errors).toEqual([])
    expect(json.tiles[0][0]).toEqual({ type: "blank", spacer: true })
    expect(json.clues.across.map((c) => c.answer)).toEqual(["AB", "CD"])
  })

  it("reads v3 'Special' lowercase cells into the design", () => {
    const json = xdToJSON(`## Metadata\n\nSpecial: circle\n\n## Grid\n\naB\nCd\n\n## Clues\n\nA1. Hi ~ AB\nA3. Hi ~ CD\n\nD1. Hi ~ AC\nD2. Hi ~ BD`)
    expect(json.tiles[0][0]).toMatchObject({ type: "letter", letter: "A" })
    expect(json.design).toEqual({ styles: { O: { background: "circle" } }, positions: [["O"], [undefined, "O"]] })
    expect(json.report.errors).toEqual([])
    expect(json.report.warnings).toHaveLength(1)
  })
})

describe("split characters", () => {
  const xd = (clue: string, meta = "SplitCharacter: |") => `## Metadata

${meta}

## Grid

OKGO

## Clues

${clue}
`

  it("reads splits from an end-of-line '// ANS|WER' annotation", () => {
    const json = xdToJSON(xd(`A1. Band ~ OKGO // OK|GO`))
    expect(json.report.errors).toEqual([])
    expect(json.report.warnings).toEqual([])
    expect(json.clues.across[0]).toMatchObject({ answer: "OKGO", splits: [1], answers: [{ answer: "OKGO", splits: [1] }] })
  })

  it("uses '|' when the annotation is used without declaring a split character", () => {
    const json = xdToJSON(xd(`A1. Band ~ OKGO // OK|GO`, "Title: No split character"))
    expect(json.clues.across[0]).toMatchObject({ answer: "OKGO", splits: [1] })
  })

  it("errors when the annotation does not spell the answer", () => {
    const json = xdToJSON(xd(`A1. Band ~ OKGO // OK|NO`))
    expect(json.report.errors.map((e) => e.message)).toEqual([
      "'OK|NO' after the '//' does not spell any of the answers (OKGO) once its split characters are removed",
    ])
  })

  it("still reads splits inside the answer, with a deprecation", () => {
    const json = xdToJSON(xd(`A1. Band ~ OK|GO`))
    expect(json.clues.across[0]).toMatchObject({ answer: "OKGO", splits: [1] })
    expect(json.report.warnings.map((w) => w.message)).toEqual([
      "Split characters inside the answer are deprecated, use '~ OKGO // OK|GO' instead",
    ])
  })

  it("applies the annotation to every answer on the line, in any order", () => {
    const json = xdToJSON(xd(`A1. Band ~ OKGO ~ OKAY ~ OOGO // OK|AY OK|GO`, "SplitCharacter: |\nRebus: 1=K 1=O 2=G 2=A 3=O 3=Y"))
    expect(json.clues.across[0].answers).toEqual([
      { answer: "OKGO", splits: [1] },
      { answer: "OKAY", splits: [1] },
      { answer: "OOGO" },
    ])
    expect(json.clues.across[0].splits).toEqual([1])
  })

  it("requires the annotation to come after every answer", () => {
    const json = xdToJSON(xd(`A1. Band ~ OKGO // OK|GO ~ OKAY`))
    expect(json.report.errors.map((e) => e.message)).toEqual(["The ' // ' annotation goes at the end of the line, after all of the answers"])
  })
})

describe("editor info for answers", () => {
  it("keeps 'answer:unprocessed' as the first answer with its splits, and the whole text in 'answers:unprocessed'", () => {
    const xd = `## Metadata\n\nSplitCharacter: |\n\n## Grid\n\nOKGO\n\n## Clues\n\nA1. Band ~ OKGO ~ OKAY // OK|GO OK|AY\n`
    const json = xdToJSON(xd, false, true)
    expect(json.clues.across[0].metadata).toMatchObject({
      "answer:unprocessed": "OK|GO",
      "answers:unprocessed": "OKGO ~ OKAY // OK|GO OK|AY",
    })
  })
})

describe("deprecations", () => {
  it("are reported as warnings with their own type", () => {
    const json = xdToJSON(`## Metadata\n\nSplitCharacter: |\n\n## Grid\n\nOKGO\n\n## Clues\n\nA1. Band ~ OK|GO\n`)
    expect(json.report.warnings.map((w) => w.type)).toEqual(["deprecation"])
    expect(json.report.success).toBe(true)
  })
})

describe("design positions", () => {
  it("have a row for every grid row, even when the design grid is shorter", () => {
    const json = xdToJSON(`## Grid\n\nAB\nCD\nEF\n\n## Design\n\nO { background: circle }\n\nO.\n`)
    expect(json.design?.positions).toEqual([["O"], [], []])
  })

  it("have a row for every grid row when made from v3 Special cells", () => {
    const json = xdToJSON(`## Metadata\n\nSpecial: circle\n\n## Grid\n\nAB\nCD\neF\n\n## Clues\n\nA1. Hi ~ AB\n`)
    expect(json.design?.positions).toEqual([[], [], ["O"]])
  })
})

describe("unfilled cells", () => {
  const xd = `## Metadata\n\ntitle: Draft\n\n## Grid\n\nC?NE\n\n## Clues\n\nA1. Sugar ___ ~ C?NE\n`

  it("reads '?' as a letter tile with no letter yet", () => {
    const json = xdToJSON(xd)
    expect(json.report.errors).toEqual([])
    expect(json.report.warnings).toEqual([])
    expect(json.tiles[0][1]).toEqual({ type: "letter", letter: "", unfilled: true })
    // It is still part of the word
    expect(json.clues.across[0]).toMatchObject({ answer: "C?NE", position: { col: 0, index: 0 } })
    expect(json.clues.across[0].tiles).toHaveLength(4)
  })

  it("keeps the meaning of '?' in an older file which declared it as a rebus key, with a deprecation", () => {
    const json = xdToJSON(xd.replace("title: Draft", "title: Draft\nRebus: ?=O").replace("~ C?NE", "~ CONE"))
    expect(json.tiles[0][1]).toEqual({ type: "rebus", symbol: "?", word: "O" })
    expect(json.report.warnings.map((w) => w.type)).toEqual(["deprecation"])
  })
})
