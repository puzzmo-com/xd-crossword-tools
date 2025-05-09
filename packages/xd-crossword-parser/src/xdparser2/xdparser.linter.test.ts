import { xdToJSON } from "../xdparser2"
import { readFileSync } from "fs"

it("lints for words being included in the answer", () => {
  const xd = readFileSync("./packages/xd-crossword-tools/tests/puz/alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. ahab of the Pequod ~ AHAB"

  const json = xdToJSON(xd.replace(originalClue, newMDClue), true, true)

  expect(json.report.success).toBeTruthy()
  expect(json.report.warnings).toMatchInlineSnapshot(`[]`)
})

it("lints to note that you should have a colon in the hint for multi-word answers", () => {
  const xd = readFileSync("./packages/xd-crossword-tools/tests/puz/alpha-bits.xd", "utf8")

  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. Captain of the Pequod ~ AH|AB\nA1 ^Hint: Turned on to illuminate a room."

  const originalMeta = "Description: N/A"
  const newMeta = "Description: N/A\nsplitcharacter: |"

  const json = xdToJSON(xd.replace(originalClue, newMDClue).replace(originalMeta, newMeta), true, true)

  expect(json.report.success).toBeTruthy()
  expect(json.report.warnings).toMatchInlineSnapshot(`[]`)
})
