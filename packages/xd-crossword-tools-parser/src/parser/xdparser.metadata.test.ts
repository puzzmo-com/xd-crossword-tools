import { xdToJSON } from "./xdparser2"

it("handles double clues", () => {
  const xd = `
Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16


BULB
OK#O
L##O
DESK


A1. Gardener's concern. ~ BULB
A1 ^Hint: Turned on with a flick.
A4. A reasonable statement. ~ OK
A4 ^Hint: All __.
A5. The office centerpiece. ~ DESK
A5 ^Hint: Fried.

D1. To _ly go. ~ BOLD
D1 ^Hint: When you want to make some text stronger.
D2. Bigger than britain. ~ UK
D2 ^Hint: A union which left europe.
D3. A conscious tree. ~ BOOK
D3 ^Hint: Registering with a restaurant. 
`

  const { clues } = xdToJSON(xd)
  const allClues = [...clues.across, ...clues.down]
  const focused = allClues.map((c) => ({ first: c.body, meta: c.metadata }))
  expect(focused).toMatchInlineSnapshot(`
    [
      {
        "first": "Gardener's concern.",
        "meta": {
          "hint": "Turned on with a flick.",
          "hint:display": [
            [
              "text",
              "Turned on with a flick.",
            ],
          ],
        },
      },
      {
        "first": "A reasonable statement.",
        "meta": {
          "hint": "All __.",
          "hint:display": [
            [
              "text",
              "All __.",
            ],
          ],
        },
      },
      {
        "first": "The office centerpiece.",
        "meta": {
          "hint": "Fried.",
          "hint:display": [
            [
              "text",
              "Fried.",
            ],
          ],
        },
      },
      {
        "first": "To _ly go.",
        "meta": {
          "hint": "When you want to make some text stronger.",
          "hint:display": [
            [
              "text",
              "When you want to make some text stronger.",
            ],
          ],
        },
      },
      {
        "first": "Bigger than britain.",
        "meta": {
          "hint": "A union which left europe.",
          "hint:display": [
            [
              "text",
              "A union which left europe.",
            ],
          ],
        },
      },
      {
        "first": "A conscious tree.",
        "meta": {
          "hint": "Registering with a restaurant.",
          "hint:display": [
            [
              "text",
              "Registering with a restaurant.",
            ],
          ],
        },
      },
    ]
  `)
})

it("handles a bunch of random chars", () => {
  const xd = `
Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16


BULB
OK#O
L##O
DESK


A1. Gardener's concern. ~ BULB
A1 ^Hint: Turned: on with a flick.

D1. To _ly go. ~ BOLD
D1 ^Hint: When you want to make some text stronger.
  `

  const { clues } = xdToJSON(xd)
  const allClues = [...clues.across, ...clues.down]
  const focused = allClues.map((c) => ({ first: c.body, meta: c.metadata }))

  expect(focused).toMatchInlineSnapshot(`
    [
      {
        "first": "Gardener's concern.",
        "meta": {
          "hint": "Turned: on with a flick.",
          "hint:display": [
            [
              "text",
              "Turned: on with a flick.",
            ],
          ],
        },
      },
      {
        "first": "To _ly go.",
        "meta": {
          "hint": "When you want to make some text stronger.",
          "hint:display": [
            [
              "text",
              "When you want to make some text stronger.",
            ],
          ],
        },
      },
    ]
  `)
})

it("processes hint and revealer metadata through markup processor", () => {
  const xd = `
Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16


BULB
OK#O
L##O
DESK


A1. Gardener's concern. ~ BULB
A1 ^Hint: {*Bold*} text with {/italic/} formatting.
A1 ^Revealer: This clue reveals {_underline_} information.

D1. To _ly go. ~ BOLD
D1 ^Hint: {@Link text|http://example.com@} and {#colored|ff0000|00ff00#}.
`

  const { clues } = xdToJSON(xd)
  const allClues = [...clues.across, ...clues.down]
  const focused = allClues.map((c) => ({ 
    body: c.body, 
    hint: c.metadata?.hint,
    hintDisplay: c.metadata?.['hint:display'],
    revealer: c.metadata?.revealer,
    revealerDisplay: c.metadata?.['revealer:display']
  }))
  
  expect(focused).toMatchInlineSnapshot(`
[
  {
    "body": "Gardener's concern.",
    "hint": "{*Bold*} text with {/italic/} formatting.",
    "hintDisplay": [
      [
        "bold",
        "Bold",
      ],
      [
        "text",
        " text with ",
      ],
      [
        "italics",
        "italic",
      ],
      [
        "text",
        " formatting.",
      ],
    ],
    "revealer": "This clue reveals {_underline_} information.",
    "revealerDisplay": [
      [
        "text",
        "This clue reveals ",
      ],
      [
        "underscore",
        "underline",
      ],
      [
        "text",
        " information.",
      ],
    ],
  },
  {
    "body": "To _ly go.",
    "hint": "{@Link text|http://example.com@} and {#colored|ff0000|00ff00#}.",
    "hintDisplay": [
      [
        "link",
        "Link text",
        "http://example.com",
      ],
      [
        "text",
        " and ",
      ],
      [
        "color",
        "colored",
        "ff0000",
        "00ff00",
      ],
      [
        "text",
        ".",
      ],
    ],
    "revealer": undefined,
    "revealerDisplay": undefined,
  },
]
`)
})
