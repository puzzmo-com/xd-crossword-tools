import { DiffResults, xdDiff } from "../src/xdDiff"

it("works", () => {
  const results = xdDiff(baseXD, editedXD)

  expect(printDiff(results)).toMatchInlineSnapshot(`
    "0  : 0  | ## Metadata
    1  : 1  | 
    2  : 2  | author: danger and orta
    5  : 3  | copyright: © 2022 -> copyright: © 2023
    3  : NaN| date: Not set
    4  : NaN| editor: Not set
    7  : 9  | splitcharacter: |
    1  : 1  | title: tbd
    5  : ---| + downclues: 17
    7  : ---| + height: 10
    8  : ---| + size: 10x10
    4  : ---| + whitespaces: 84
    6  : ---| + width: 10
    --- : 6  | - blacksquares: 16
    9  : 11 | 
    10 : 12 | ## Grid
    11 : 13 | 
    11 : 13 | HISS.NOKIA
    12 : 14 | ISNT.OWENS
    13 : 15 | PLEA.BINDI
    14 : 16 | .EAGLEEYED
    15 : 17 | ..HEEL.AXE -> ..KEEL.AXE
    16 : 18 | ICY.NPR...
    17 : 19 | DOGEARED..
    18 : 20 | IMOK.IMAGE
    19 : 21 | OBOE.ZINES
    20 : 22 | MODS.EXALT
    21 : 23 | 
    23 : 25 | ## Clues
    23 : 25 | 
    24 : 26 | A1. A serpentine sound ~ HISS
    25 : 27 | A1 ^hint: the noise when you open a fizzy can -> A1 ^hint: [ WIP ]
    26 : 28 | A1 ^ref: A5 -> A1 ^ref: A6
    29 : 29 | 
    27 : 30 | A5. Big name in dumb phones ~ NOKIA
    28 : 31 | A5 ^hint: No wip
    36 : ---| + A5 ^cite: https://en.wikipedia.org/wiki/Nokia
    33 : 33 | 
    29 : 34 | A10. Terse reply to "It's my turn" ~ ISNT
    30 : 35 | A10 ^hint: [ WIP ] -> A10 ^hint: But is it?
    36 : 36 | 
    31 : 36 | A11. 1930s American who won 4 gold medals ~ OWENS
    32 : 37 | A11 ^hint: [ WIP ]
    38 : 38 | 
    33 : 38 | A12. A kind of bargain ~ PLEA
    34 : 39 | A12 ^hint: [ WIP ] -> A12 ^hint: A request
    40 : 40 | 
    35 : 40 | A13. A third eye commonly found on the Indian subcontinent ~ BINDI
    36 : 41 | A13 ^hint: [ WIP ] -> A13 ^hint: A cute dog from the dog park
    42 : 42 | 
    37 : 42 | A14. Twitch streamers who can spot a foe at an incredible distance ~ EAGLE|EYED
    38 : 43 | A14 ^hint: [ WIP ]
    44 : 44 | 
    39 : 44 | A16. Boats bottom ~ KEEL
    40 : 45 | A16 ^hint: [ WIP ]
    46 : 46 | 
    41 : 46 | A17. Something to grind ~ AXE
    42 : 47 | A17 ^hint: [ WIP ] -> A17 ^hint: The american form of Lynx
    48 : 48 | 
    43 : 48 | A18. The stare I got from my collab/wife when I recommended ‘boats bottom’ for Across 16 ~ ICY
    44 : 49 | A18 ^hint: [ WIP ]
    45 : 50 | A18 ^refs: A16
    51 : 51 | 
    48 : 52 | A22. A book with many saved points ~ DOG|EARED
    49 : 53 | A22 ^hint: [ WIP ]
    54 : 54 | 
    50 : 54 | A25. Response after a fall (2 wds) ~ IM|OK
    51 : 55 | A25 ^hint: [ WIP ]
    56 : 56 | 
    52 : 56 | A26. They’re the spitting ___ of their mother ~ IMAGE
    53 : 57 | A26 ^hint: [ WIP ]
    58 : 58 | 
    54 : 58 | A29. Almost all vowel instrument ~ OBOE
    55 : 59 | A29 ^hint: [ WIP ]
    60 : 60 | 
    56 : 60 | A30. Punky hand drawn paper ~ ZINES
    57 : 61 | A30 ^hint: [ WIP ]
    62 : 62 | 
    58 : 62 | A31. The unpaid volunteers trying to keep Reddit readable ~ MODS
    59 : 63 | A31 ^hint: [ WIP ]
    64 : 64 | 
    60 : 64 | A32. biblical term for praise ~ EXALT
    61 : 65 | A32 ^hint: [ WIP ]
    66 : 66 | 
    65 : 65 | 
    64 : 68 | D1. 🎶 The ___ bone connects to the knee bone 🎶 ~ HIP
    65 : 69 | D1 ^hint: [ WIP ]
    70 : 70 | 
    66 : 70 | D2. ___ of dogs by Wes anderson ~ ISLE
    67 : 71 | D2 ^hint: [ WIP ]
    72 : 72 | 
    68 : 72 | D3. The web serial Worm ~ SNEAKYGOOD
    69 : 73 | D3 ^hint: [ WIP ]
    74 : 74 | 
    70 : 74 | D4. <<NO CLUE>> ~ STAGE
    71 : 75 | D4 ^hint: [ WIP ]
    76 : 76 | 
    72 : 76 | D5. What folks are thinking about when a research paper’s authors are pared to three ~ NOBEL|PRIZE
    73 : 77 | D5 ^hint: [ WIP ]
    78 : 78 | 
    74 : 78 | D6. Boo-boo ~ OWIE
    75 : 79 | D6 ^hint: [ WIP ]
    80 : 80 | 
    76 : 80 | D7. Nation with the capital of Nairobi ~ KENYA
    77 : 81 | D7 ^hint: [ WIP ]
    82 : 82 | 
    78 : 82 | D8. Look up for a book ~ INDEX
    79 : 83 | D8 ^hint: [ WIP ]
    84 : 84 | 
    80 : 84 | D9. A place to put something for later ~ ASIDE
    81 : 85 | D9 ^hint: [ WIP ]
    86 : 86 | 
    82 : 86 | D15. Headey who played Cersei Lannister on Game of Thrones ~ LENA
    83 : 87 | D15 ^hint: [ WIP ]
    88 : 88 | 
    84 : 88 | D18. A 'don't go there' for talking to ESL folk ~ IDIOM
    85 : 89 | D18 ^hint: [ WIP ]
    90 : 90 | 
    86 : 90 | D19. Soup and a sandwich ~ COMBO
    87 : 91 | D19 ^hint: [ WIP ]
    92 : 92 | 
    88 : 92 | D21. Word on the street is, everything is a ___ ~ REMIX
    89 : 93 | D21 ^hint: [ WIP ]
    94 : 94 | 
    90 : 94 | D23. Scrapes by ~ EKES
    91 : 95 | D23 ^hint: [ WIP ]
    96 : 96 | 
    92 : 96 | D24. Agent Scully ~ DANA
    93 : 97 | D24 ^hint: [ WIP ]
    98 : 98 | 
    94 : 98 | D27. When two folks just get each other ~ GEL
    95 : 99 | D27 ^hint: [ WIP ]
    100: 100| 
    96 : 100| D28. The time in NYC ~ EST
    97 : 101| D28 ^hint: [ WIP ]
    102: 102| 
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
      const line = String(d.beforeLine).padEnd(3, " ") + ": " + String(d.afterLine).padEnd(3, " ")
      str += `${line}| ${d.content}\n`
    } else if (d.type === "change") {
      const line = String(d.beforeLine).padEnd(3, " ") + ": " + String(d.afterLine).padEnd(3, " ")
      str += `${line}| ${d.before} -> ${d.after}\n`
    } else if (d.type === "add") {
      const line = String(d.afterLine).padEnd(3, " ") + ": ---"
      str += `${line}| + ${d.after}\n`
    } else if (d.type === "remove") {
      const line = "--- : " + String(d.beforeLine).padEnd(3, " ")
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
