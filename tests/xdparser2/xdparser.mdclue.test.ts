import { xdParser } from "../../lib/xdparser2"
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
  "bodyMD": [
    [
      "bold",
      "Captain",
    ],
    [
      "text",
      " of the Pequod",
    ],
  ],
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
  "bodyMD": [
    [
      "italics",
      "Captain",
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
      " the Pequod",
    ],
  ],
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
  const newMDClue = "A1. [Captain](https://github.com/orta) *of* the ship /Pequod/ ~ AHAB"

  expect(xdParser(xd.replace(originalClue, newMDClue)).clues.across[0]).toMatchInlineSnapshot(`
{
  "answer": "AHAB",
  "body": "[Captain](https://github.com/orta) *of* the ship /Pequod/",
  "bodyMD": [
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
  ],
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

it("handles strikes", () => {
  const xd = readFileSync("tests/xdparser2/inputs/alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. ~Captain~ of the Pequod ~ AHAB"

  expect(xdParser(xd.replace(originalClue, newMDClue)).clues.across[0]).toMatchInlineSnapshot(`
{
  "answer": "AHAB",
  "body": "~Captain~ of the Pequod",
  "bodyMD": [
    [
      "strike",
      "Captain",
    ],
    [
      "text",
      " of the Pequod",
    ],
  ],
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
