import { readFileSync } from "fs"
import { join } from "path"
import { isGridSolved, xdToJSON } from "xd-crossword-tools-parser"
import { JSONToXD } from "../src/JSONtoXD"

const xd = readFileSync(join(__dirname, "v4/rebus-rules.xd"), "utf8")

describe("xd v4 rebus rules", () => {
  it("round-trips options, linked cells and empty cells through JSON and back", () => {
    const json = xdToJSON(xd, true)
    expect(json.report.errors).toEqual([])
    expect(json.report.warnings).toEqual([])
    // JSONToXD only ends with a newline when the last section is a design
    expect(JSONToXD(json)).toEqual(xd.trimEnd())

    const reparsed = xdToJSON(JSONToXD(json))
    expect(reparsed.tiles).toEqual(json.tiles)
    expect(reparsed.clues).toEqual(json.clues)
  })

  it("gives each cell its options, with the solution first", () => {
    const { tiles } = xdToJSON(xd)

    // A reading per direction: PH across, F down
    expect(tiles[0][2]).toMatchObject({ type: "schrodinger", symbol: "1", validOptions: ["PH", "F"] })
    expect(tiles[0][2]).not.toHaveProperty("linked")

    // Linked cells keep every option's segment, so their positions line up
    expect(tiles[1][1]).toMatchObject({ type: "schrodinger", symbol: "3", validOptions: ["A", "O"], linked: "34" })
    expect(tiles[1][2]).toMatchObject({ type: "schrodinger", symbol: "4", validOptions: ["R", "R"], validLetters: ["R"], linked: "34" })

    // '()' is a cell which is correct when left empty
    expect(tiles[2][3]).toMatchObject({ type: "schrodinger", symbol: "2", validOptions: ["S", ""], validLetters: ["S"], validRebuses: [] })
  })

  it("reads the answers which go through those cells", () => {
    const { clues } = xdToJSON(xd)
    const answers = (dir: "across" | "down", num: number) => clues[dir].find((c) => c.number === num)!.answers.map((a) => a.answer)

    expect(answers("across", 1)).toEqual(["ALPHA"])
    expect(answers("across", 5)).toEqual(["CARD", "CORD"])
    expect(answers("across", 6)).toEqual(["EGOS", "EGO"])
    expect(answers("down", 3)).toEqual(["FRO"])
  })

  it("checks a solve using the rules, not the answers", () => {
    const { tiles } = xdToJSON(xd)
    const grid = (rows: string[][]) => isGridSolved(tiles, rows)

    expect(grid([["A", "L", "PH", "A"], ["C", "A", "R", "D"], ["E", "G", "O", "S"]])).toBe(true)
    // The other options work too
    expect(grid([["A", "L", "F", "A"], ["C", "O", "R", "D"], ["E", "G", "O", ""]])).toBe(true)
    // But not something which isn't an option
    expect(grid([["A", "L", "P", "A"], ["C", "A", "R", "D"], ["E", "G", "O", "S"]])).toBe(false)
    // Or a wrong letter
    expect(grid([["A", "L", "PH", "A"], ["C", "A", "R", "T"], ["E", "G", "O", "S"]])).toBe(false)
  })
})
