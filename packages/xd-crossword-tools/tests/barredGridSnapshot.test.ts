import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import parse from "xml-parser"

import { xdToJSON } from "xd-crossword-tools-parser/src"
import { printBarredGrid, addBarsToTiles } from "../src/printBarredGrid"
import { BarPosition } from "../src/deriveBarPositions"
import { jpzToXD } from "../src/jpzToXD"

describe("barred grid snapshot", () => {
  it("should convert JPZ to JSON and visualize with bars", () => {
    const jpzContent = readFileSync(__dirname + "/jpz/Printer-Devilry-kyle-dolan.jpz", "utf-8")

    // Parse JPZ directly to extract grid and bars
    const parsed = jpzToXD(jpzContent)
    expect(parsed).toMatchInlineSnapshot(`
      "## Metadata

title: Beneath The Surface Printer&#039;s Devilry #4 (Midi)
author: Kyle Dolan
editor: 
date: 
copyright: © 2023 Kyle Dolan
form: barred

## Grid

SIGNPOST
UNICORNS
NCNARROW
DAUNTUWE
EYPTENOR
RODENTLV
SLEETIDE
COUNTESS

## Clues

A1. For dorm room wall, deer art is a popular choice (8) ~ SIGNPOST
A6. Playing an investment game in Economics class, was lots offered the market? (7) ~ UNICORN
A9. As flight can be used to describe principles of classical mechanics (6) ~ NARROW
A10. The reunion included grandparents, uncle, sans cousins and other extended family (5) ~ DAUNT
A13. The butcher shop was known for its famous sausages, for which they sold special extra-long buns (5) ~ TENOR
A15. The oral surgeon who removed my wisdom teeth was a pal. Insurance covered the whole thing! (6) ~ RODENT
A16. As commander of the flight, in having the most spacious cabin (3,4) ~ LEETIDE
A17. With the term paper due date approaching, the lazy student tried to buy ad--I say!--off the Internet (8) ~ COUNTESS

D1. The old couple knew each other so well that they had formed a Wordle standing between themselves (7) ~ SUNDERS
D2. For puzzle lovers, a good crossword is like brandy (4) ~ INCA
D3. Loon setting up your user name and password to verify your account... (3,2) ~ GINUP
D4. ...if you need tech, super. Your email? (7) ~ PORTENT
D5. Our catcher isn&#039;t playing today--hermit there to be found (4) ~ SNOW
D7. The bouncer didn&#039;t bother. Toss ID--she knew right away it was fake (7) ~ CANTEEN
D8. Question: What items of clothing are typically worn by professional billiards players? Ants (7) ~ SWERVES
D11. A lover offs Will, often use them as conversation starters at parties (5) ~ UNTIE
D12. I&#039;ll have a turkey sandwich with Swiss cheese, mats of bacon, and tomatoes (4) ~ YOLO
D14. A cake like daiginjo pairs well with sushi (4) ~ OLDS"
    `)

    const xdJSON = xdToJSON(parsed)

    // Extract bars from JPZ directly
    const jpzParsed = parse(jpzContent)
    const rectangularPuzzle = jpzParsed.root.children.find((child: { name: string }) => child.name === "rectangular-puzzle")
    const crosswordEl = rectangularPuzzle!.children.find((child: { name: string }) => child.name === "crossword")
    const gridEl = crosswordEl!.children.find((child: { name: string }) => child.name === "grid")!

    const bars: BarPosition[] = []
    for (const cell of gridEl.children) {
      if (cell.name !== "cell") continue
      const x = parseInt(cell.attributes.x, 10) - 1
      const y = parseInt(cell.attributes.y, 10) - 1

      if (cell.attributes["left-bar"] === "true") bars.push({ row: y, col: x, type: "left" })
      if (cell.attributes["right-bar"] === "true") bars.push({ row: y, col: x, type: "right" })
      if (cell.attributes["top-bar"] === "true") bars.push({ row: y, col: x, type: "top" })
      if (cell.attributes["bottom-bar"] === "true") bars.push({ row: y, col: x, type: "bottom" })
    }

    // Add bars to tiles
    const tilesWithBars = addBarsToTiles(xdJSON.tiles, bars)

    // Snapshot based on data from the JPZ xml
    expect("\n" + printBarredGrid(tilesWithBars)).toMatchInlineSnapshot(`
      "
      S   I   G   N   P   O   S   T
                ╶───╴   ╶───╴   ┌───
      U   N   I   C   O   R   N │ S
        ╷   ╷           ╶───╴   ╵   
      N │ C │ N   A   R   R   O   W
        ╵   ╵           ┌───┐   ╷   
      D   A   U   N   T │ U │ W │ E
        ┌───┐   ╷       ╵   └───┘   
      E │ Y │ P │ T   E   N   O   R
        ╵   └───┘           ╷   ╷   
      R   O   D   E   N   T │ L │ V
        ╷   ╶───╴           ╵   ╵   
      S │ L   E   E   T   I   D   E
      ──┘   ╶───╴   ╶───╴           
      C   O   U   N   T   E   S   S"
    `)

    // Snapshot based on the derived barred grid
    expect("\n" + printBarredGrid(xdJSON.tiles)).toMatchInlineSnapshot(`
      "
      S   I   G   N   P   O   S   T
                ╶───╴   ╶───╴   ┌───
      U   N   I   C   O   R   N │ S
        ╷   ╷           ╶───╴   ╵   
      N │ C │ N   A   R   R   O   W
        ╵   ╵           ┌───┐   ╷   
      D   A   U   N   T │ U │ W │ E
        ┌───┐   ╷       ╵   └───┘   
      E │ Y │ P │ T   E   N   O   R
        ╵   └───┘           ╷   ╷   
      R   O   D   E   N   T │ L │ V
        ╷   ╶───╴           ╵   ╵   
      S │ L   E   E   T   I   D   E
      ──┘   ╶───╴   ╶───╴           
      C   O   U   N   T   E   S   S"
    `)

    expect(printBarredGrid(xdJSON.tiles)).toEqual(printBarredGrid(tilesWithBars))
  })
})

it("looks at a different jpz file which has a mix of pipes and blocks", () => {
  const jpzBarredContent = readFileSync(__dirname + "/jpz/lil-167-ratliff-121823.jpz", "utf-8")
  const xd = jpzToXD(jpzBarredContent)
  const xdJSON = xdToJSON(xd)

  expect("\n" + printBarredGrid(xdJSON.tiles)).toMatchInlineSnapshot(`
  "
  I   H   O   P       S   T   A   I   N    
                                            
  N   O   T   I       N   U   D   G   E   S
                            ╷               
  C   O   R   N   C   O   B │ D   O   W   N
                            ╵               
  A   D   O   B   O               T   S   O
                                            
              A   I   M       B   Y   O   B
                    ╷                       
      H   A   L   F │ D   R   E   A   M    
                    ╵                       
  W   A   L   L       S   U   B            
                                            
  A   L   E               D   R   A   F   T
                ╷                           
  W   A   R   P │ C   L   E   A   N   E   R
                ╵                           
  A   L   T   E   R   S       V   E   T   O
                                            
          S   P   U   D       E   W   A   N"
`)
})
