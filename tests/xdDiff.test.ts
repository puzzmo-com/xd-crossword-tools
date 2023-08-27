import { error } from "console"
import { DiffResults, xdDiff } from "../lib/xdDiff"

it("works", () => {
  const results = xdDiff(baseXD, editedXD)

  expect(printDiff(results)).toMatchInlineSnapshot(`
"  | ## Metadata
   | 
   | author: danger and orta
3  | copyright: © 2022 -> copyright: © 2023
   | date: Not set
   | editor: Not set
   | splitcharacter: |
   | title: tbd
5  | + downclues: 17
7  | + height: 10
8  | + size: 10x10
4  | + whitespaces: 84
6  | + width: 10
6  | - blacksquares: 16
   | 
   | ## Grid
   | 
   | HISS.NOKIA
   | ISNT.OWENS
   | PLEA.BINDI
   | .EAGLEEYED
17 | ..HEEL.AXE -> ..KEEL.AXE
   | ICY.NPR...
   | DOGEARED..
   | IMOK.IMAGE
   | OBOE.ZINES
   | MODS.EXALT
   | 
   | ## Clues
   | 
   | A1. A serpentine sound ~ HISS
27 | A1 ^hint: the noise when you open a fizzy can -> A1 ^hint: [ WIP ]
28 | A1 ^ref: A5 -> A1 ^ref: A6
   | 
   | A5. Big name in dumb phones ~ NOKIA
   | A5 ^hint: No wip
36 | + A5 ^cite: https://en.wikipedia.org/wiki/Nokia
   | 
   | A10. Terse reply to \\"It's my turn\\" ~ ISNT
35 | A10 ^hint: [ WIP ] -> A10 ^hint: But is it?
   | 
   | A11. 1930s American who won 4 gold medals ~ OWENS
   | A11 ^hint: [ WIP ]
   | 
   | A12. A kind of bargain ~ PLEA
39 | A12 ^hint: [ WIP ] -> A12 ^hint: A request
   | 
   | A13. A third eye commonly found on the Indian subcontinent ~ BINDI
41 | A13 ^hint: [ WIP ] -> A13 ^hint: A cute dog from the dog park
   | 
   | A14. Twitch streamers who can spot a foe at an incredible distance ~ EAGLE|EYED
   | A14 ^hint: [ WIP ]
   | 
   | A16. Boats bottom ~ KEEL
   | A16 ^hint: [ WIP ]
   | 
   | A17. Something to grind ~ AXE
47 | A17 ^hint: [ WIP ] -> A17 ^hint: The american form of Lynx
   | 
   | A18. The stare I got from my collab/wife when I recommended ‘boats bottom’ for Across 16 ~ ICY
   | A18 ^hint: [ WIP ]
   | A18 ^refs: A16
   | 
   | A22. A book with many saved points ~ DOG|EARED
   | A22 ^hint: [ WIP ]
   | 
   | A25. Response after a fall (2 wds) ~ IM|OK
   | A25 ^hint: [ WIP ]
   | 
   | A26. They’re the spitting ___ of their mother ~ IMAGE
   | A26 ^hint: [ WIP ]
   | 
   | A29. Almost all vowel instrument ~ OBOE
   | A29 ^hint: [ WIP ]
   | 
   | A30. Punky hand drawn paper ~ ZINES
   | A30 ^hint: [ WIP ]
   | 
   | A31. The unpaid volunteers trying to keep Reddit readable ~ MODS
   | A31 ^hint: [ WIP ]
   | 
   | A32. biblical term for praise ~ EXALT
   | A32 ^hint: [ WIP ]
   | 
   | 
   | D1. 🎶 The ___ bone connects to the knee bone 🎶 ~ HIP
   | D1 ^hint: [ WIP ]
   | 
   | D2. ___ of dogs by Wes anderson ~ ISLE
   | D2 ^hint: [ WIP ]
   | 
   | D3. The web serial Worm ~ SNEAKYGOOD
   | D3 ^hint: [ WIP ]
   | 
   | D4. <<NO CLUE>> ~ STAGE
   | D4 ^hint: [ WIP ]
   | 
   | D5. What folks are thinking about when a research paper’s authors are pared to three ~ NOBEL|PRIZE
   | D5 ^hint: [ WIP ]
   | 
   | D6. Boo-boo ~ OWIE
   | D6 ^hint: [ WIP ]
   | 
   | D7. Nation with the capital of Nairobi ~ KENYA
   | D7 ^hint: [ WIP ]
   | 
   | D8. Look up for a book ~ INDEX
   | D8 ^hint: [ WIP ]
   | 
   | D9. A place to put something for later ~ ASIDE
   | D9 ^hint: [ WIP ]
   | 
   | D15. Headey who played Cersei Lannister on Game of Thrones ~ LENA
   | D15 ^hint: [ WIP ]
   | 
   | D18. A 'don't go there' for talking to ESL folk ~ IDIOM
   | D18 ^hint: [ WIP ]
   | 
   | D19. Soup and a sandwich ~ COMBO
   | D19 ^hint: [ WIP ]
   | 
   | D21. Word on the street is, everything is a ___ ~ REMIX
   | D21 ^hint: [ WIP ]
   | 
   | D23. Scrapes by ~ EKES
   | D23 ^hint: [ WIP ]
   | 
   | D24. Agent Scully ~ DANA
   | D24 ^hint: [ WIP ]
   | 
   | D27. When two folks just get each other ~ GEL
   | D27 ^hint: [ WIP ]
   | 
   | D28. The time in NYC ~ EST
   | D28 ^hint: [ WIP ]
   | 
"
`)
})

