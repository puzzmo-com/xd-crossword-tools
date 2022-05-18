import { readdirSync, readFileSync } from "fs"
import { JSONToXD } from "../lib/JSONtoXD"
import { xdToJSON } from "../lib/xdToJSON"

it("parses splitCharacter correctly", () => {
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

D1. Reverse santa. ~ OH|OHO|H
D2. A thing. ~ OBJECT"
`)
})
