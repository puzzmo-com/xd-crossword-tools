import { xdToJSON } from "./xdparser2"

// A 3x2 puzzle where the middle cell of the top row is the interesting one
const puzzle = (topRow: string, extraMeta = "") => `## Metadata

title: Test
author: Test
copyright: © 2026
description: N/A${extraMeta}

## Grid

${topRow}
TEE

## Clues

A1. Bashful ~ ${topRow}
A4. Golf pegs ~ TEE

D1. One ~ ST
D2. Two ~ ${topRow[1]}E
D3. Three ~ ${topRow[2]}E
`

describe("undeclared grid symbols", () => {
  it("rejects a symbol which has no rebus declaration", () => {
    const json = xdToJSON(puzzle("S/Y"), true, true)

    expect(json.report.success).toBeFalsy()
    expect(json.report.errors).toMatchInlineSnapshot(`
      [
        {
          "length": 1,
          "message": "The grid contains '/', which is not a letter and is not declared in the 'rebus:' metadata. Declare it as a rebus (e.g. 'rebus: /=/', or 'rebus: /=/ /=WORD' to also accept a spelt-out answer) or replace it with a letter.",
          "position": {
            "col": 1,
            "index": 9,
          },
          "type": "syntax",
        },
      ]
    `)
  })

  it("accepts the same symbol once it is declared as a rebus", () => {
    const json = xdToJSON(puzzle("S/Y", "\nrebus: /=/"), true, true)

    expect(json.report.success).toBeTruthy()
    expect(json.tiles[0][1]).toEqual({ type: "rebus", symbol: "/", word: "/" })
  })

  it("lets a symbol also accept its spelt-out answer via a multi-valued rebus", () => {
    const json = xdToJSON(puzzle("S/Y", "\nrebus: /=/ /=SLASH"), true, true)

    expect(json.report.success).toBeTruthy()
    expect(json.tiles[0][1]).toMatchObject({ type: "schrodinger", validOptions: ["/", "SLASH"] })
  })

  it("points at the first offending cell and counts the rest", () => {
    const json = xdToJSON(puzzle("///"), true, true)

    expect(json.report.errors).toHaveLength(1)
    expect(json.report.errors[0].message).toContain("(3 cells)")
    expect(json.report.errors[0].position).toEqual({ col: 0, index: 9 })
  })

  it("explains lowercase separately, since it used to mean a circled square", () => {
    const json = xdToJSON(puzzle("SxY"), true, true)

    expect(json.report.errors[0].message).toMatchInlineSnapshot(
      `"The grid contains the lowercase letter 'x'. Grids are uppercase, so use 'X'. Lowercase used to mark a circled square - that now belongs in a '## Design' section."`,
    )
  })

  it("explains a stray space, which is otherwise invisible", () => {
    const json = xdToJSON(puzzle("S Y"), true, true)

    expect(json.report.errors[0].message).toMatchInlineSnapshot(
      `"The grid contains a space. Use '#' or '.' for a block, or '_' for a cell which does not exist."`,
    )
  })

  it("allows the block, empty, non-existing and deprecated schrödinger characters", () => {
    for (const char of ["#", ".", "_", "*"]) {
      const json = xdToJSON(puzzle(`S${char}Y`), true, true)
      expect(json.report.errors.filter((e) => e.message.includes("The grid contains"))).toEqual([])
    }
  })

  it("only reports when strict, so published puzzles keep parsing", () => {
    const json = xdToJSON(puzzle("S/Y"), false, false)

    expect(json.report.errors).toEqual([])
  })
})

describe("multi-code-point grid symbols", () => {
  it("treats an emoji as a single cell rather than two surrogate halves", () => {
    const json = xdToJSON(puzzle("S🎉Y", "\nrebus: 🎉=PARTY"), true, true)

    expect(json.tiles[0]).toHaveLength(3)
    expect(json.tiles[0][1]).toEqual({ type: "rebus", symbol: "🎉", word: "PARTY" })
    expect(json.report.success).toBeTruthy()
  })

  it("reports an undeclared emoji as one symbol", () => {
    const json = xdToJSON(puzzle("S🎉Y"), true, true)

    expect(json.report.errors).toHaveLength(1)
    expect(json.report.errors[0].message).toContain("The grid contains '🎉'")
  })
})
