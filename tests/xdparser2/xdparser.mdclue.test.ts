import { xdMarkupProcessor, xdParser } from "../../lib/xdparser2"
import { readFileSync } from "fs"

it("handles bolding", () => {
  const xd = readFileSync("tests/xdparser2/inputs/alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. {/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here|https://mylink.com@} ~ AHAB"

  const json = xdParser(xd.replace(originalClue, newMDClue))
  const clue = json.clues.across[0]
  expect(clue).toMatchInlineSnapshot(`
{
  "answer": "AHAB",
  "body": "{/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here|https://mylink.com@}",
  "direction": "across",
  "display": [
    [
      "italics",
      "Captain",
    ],
    [
      "text",
      ", ",
    ],
    [
      "bold",
      "of",
    ],
    [
      "text",
      ", ",
    ],
    [
      "underscore",
      "the",
    ],
    [
      "text",
      ", ship ",
    ],
    [
      "strike",
      "pequod",
    ],
    [
      "text",
      " ",
    ],
    [
      "link",
      "see here",
      "https://mylink.com",
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

it("correctly handles xd-spec syntax", () => {
  const newMDClue = "{/Italic/}, {_bold_}, {_underscore_}, or {-strike-thru-}"
  const parsed = xdMarkupProcessor(newMDClue)
  expect(parsed).toMatchInlineSnapshot(`
[
  [
    "italics",
    "Italic",
  ],
  [
    "text",
    ", ",
  ],
  [
    "underscore",
    "bold",
  ],
  [
    "text",
    ", ",
  ],
  [
    "underscore",
    "underscore",
  ],
  [
    "text",
    ", or ",
  ],
  [
    "strike",
    "strike-thru",
  ],
]
`)
})

it("correctly handles a URL", () => {
  const newMDClue = "I think {@you should read|https://github.com@} more"
  const parsed = xdMarkupProcessor(newMDClue)
  expect(parsed).toMatchInlineSnapshot(`
[
  [
    "text",
    "I think ",
  ],
  [
    "link",
    "you should read",
    "https://github.com",
  ],
  [
    "text",
    " more",
  ],
]
`)
})

it("correctly handles ~ for strike also", () => {
  const newMDClue = "I {~think~}, no.. I know"
  const parsed = xdMarkupProcessor(newMDClue)
  expect(parsed).toMatchInlineSnapshot(`
[
  [
    "text",
    "I ",
  ],
  [
    "strike",
    "think",
  ],
  [
    "text",
    ", no.. I know",
  ],
]
`)
})
