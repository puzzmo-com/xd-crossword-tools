import { xdParser } from "../../lib/xdparser2"
import { readFileSync } from "fs"

it("lints for words being included in the answer", () => {
  const xd = readFileSync("tests/xdparser2/outputs/explicit-alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. ahab of the Pequod ~ AHAB"

  const json = xdParser(xd.replace(originalClue, newMDClue), true, true)

  expect(json.report.success).toBeTruthy()
  expect(json.report.warnings).toMatchInlineSnapshot(`
[
  {
    "clueNum": 1,
    "clueType": "across",
    "length": -1,
    "message": "A1 has an answer word 'ahab' which is in the clue",
    "position": {
      "col": 0,
      "index": 27,
    },
    "type": "clue_msg",
  },
]
`)
})

it("lints to note that you should have a colon in the hint for multi-word answers", () => {
  const xd = readFileSync("tests/xdparser2/outputs/explicit-alpha-bits.xd", "utf8")

  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. Captain of the Pequod ~ AH|AB\nA1 ^Hint: Turned on to illuminate a room."

  const originalMeta = "Description: N/A"
  const newMeta = "Description: N/A\nsplitcharacter: |"

  const json = xdParser(xd.replace(originalClue, newMDClue).replace(originalMeta, newMeta), true, true)

  expect(json.report.success).toBeTruthy()
  expect(json.report.warnings).toMatchInlineSnapshot(`
[
  {
    "clueNum": 1,
    "clueType": "across",
    "length": -1,
    "message": "A1 answer has multiple words, but the hint doesn't have a : in it (e.g. : Abbr., : Hyph., : 2 wds. , etc)",
    "position": {
      "col": 0,
      "index": 28,
    },
    "type": "clue_msg",
  },
]
`)
})