const printDiff = (results: DiffResults) => {
  if ("error" in results) {
    return results.message
  }

  let str = ""
  results.diff.forEach((d, i) => {
    if (d.type === "same") {
      const prefix = i === 0 ? "" : " "
      str += `${prefix}  | ${d.content}\n`
    } else if (d.type === "change") {
      const line = String(d.afterLine).padEnd(3, " ")
      str += `${line}| ${d.before} -> ${d.after}\n`
    } else if (d.type === "add") {
      const line = String(d.afterLine).padEnd(3, " ")
      str += `${line}| + ${d.after}\n`
    } else if (d.type === "remove") {
      const line = String(d.beforeLine).padEnd(3, " ")
      str += `${line}| - ${d.before}\n`
    }
  })
  return str
}

const baseXD = `## Metadata
title: tbd
author: danger and orta
date: Not set
editor: Not set
copyright: © 2022
blacksquares: 16
splitcharacter: |


## Grid
HISS.NOKIA
ISNT.OWENS
PLEA.BINDI
.EAGLEEYED
..HEEL.AXE
ICY.NPR...
DOGEARED..
IMOK.IMAGE
OBOE.ZINES
MODS.EXALT


## Clues
A1. A serpentine sound ~ HISS
A1 ^hint: the noise when you open a fizzy can
A1 ^ref: A5
A5. Big name in dumb phones ~ NOKIA
A5 ^hint: No wip
A10. Terse reply to "It's my turn" ~ ISNT
A10 ^hint: [ WIP ]
A11. 1930s American who won 4 gold medals ~ OWENS
A11 ^hint: [ WIP ]
A12. A kind of bargain ~ PLEA
A12 ^hint: [ WIP ]
A13. A third eye commonly found on the Indian subcontinent ~ BINDI
A13 ^hint: [ WIP ]
A14. Twitch streamers who can spot a foe at an incredible distance ~ EAGLE|EYED
A14 ^hint: [ WIP ]
A16. Boats bottom ~ KEEL
A16 ^hint: [ WIP ]
A17. Something to grind ~ AXE
A17 ^hint: [ WIP ]
A18. The stare I got from my collab/wife when I recommended ‘boats bottom’ for Across 16 ~ ICY
A18 ^hint: [ WIP ]
A18 ^refs: A16
A20. Home of many podcasts ~ NPR
A20 ^hint: [ WIP ]
A22. A book with many saved points ~ DOG|EARED
A22 ^hint: [ WIP ]
A25. Response after a fall (2 wds) ~ IM|OK
A25 ^hint: [ WIP ]
A26. They’re the spitting ___ of their mother ~ IMAGE
A26 ^hint: [ WIP ]
A29. Almost all vowel instrument ~ OBOE
A29 ^hint: [ WIP ]
A30. Punky hand drawn paper ~ ZINES
A30 ^hint: [ WIP ]
A31. The unpaid volunteers trying to keep Reddit readable ~ MODS
A31 ^hint: [ WIP ]
A32. biblical term for praise ~ EXALT
A32 ^hint: [ WIP ]


D1. 🎶 The ___ bone connects to the knee bone 🎶 ~ HIP
D1 ^hint: [ WIP ]
D2. ___ of dogs by Wes anderson ~ ISLE
D2 ^hint: [ WIP ]
D3. The web serial Worm ~ SNEAKYGOOD
D3 ^hint: [ WIP ]
D4. <<NO CLUE>> ~ STAGE
D4 ^hint: [ WIP ]
D5. What folks are thinking about when a research paper’s authors are pared to three ~ NOBEL|PRIZE
D5 ^hint: [ WIP ]
D6. Boo-boo ~ OWIE
D6 ^hint: [ WIP ]
D7. Nation with the capital of Nairobi ~ KENYA
D7 ^hint: [ WIP ]
D8. Look up for a book ~ INDEX
D8 ^hint: [ WIP ]
D9. A place to put something for later ~ ASIDE
D9 ^hint: [ WIP ]
D15. Headey who played Cersei Lannister on Game of Thrones ~ LENA
D15 ^hint: [ WIP ]
D18. A 'don't go there' for talking to ESL folk ~ IDIOM
D18 ^hint: [ WIP ]
D19. Soup and a sandwich ~ COMBO
D19 ^hint: [ WIP ]
D21. Word on the street is, everything is a ___ ~ REMIX
D21 ^hint: [ WIP ]
D23. Scrapes by ~ EKES
D23 ^hint: [ WIP ]
D24. Agent Scully ~ DANA
D24 ^hint: [ WIP ]
D27. When two folks just get each other ~ GEL
D27 ^hint: [ WIP ]
D28. The time in NYC ~ EST
D28 ^hint: [ WIP ]
`

