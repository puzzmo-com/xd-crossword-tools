import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import parse from "xml-parser"

import { xdToJSON } from "xd-crossword-tools-parser/src"
import { printBarredGrid, addBarsToTiles } from "../src/printBarredGrid"
import { BarPosition } from "../src/printBarredGrid"
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
      D14. A cake like daiginjo pairs well with sushi (4) ~ OLDS

      ## Design

      <style>
      A { bar-top: true }
      B { bar-left: true }
      C { bar-left: true; bar-top: true }
      </style>

      ........
      ...A.A.C
      .BB..A..
      .....CBB
      .CBB..A.
      ..A...BB
      .BA.....
      A.A.A...
      "
    `)

    const xdJSON = xdToJSON(parsed)

    // Extract bars from JPZ directly
    const jpzParsed = parse(jpzContent)
    const rectangularPuzzle = jpzParsed.root.children.find((child: { name: string }) => child.name === "rectangular-puzzle")
    const crosswordEl = rectangularPuzzle!.children.find((child: { name: string }) => child.name === "crossword")
    const gridEl = crosswordEl!.children.find((child: { name: string }) => child.name === "grid")!

    const bars: BarPosition[] = []
    const gridWidth = parseInt(gridEl.attributes.width, 10)
    const gridHeight = parseInt(gridEl.attributes.height, 10)

    for (const cell of gridEl.children) {
      if (cell.name !== "cell") continue
      const x = parseInt(cell.attributes.x, 10) - 1
      const y = parseInt(cell.attributes.y, 10) - 1

      if (cell.attributes["left-bar"] === "true") bars.push({ row: y, col: x, type: "left" })
      if (cell.attributes["top-bar"] === "true") bars.push({ row: y, col: x, type: "top" })

      // Convert right-bar and bottom-bar to left-bar and top-bar on adjacent cells
      if (cell.attributes["right-bar"] === "true" && x < gridWidth - 1) {
        bars.push({ row: y, col: x + 1, type: "left" })
      }
      if (cell.attributes["bottom-bar"] === "true" && y < gridHeight - 1) {
        bars.push({ row: y + 1, col: x, type: "top" })
      }
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

    // Snapshot based on the barred grid from design data
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

  expect(xd).toMatchInlineSnapshot(`
    "## Metadata

    title: December 18, 2023 - "Pipelines" - Darby Ratliff, edited by Will Eisenberg
    author: Darby Ratliff
    editor: Will Eisenberg
    date: 2023-11-10
    copyright: (c) 2023
    form: barred

    ## Grid

    IHOP.STAIN.
    NOTI.NUDGES
    CORNCOBDOWN
    ADOBO...TSO
    ...AIM.BYOB
    .HALFDREAM.
    WALL.SUB...
    ALE...DRAFT
    WARPCLEANER
    ALTERS.VETO
    ..SPUD.EWAN

    ## Clues

    A1. Breakfast chain that should install pogo stick racks? ~ IHOP
    A5. Leave a mark? ~ STAIN
    A10. Shell-shielded species introduced in "Ahsoka" ~ NOTI
    A11. Gently encourages ~ NUDGES
    A13. *Accessory for Frosty ~ CORNCOB
    A15. *"Hush!" ~ DOWN
    A16. Filipino stew celebrated by a 2023 Google Doodle ~ ADOBO
    A17. General on many an American Chinese menu ~ TSO
    A18. Org. that seized a replica of the Mayflower on Thanksgiving 1970 ~ AIM
    A20. Caveat on a BBQ invite ~ BYOB
    A21. *Ramp found in "Tony Hawk: Pro Skater 2" ~ HALF
    A23. *Unlikely aspiration ~ DREAM
    A25. "Over the Garden ___" (Cartoon Network miniseries) ~ WALL
    A26. Step in ~ SUB
    A27. Word that might follow pretzel or pumpkin ~ ALE
    A28. What 27-Across might be on ~ DRAFT
    A32. *Mario's portal that's apt since he's a plumber ~ WARP
    A34. *Piece of equipment for an egg drop in Physics, perhaps ~ CLEANER
    A36. Changes a vowel in the spelling of altars? ~ ALTERS
    A37. Deny, presidentially ~ VETO
    A38. Tater ~ SPUD
    A39. "Obi-Wan Kenobi" star McGregor ~ EWAN

    D1. Quechua speaker ~ INCA
    D2. Robin tail? ~ HOOD
    D3. Al ___ Lado (humanitarian support group whose name means "On the Other Side") ~ OTRO
    D4. Arcade game with "Star Wars" and "Ghostbusters" variants ~ PINBALL
    D5. ___-caps ~ SNO
    D6. Place to rub-a-dub-dub ~ TUB
    D7. Put it all together, say ~ ADD
    D8. "Lean on me" ~ IGOTYA
    D9. "Divers" singer Joanna ~ NEWSOM
    D12. One who might have their pinky up ~ SNOB
    D14. Style elaborately ~ COIF
    D19. Psychiatrists' degs. ~ MDS
    D20. "You can do this" ~ BEBRAVE
    D21. Kind of food often found in a D.C. food cart ~ HALAL
    D22. Notifies ~ ALERTS
    D24. Response to teasing ~ RUDE
    D25. Sheetz competitor ~ WAWA
    D29. Over again ~ ANEW
    D30. Baked cheese in a viral TikTok recipe ~ FETA
    D31. 1982 cult classic in which Jeff Bridges says, "Greetings, programs" ~ TRON
    D33. Word preceding band or squad ~ PEP
    D34. French wine designation ~ CRU
    D35. Psychedelic found during April Fool's Day? ~ LSD

    ## Design

    <style>
    A { bar-left: true }
    </style>

    ....#.....#
    ....#......
    .......A...
    .....###...
    ###...#....
    #....A....#
    ....#...###
    ...###.....
    ....A......
    ......#....
    ##....#....
    "
  `)

  expect(xdJSON.report.success).toBe(true)

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
