import { xdToJSON } from "../xdparser2"
import { it } from "vitest"

it("generates a barred crossword from the xd", () => {
  const crosswordJSON = xdToJSON(xdForBarred)

  expect(crosswordJSON.clues.across.length).toBe(8)

  const cluesOne = crosswordJSON.clues.across.find((c) => c.number === 1)
  expect(cluesOne?.answer).toBe("SIGNPOST")

  const cluesTen = crosswordJSON.clues.across.find((c) => c.number === 10)!
  expect(cluesTen.answer).toBe("DAUNT")
  expect(cluesTen.tiles.length).toBe(5)

  const clueEight = crosswordJSON.clues.down.find((c) => c.number === 8)
  expect(clueEight?.answer).toBe("SWERVES")

  const clue12 = crosswordJSON.clues.down.find((c) => c.number === 12)
  expect(clue12?.answer).toBe("YOLO")
})

const xdForBarred = `## Metadata

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
`