const editedXD = `## Metadata
title: tbd
author: danger and orta
copyright: © 2023
whitespaces: 84
downclues: 17
width: 10
height: 10
size: 10x10
splitcharacter: |


## Grid
HISS.NOKIA
ISNT.OWENS
PLEA.BINDI
.EAGLEEYED
..KEEL.AXE
ICY.NPR...
DOGEARED..
IMOK.IMAGE
OBOE.ZINES
MODS.EXALT


## Clues
A1. A serpentine sound ~ HISS
A1 ^hint: [ WIP ]
A1 ^ref: A6

A5. Big name in dumb phones ~ NOKIA
A5 ^hint: No wip
A5 ^cite: https://en.wikipedia.org/wiki/Nokia

A10. Terse reply to "It's my turn" ~ ISNT
A10 ^hint: But is it?
A11. 1930s American who won 4 gold medals ~ OWENS
A11 ^hint: [ WIP ]
A12. A kind of bargain ~ PLEA
A12 ^hint: A request
A13. A third eye commonly found on the Indian subcontinent ~ BINDI
A13 ^hint: A cute dog from the dog park
A14. Twitch streamers who can spot a foe at an incredible distance ~ EAGLE|EYED
A14 ^hint: [ WIP ]
A16. Boats bottom ~ KEEL
A16 ^hint: [ WIP ]
A17. Something to grind ~ AXE
A17 ^hint: The american form of Lynx
A18. The stare I got from my collab/wife when I recommended ‘boats bottom’ for Across 16 ~ ICY
A18 ^hint: [ WIP ]
A18 ^refs: A16

A22. A book with many saved points ~ DOG|EARED
A22 ^hint: [ WIP ]
A25. Response after a fall (2 wds) ~ IM|OK
A25 ^hint: [ WIP ]
A26. They’re the spitting ___ of their mother ~ IMAGE
A26 ^hint: [ WIP ]
A29. Almost all vowel instrument ~ OBOE
A29 ^hint: [ WIP ]
A30. Punky hand drawn paper ~ ZINES
A30 ^hint: [ WIP ]
A31. The unpaid volunteers trying to keep Reddit readable ~ MODS
A31 ^hint: [ WIP ]
A32. biblical term for praise ~ EXALT
A32 ^hint: [ WIP ]


D1. 🎶 The ___ bone connects to the knee bone 🎶 ~ HIP
D1 ^hint: [ WIP ]
D2. ___ of dogs by Wes anderson ~ ISLE
D2 ^hint: [ WIP ]
D3. The web serial Worm ~ SNEAKYGOOD
D3 ^hint: [ WIP ]
D4. <<NO CLUE>> ~ STAGE
D4 ^hint: [ WIP ]
D5. What folks are thinking about when a research paper’s authors are pared to three ~ NOBEL|PRIZE
D5 ^hint: [ WIP ]
D6. Boo-boo ~ OWIE
D6 ^hint: [ WIP ]
D7. Nation with the capital of Nairobi ~ KENYA
D7 ^hint: [ WIP ]
D8. Look up for a book ~ INDEX
D8 ^hint: [ WIP ]
D9. A place to put something for later ~ ASIDE
D9 ^hint: [ WIP ]
D15. Headey who played Cersei Lannister on Game of Thrones ~ LENA
D15 ^hint: [ WIP ]
D18. A 'don't go there' for talking to ESL folk ~ IDIOM
D18 ^hint: [ WIP ]
D19. Soup and a sandwich ~ COMBO
D19 ^hint: [ WIP ]
D21. Word on the street is, everything is a ___ ~ REMIX
D21 ^hint: [ WIP ]
D23. Scrapes by ~ EKES
D23 ^hint: [ WIP ]
D24. Agent Scully ~ DANA
D24 ^hint: [ WIP ]
D27. When two folks just get each other ~ GEL
D27 ^hint: [ WIP ]
D28. The time in NYC ~ EST
D28 ^hint: [ WIP ]
`
