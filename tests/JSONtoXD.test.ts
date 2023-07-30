import { JSONToXD } from "../lib/JSONtoXD"
import { xdToJSON } from "../"

const xd = `
## Metadata\n\n
Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16
SplitCharacter: |

## Grid\n\n
OKGO
H##B
O##J
H##E
O##C
H##T

## Clues\n\n
A1. Band with two words. ~ OK|GO

D1. Reverse santa. ~ OH|OH|OH
D2. A thing. ~ OBJECT
`

it("parses splitCharacter correctly", () => {
  const json = xdToJSON(xd)
  const newXD = JSONToXD(json)
  expect(newXD).toMatchInlineSnapshot(`
"## Metadata

title: Square
author: Orta
date: 2021-03-16
editor: Orta Therox
splitcharacter: |

## Grid

OKGO
H..B
O..J
H..E
O..C
H..T

## Clues

A1. Band with two words. ~ OK|GO

D1. Reverse santa. ~ OH|OH|OH
D2. A thing. ~ OBJECT"
`)
})

it("handles clue meta lines well", () => {
  const xd = `
## Meta

Title: Square
Author: Orta
Editor: Orta Therox
Date: 2021-03-16


## Grid

BULB
OK#O
L##O
DESK


## Clues

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
D3 ^Hint: Registering with a restaurant. `
  const json = xdToJSON(xd)
  const newXD = JSONToXD(json)
  expect(newXD).toMatchInlineSnapshot(`
"## Metadata

title: Square
author: Orta
date: 2021-03-16
editor: Orta Therox

## Grid

BULB
OK.O
L..O
DESK

## Clues

A1. Gardener's concern. ~ BULB
A1 ^hint: Turned on with a flick.

A4. A reasonable statement. ~ OK
A4 ^hint: All __.

A5. The office centerpiece. ~ DESK
A5 ^hint: Fried.


D1. To _ly go. ~ BOLD
D1 ^hint: When you want to make some text stronger.

D2. Bigger than britain. ~ UK
D2 ^hint: A union which left europe.

D3. A conscious tree. ~ BOOK
D3 ^hint: Registering with a restaurant.
"
`)
})

it("handles design section with more than one element", () => {
  const json = xdToJSON(xd)
  json.design = {
    styles: {
      A: {
        background: "circle",
      },
      B: {
        background: "dot",
      },
    },
    positions: [],
  }
  const newXD = JSONToXD(json)
  expect(newXD.split("## Design")[1].trim()).toMatchInlineSnapshot(`
"<style>
A { background: circle } 
B { background: dot } 
</style>"
`)
})
