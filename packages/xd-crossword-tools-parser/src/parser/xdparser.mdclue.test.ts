import { xdMarkupProcessor, xdToJSON } from "./xdparser2"
import { readFileSync } from "fs"
import { it, expect } from "vitest"

it("handles bolding", () => {
  const xd = readFileSync("./packages/xd-crossword-tools-parser/src/parser/outputs/explicit-alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. {/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here|https://mylink.com@} ~ AHAB"

  const json = xdToJSON(xd.replace(originalClue, newMDClue))
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

it("handles inline images", () => {
  const xd = readFileSync("./packages/xd-crossword-tools-parser/src/parser/outputs/explicit-alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. {!![https://emojipedia.org/image/y.png|alt text]!} block with alt text ~ AHAB"

  const json = xdToJSON(xd.replace(originalClue, newMDClue))
  const clue = json.clues.across[0]
  expect(clue).toMatchInlineSnapshot(`
    {
      "answer": "AHAB",
      "body": "{!![https://emojipedia.org/image/y.png|alt text]!} block with alt text",
      "direction": "across",
      "display": [
        [
          "img",
          "https://emojipedia.org/image/y.png",
          "alt text",
          true,
        ],
        [
          "text",
          " block with alt text",
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

it("correctly inline images in markup", () => {
  const newMDClue = "{![https://emojipedia.org/image/y.png|alt text]!}"

  const parsed = xdMarkupProcessor(newMDClue)
  expect(parsed).toMatchInlineSnapshot(`
    [
      [
        "img",
        "https://emojipedia.org/image/y.png",
        "alt text",
        false,
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

it("correctly handles inline colors", () => {
  const newMDClue = "This text is {#red|#ff0000|#cc0000#} and this is {#blue|#0000ff|#0000cc#}"
  const parsed = xdMarkupProcessor(newMDClue)
  expect(parsed).toMatchInlineSnapshot(`
[
  [
    "text",
    "This text is ",
  ],
  [
    "color",
    "red",
    "#ff0000",
    "#cc0000",
  ],
  [
    "text",
    " and this is ",
  ],
  [
    "color",
    "blue",
    "#0000ff",
    "#0000cc",
  ],
]
`)
})

it("handles malformed color syntax gracefully", () => {
  const newMDClue = "This {#malformed#} color will be treated as text"
  const parsed = xdMarkupProcessor(newMDClue)
  expect(parsed).toMatchInlineSnapshot(`
[
  [
    "text",
    "This ",
  ],
  [
    "text",
    "{#malformed#}",
  ],
  [
    "text",
    " color will be treated as text",
  ],
]
`)
})
