import { xdToJSON } from "../xdparser2"

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
    },
  },
  {
    "first": "A reasonable statement.",
    "meta": {
      "hint": "All __.",
    },
  },
  {
    "first": "The office centerpiece.",
    "meta": {
      "hint": "Fried.",
    },
  },
  {
    "first": "To _ly go.",
    "meta": {
      "hint": "When you want to make some text stronger.",
    },
  },
  {
    "first": "Bigger than britain.",
    "meta": {
      "hint": "A union which left europe.",
    },
  },
  {
    "first": "A conscious tree.",
    "meta": {
      "hint": "Registering with a restaurant.",
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
    },
  },
  {
    "first": "To _ly go.",
    "meta": {
      "hint": "When you want to make some text stronger.",
    },
  },
]
`)
})
