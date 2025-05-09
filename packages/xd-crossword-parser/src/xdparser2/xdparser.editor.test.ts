import { xdToJSON } from "../xdparser2"
import { readFileSync } from "fs"

it("does not work on implicit files", () => {
  const xd = readFileSync("./packages/xd-crossword-parser/src/xdparser2/inputs/alpha-bits.xd", "utf8")

  let failed = false
  try {
    xdToJSON(xd, false, true)
  } catch (error) {
    failed = true
  }
  expect(failed).toBeTruthy()
})

it("shows info", () => {
  const xd = readFileSync("./packages/xd-crossword-tools/tests/puz/alpha-bits.xd", "utf8")
  const json = xdToJSON(xd, false, true)

  expect(json.editorInfo!.lines.length).toBeGreaterThan(1)
  json.editorInfo!.lines = ["..."]
  expect(json.editorInfo).toMatchInlineSnapshot(`
    {
      "lines": [
        "...",
      ],
      "sections": [
        {
          "endLine": 8,
          "startLine": 0,
          "type": "metadata",
        },
        {
          "endLine": 26,
          "startLine": 9,
          "type": "grid",
        },
        {
          "endLine": 118,
          "startLine": 27,
          "type": "clues",
        },
      ],
    }
  `)
})

it("shows info for more", () => {
  const xd = readFileSync("./packages/xd-crossword-tools/tests/puz/alpha-bits.xd", "utf8")
  const json = xdToJSON(xd, false, true)

  expect(json.editorInfo!.lines.length).toBeGreaterThan(1)
  json.editorInfo!.lines = ["..."]
  expect(json.editorInfo).toMatchInlineSnapshot(`
    {
      "lines": [
        "...",
      ],
      "sections": [
        {
          "endLine": 8,
          "startLine": 0,
          "type": "metadata",
        },
        {
          "endLine": 26,
          "startLine": 9,
          "type": "grid",
        },
        {
          "endLine": 118,
          "startLine": 27,
          "type": "clues",
        },
      ],
    }
  `)
})
