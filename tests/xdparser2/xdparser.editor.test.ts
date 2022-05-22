import { xdParser } from "../../lib/xdparser2"
import { readFileSync } from "fs"
import { editorInfoAtCursor } from "../../lib/editorInfoAtCursor"

it("does not work on implicit files", () => {
  const xd = readFileSync("tests/xdparser2/inputs/alpha-bits.xd", "utf8")

  let failed = false
  try {
    xdParser(xd, false, true)
  } catch (error) {
    failed = true
  }
  expect(failed).toBeTruthy()
})

it("shows info", () => {
  const xd = readFileSync("tests/xdparser2/outputs/explicit-alpha-bits.xd", "utf8")
  const json = xdParser(xd, false, true)

  expect(json.editorInfo!.lines.length).toBeGreaterThan(1)
  json.editorInfo!.lines = ["..."]
  expect(json.editorInfo).toMatchInlineSnapshot(`
{
  "lines": [
    "...",
  ],
  "sections": [
    {
      "endLine": 6,
      "startLine": 0,
      "type": "metadata",
    },
    {
      "endLine": 24,
      "startLine": 7,
      "type": "grid",
    },
    {
      "endLine": 117,
      "startLine": 25,
      "type": "clues",
    },
  ],
}
`)
})

it("gets results I'd like to see thanks", () => {
  const xd = readFileSync("tests/xdparser2/outputs/explicit-alpha-bits.xd", "utf8")
  const json = xdParser(xd, false, true)

  const get = editorInfoAtCursor(json)

  // top left, noop
  expect(get(0, 0)).toEqual({ type: "noop" })

  // We're in the grid section but not in the grid
  expect(get(8, 0)).toEqual({ type: "noop" })

  // The grid starts at line 9
  expect(get(9, 0)).toEqual({ type: "grid", position: { col: 0, index: 0 } })
  // Down 1. across 2
  expect(get(10, 2)).toEqual({ type: "grid", position: { col: 2, index: 1 } })
  // Down a while, across 1
  expect(get(23, 3)).toEqual({ type: "grid", position: { col: 3, index: 14 } })

  // The clues section header
  expect(get(25, 3)).toEqual({ type: "noop" })
  // First across clue
  expect(get(27, 3)).toEqual({ type: "clue", direction: "across", number: 1 })
  // First across clue
  expect(get(28, 1)).toEqual({ type: "clue", direction: "across", number: 5 })
})
