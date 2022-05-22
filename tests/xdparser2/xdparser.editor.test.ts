import { xdParser } from "../../lib/xdparser2"
import { readFileSync } from "fs"

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
  expect(json.editorInfo).toMatchInlineSnapshot(`
{
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
