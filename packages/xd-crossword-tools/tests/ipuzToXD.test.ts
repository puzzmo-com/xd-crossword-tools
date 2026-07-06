import { readFileSync } from "fs"
import { describe, it, expect } from "vitest"
import { xdToJSON } from "xd-crossword-tools-parser"

import { ipuzToXD } from "../src/ipuzToXD"

const wordSquareIpuz = readFileSync(__dirname + "/ipuz/word-square.ipuz", "utf8")
const kitchenSinkIpuz = readFileSync(__dirname + "/ipuz/kitchen-sink.ipuz", "utf8")

describe(ipuzToXD.name, () => {
  it("converts a simple ipuz file", () => {
    const res = ipuzToXD(wordSquareIpuz)
    expect(res).toMatchInlineSnapshot(`
      "## Metadata

      title: Word Square
      author: Orta Therox
      editor: 
      date: 07/06/2026
      copyright: © 2026

      ## Grid

      CARD
      AREA
      REAR
      DART

      ## Clues

      A1. Ace of spades, e.g. ~ CARD
      A5. Length times width, for a rectangle ~ AREA
      A6. Back end of a car ~ REAR
      A7. Pub projectile ~ DART

      D1. It may be wild in poker ~ CARD
      D2. Zone ~ AREA
      D3. Hindmost part ~ REAR
      D4. Small pointed missile ~ DART"
    `)
  })

  it("converts rebuses, circles, pre-filled cells and extra metadata", () => {
    const res = ipuzToXD(kitchenSinkIpuz)
    expect(res).toMatchInlineSnapshot(`
      "## Metadata

      title: Kitchen Sink
      author: Orta Therox
      editor: An Editor
      date: 07/06/2026
      copyright: © 2026
      publisher: Puzzmo
      url: https://example.com/kitchen-sink
      difficulty: Easy
      rebus: ❶=GO

      ## Grid

      ❶AT
      AGE
      TEN

      ## Clues

      A1. Farm animal that eats everything ~ GOAT
      A4. Number of candles on a cake ~ AGE
      A5. Dime's worth ~ TEN

      D1. Greatest of all time ~ GOAT
      D2. Era ~ AGE
      D3. Base of the decimal system ~ TEN

      ## Design

      <style>
      O { background: circle }
      </style>

      ...
      .O.
      ...


      ## Start

      ...
      ...
      ..N


      ## Notes

      A tiny puzzle exercising rebuses, circles and pre-filled cells."
    `)
  })

  it("produces an xd document the parser accepts", () => {
    for (const source of [wordSquareIpuz, kitchenSinkIpuz]) {
      const json = xdToJSON(ipuzToXD(source))
      expect(json.report.errors).toEqual([])
      expect(json.report.success).toBe(true)
    }
  })

  it("handles blocks and null cells", () => {
    const res = ipuzToXD({
      version: "http://ipuz.org/v2",
      kind: ["http://ipuz.org/crossword#1"],
      dimensions: { width: 3, height: 3 },
      puzzle: [
        [1, 2, "#"],
        [3, 0, 4],
        [null, 5, 0],
      ],
      solution: [
        ["A", "T", "#"],
        ["T", "E", "N"],
        [null, "N", "O"],
      ],
      clues: {
        Across: [
          [1, "Preposition of place"],
          [3, "One less than eleven"],
          [5, "Opposite of yes"],
        ],
        Down: [
          [1, "Preposition of place"],
          [2, "One less than eleven"],
          [4, "Opposite of yes"],
        ],
      },
    })
    expect(res).toContain("## Grid\n\nAT.\nTEN\n.NO")
    expect(res).toContain("A1. Preposition of place ~ AT")
    expect(res).toContain("A5. Opposite of yes ~ NO")
    expect(res).toContain("D4. Opposite of yes ~ NO")
  })

  it("respects custom block and empty characters", () => {
    const res = ipuzToXD({
      version: "http://ipuz.org/v2",
      kind: ["http://ipuz.org/crossword#1"],
      dimensions: { width: 3, height: 3 },
      block: "X",
      empty: "-",
      puzzle: [
        [1, 2, "X"],
        [3, "-", 4],
        [null, 5, "-"],
      ],
      solution: [
        ["A", "T", "X"],
        ["T", "E", "N"],
        [null, "N", "O"],
      ],
      clues: {
        Across: [
          [1, "Preposition of place"],
          [3, "One less than eleven"],
          [5, "Opposite of yes"],
        ],
        Down: [
          [1, "Preposition of place"],
          [2, "One less than eleven"],
          [4, "Opposite of yes"],
        ],
      },
    })
    expect(res).toContain("## Grid\n\nAT.\nTEN\n.NO")
  })

  it("strips the ipuz(...) JSONP wrapper", () => {
    const res = ipuzToXD(`ipuz(${wordSquareIpuz})`)
    expect(res).toContain("title: Word Square")
    expect(res).toContain("A1. Ace of spades, e.g. ~ CARD")
  })

  it("numbers bare-string clues from the grid", () => {
    const parsed = JSON.parse(wordSquareIpuz)
    parsed.puzzle = parsed.puzzle.map((row: unknown[]) => row.map(() => 0))
    parsed.clues = {
      Across: ["Ace of spades, e.g.", "Length times width, for a rectangle", "Back end of a car", "Pub projectile"],
      Down: ["It may be wild in poker", "Zone", "Hindmost part", "Small pointed missile"],
    }
    const res = ipuzToXD(parsed)
    expect(res).toContain("A1. Ace of spades, e.g. ~ CARD")
    expect(res).toContain("A7. Pub projectile ~ DART")
    expect(res).toContain("D4. Small pointed missile ~ DART")
  })

  it("supports object clues with explicit cells and enumerations", () => {
    const parsed = JSON.parse(kitchenSinkIpuz)
    parsed.clues = {
      Across: [
        { number: 1, clue: "Farm animal", cells: [[1, 1], [2, 1], [3, 1]], enumeration: "4" },
        [4, "Number of candles on a cake"],
        [5, "Dime's worth"],
      ],
      Down: [
        [1, "Greatest of all time"],
        [2, "Era"],
        [3, "Base of the decimal system"],
      ],
    }
    const res = ipuzToXD(parsed)
    expect(res).toContain("A1. Farm animal (4) ~ GOAT")
  })

  it("converts barred grids into form: barred plus a Design section", () => {
    const res = ipuzToXD({
      version: "http://ipuz.org/v2",
      kind: ["http://ipuz.org/crossword#1"],
      dimensions: { width: 3, height: 3 },
      puzzle: [
        [1, 0, 2],
        [0, { cell: 3, style: { barred: "TL" } }, 0],
        [4, 0, 0],
      ],
      solution: [
        ["B", "A", "T"],
        ["O", "N", "E"],
        ["G", "A", "P"],
      ],
      clues: {
        Across: [
          [1, "Flying mammal"],
          [3, "Not even two"],
          [4, "Hole in the fence"],
        ],
        Down: [
          [1, "Wetland"],
          [2, "Faucet, overseas"],
          [3, "Sodium, on the periodic table"],
        ],
      },
    })
    expect(res).toContain("form: barred")
    expect(res).toContain("A { bar-left: true; bar-top: true }")
    expect(res).toContain("A3. Not even two ~ NE")
    expect(res).toContain("D3. Sodium, on the periodic table ~ NA")
    expect(res).toContain("A1. Flying mammal ~ BAT")
    expect(res).toContain("D1. Wetland ~ BOG")
  })

  it("converts multi-value solutions into rebus-based Schrödinger squares", () => {
    const parsed = JSON.parse(kitchenSinkIpuz)
    // The bottom-right cell can be either N (TEN/TEN) or NT (TENT/TENT)
    parsed.solution[2][2] = ["N", "NT"]
    const res = ipuzToXD(parsed)
    expect(res).toContain("rebus: ❶=GO 1=N 1=NT")
    expect(res).toContain("## Grid\n\n❶AT\nAGE\nTE1")
    // Clue answers read as one coherent solution, using each square's first option
    expect(res).toContain("A5. Dime's worth ~ TEN")
    expect(res).toContain("D3. Base of the decimal system ~ TEN")

    const json = xdToJSON(res)
    expect(json.report.errors).toEqual([])
    const tile = json.tiles[2][2]
    expect(tile.type).toBe("schrodinger")
    if (tile.type === "schrodinger") expect(tile.validOptions).toEqual(["N", "NT"])
  })

  it("throws on non-crossword kinds", () => {
    const sudoku = { version: "http://ipuz.org/v2", kind: ["http://ipuz.org/sudoku#1"] }
    expect(() => ipuzToXD(sudoku)).toThrowError(/Only the ipuz crossword kind is supported/)
  })

  it("throws a useful error on invalid JSON", () => {
    expect(() => ipuzToXD("not json at all")).toThrowError(/not valid JSON/)
  })
})
