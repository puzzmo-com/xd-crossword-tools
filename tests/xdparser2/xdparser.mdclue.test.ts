import { inlineMarkdownParser, xdParser } from "../../lib/xdparser2"
import { readFileSync } from "fs"

it("handles bolding", () => {
  const xd = readFileSync("tests/xdparser2/inputs/alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. *Captain* of the Pequod ~ AHAB"

  const json = xdParser(xd.replace(originalClue, newMDClue))
  const clue = json.clues.across[0]
  expect(clue).toMatchInlineSnapshot(`
{
  "answer": "AHAB",
  "body": "*Captain* of the Pequod",
  "metadata": undefined,
  "number": 1,
  "position": {
    "col": 0,
    "index": 0,
  },
  "tiles": [
    {
      "letter": "A",
      "type": "letter",
    },
    {
      "letter": "H",
      "type": "letter",
    },
    {
      "letter": "A",
      "type": "letter",
    },
    {
      "letter": "B",
      "type": "letter",
    },
  ],
}
`)
})

it("handles italics and bolds", () => {
  const xd = readFileSync("tests/xdparser2/inputs/alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. /Captain/ *of* the Pequod ~ AHAB"

  expect(xdParser(xd.replace(originalClue, newMDClue)).clues.across[0]).toMatchInlineSnapshot(`
{
  "answer": "AHAB",
  "body": "/Captain/ *of* the Pequod",
  "metadata": undefined,
  "number": 1,
  "position": {
    "col": 0,
    "index": 0,
  },
  "tiles": [
    {
      "letter": "A",
      "type": "letter",
    },
    {
      "letter": "H",
      "type": "letter",
    },
    {
      "letter": "A",
      "type": "letter",
    },
    {
      "letter": "B",
      "type": "letter",
    },
  ],
}
`)
})

it("handles URLs", () => {
  const xd = readFileSync("tests/xdparser2/inputs/alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. [Captain](https://github.com/orta) **of** the ship /Pequod/ ~ AHAB"

  expect(xdParser(xd.replace(originalClue, newMDClue)).clues.across[0].bodyMD).toMatchInlineSnapshot(`
[
  [
    "link",
    "Captain",
    "https://github.com/orta",
  ],
  [
    "text",
    " ",
  ],
  [
    "bold",
    "of",
  ],
  [
    "text",
    " the ship ",
  ],
  [
    "italics",
    "Pequod",
  ],
]
`)
})

it("handles having a date with italics", () => {
  const xd = readFileSync("tests/xdparser2/inputs/alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  // Should NOT be italics
  const newMDClue = "A1. The date of 2024/11/12 ~ AHAB"
  const md= xdParser( xd.replace(originalClue, newMDClue)).clues.across[0].bodyMD
  expect(md).toMatchInlineSnapshot(`undefined`)
})

it("handles strikes", () => {
  const xd = readFileSync("tests/xdparser2/inputs/alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. ~Captain~ of the Pequod ~ AHAB"

  expect(xdParser(xd.replace(originalClue, newMDClue)).clues.across[0].bodyMD).toMatchInlineSnapshot(`
[
  [
    "strike",
    "Captain",
  ],
  [
    "text",
    " of the Pequod",
  ],
]
`)
})


it("does the bolding", () => {
  const parsed = inlineMarkdownParser("**ORTA**")
  expect(parsed).toMatchInlineSnapshot(`
[
  [
    "bold",
    "ORTA",
  ],
]
`)
})


it("handles a backslash", () => {
  const parsed = inlineMarkdownParser("hi \\**JSON\\**")
  expect(parsed).toMatchInlineSnapshot(`
[
  [
    "text",
    "hi **JSON**",
  ],
]
`)
})

it("handles a date", () => {
  const newMDClue = "A1. The date of 2024/11/12"
  const parsed = inlineMarkdownParser(newMDClue)
  expect(parsed).toMatchInlineSnapshot(`
[
  [
    "text",
    "A1. The date of 2024/11/12",
  ],
]
`)

})