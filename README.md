# xd-crossword-tools

[xd](https://github.com/century-arcade/xd) is a text-based crossword format which is easy for humans to read and reason about.

This repo provides tools for taking different crossword file formats and converting them to xd. Then has a comprehensive xd to JSON function. Mostly conforms to the v2 xd spec, and comes with a few editor-experience extensions for a REPL-like environment. Uses a [vendored](./lib//vendor/) copy of 'puzjs' which was ported to TypeScript.

### Documentation for authoring in xd

[User Guide](./DOCS.md).

### .xd to .JSON

```ts
import { xdToJSON } from "xd-crossword-tools"

const xd = "[...]"
const crossword = xdToJSON(xd)
```

The JSON format is a bit more verbose than you might expect (see below for an example), but the goal is to have as much information pre-computed at parse time in order to save lookups later at runtime. You can see the type definitions here: [`./lib/types.ts`](./lib/types.ts).

### .puz to .xd

Builds on [puzjs](https://www.npmjs.com/package/puzjs) (ISC license). The puz format is generally what tools and websites will give you as an output format.

```ts
import { puzToXd } from "xd-crossword-tools"

const puzResponse = await fetch(url)
const puzBuffer = await res.arrayBuffer()
const xd = puzToXd(puzBuffer)
```

This should cover most features in puz and xd.

### UClick .xml to .xd

```ts
import { uclickXMLToXd } from "xd-crossword-tools"

const xmlResponse = await fetch(url)
const xmlString = await res.body()
const xd = puzToXd(xmlString)
```

### Cursor position information

You can get some information about what's under the cursor at line, index position
via `editorInfoAtCursor`

```ts
import { xdToJSON, editorInfoAtCursor } from "xd-crossword-tools"

const xd = "[...]"
const crossword = xdToJSON(xd, true, true)

const info = editorInfoAtCursor(crossword)
const cursorInfo = info(0, 0)
```

Which returns a union of different results, you can check the types + tests to see what's available, but it's something like this:

```tss
export type PositionInfo =
  | { type: "noop" }
  | { type: "grid"; position: Position }
  | { type: "clue"; direction: CursorDirection; number: number }
  | ...
```

### Example

Let's take this free `.puz`: https://dehodson.github.io/crossword-puzzles/crosswords/alpha-bits/

Their .puz file turns into this xd:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./tests/output/alpha-bits.xd) -->
<!-- The below code snippet is automatically added from ./tests/output/alpha-bits.xd -->
```xd
## Metadata

Title: Alpha-Bits
Author: Drew Hodson
Copyright: © 2021
Description: N/A

## Grid

AHAB..CUD.SERIF
MADAM.ANY.ABODE
PLANE.DIE.NOTON
....TODO.EGO...
GASH.NINJA.KEEL
ARTICLE.ORU.DOE
YEARLY.MISPRINT
..NEI.MAN.SOT..
CALENDAR.RETIES
ICE.TAR.POTHOLE
OTEP.HQTRS.SNIT
...ALL.HEAL....
SPIRO.NET.ATLAS
TARTS.ETA.DOONE
UWAVE.WAX..YUTZ


## Clues

A1. Captain of the Pequod ~ AHAB
A5. Food for second chance chewing ~ CUD
A8. Font feature ~ SERIF
A13. Palindromic address to a female ~ MADAM
A15. ___ Way You Want It ~ ANY
A16. Place often described as humble ~ ABODE
A17. Flat two dimensional surface in geometry ~ PLANE
A18. Grim homophone of 7D ~ DIE
A19. Off ~ NOTON
A20. Heading for some lists ~ TODO
A22. Kanye West is famous for his ~ EGO
A23. Laceration ~ GASH
A27. Alias of Twitch star Richard Tyler Blevins ~ NINJA
A29. Capsize ~ KEEL
A33. Piece of clothing or print ~ ARTICLE
A35. Evangelical school in Tulsa, OK ~ ORU
A37. ___-eyed ~ DOE
A38. Annual ~ YEARLY
A39. The stamp with the upside down airplane is a famous one ~ MISPRINT
A41. With 42A and Marcus, a luxury department store chain ~ NEI
A42. 41A continued ~ MAN
A43. Lush ~ SOT
A44. The Mayan one ended in 2012 ~ CALENDAR
A47. What a child often does to their shoes ~ RETIES
A50. Vanilla ___ ~ ICE
A51. Maligned cigarette ingredient ~ TAR
A52. Frequent cause for a new tire ~ POTHOLE
A53. Los Angeles heavy metal act ~ OTEP
A55. Bldgs. such as the Googleplex ~ HQTRS
A57. A fit of irritation ~ SNIT
A58. Lead-in to American or day ~ ALL
A60. What Pokémon do at a Pokémon Center ~ HEAL
A62. Nixon's vice ~ SPIRO
A65. Nothing but ___ ~ NET
A66. One with the world on his shoulders ~ ATLAS
A71. Filled pastries ~ TARTS
A72. Age, in Milan ~ ETA
A73. Lorna ___, novel or cookie ~ DOONE
A74. Electrocardiogram readout feature ~ UWAVE
A75. Hip slang for records ~ WAX
A76. Yiddish for a foolish person ~ YUTZ

D1. Pc. of concert gear ~ AMP
D2. AI antagonist of 2001 ~ HAL
D3. Programming pioneer Lovelace ~ ADA
D4. Prohibit ~ BAN
D5. Type of person to routinely carry a club ~ CADDIE
D6. State of the ___ Address ~ UNION
D7. Colorful homophone of 18A ~ DYE
D8. Snitched ~ SANG
D9. Kindle fare ~ EBOOK
D10. Decayed matter ~ ROT
D11. Type of response you hope to get at the altar ~ IDO
D12. Peat-accumulating wetland ~ FEN
D14. The ___, NY art museum ~ MET
D21. ___Fans ~ ONLY
D22. Friends, Romans, countrymen, lend me your... ~ EARS
D23. "Friend of Dorothy" ~ GAY
D24. We ___ the Champions ~ ARE
D25. Father of Spider-Man ~ STANLEE
D26. What a certain applicant becomes ~ HIREE
D28. Connect ~ JOIN
D30. Particular form of a published text ~ EDITION
D31. Suffix at the end of all of Eevee's evolutions ~ EON
D32. Live and ___ Die ~ LET
D34. Famous Eastwood whose name became a famous Gorillaz song ~ CLINT
D36. Unexpected result in a sporting competition ~ UPSET
D39. Disfigure ~ MAR
D40. David Lee and Tim ~ ROTHS
D42. Luxury watch collection by Garmin ~ MARQ
D44. Top dog in an IT org ~ CIO
D45. Sister ___ ~ ACT
D46. Author Roald ~ DAHL
D47. Civil rights activist Parks ~ ROSA
D48. An additional name that could be part of 40D's clue ~ ELI
D49. Director's domain ~ SET
D52. Type of income to go in a 401k ~ PRETAX
D54. The Empire Strikes Back, to the Star Wars saga ~ PARTV
D56. Greek letter following 72A ~ THETA
D59. Misplace ~ LOSE
D61. Wee boy ~ LAD
D62. Dad to Tommy Pickles ~ STU
D63. The only Patrol I trust ~ PAW
D64. Smart savings plan, briefly ~ IRA
D65. Fresh ~ NEW
D67. Breeds such as Chihuahua or Pomeranian ~ TOY
D68. Bega behind "Mambo No. 5" ~ LOU
D69. Aardvark breakfast ~ ANT
D70. Sonic ___ ~ SEZ

## Notes

## Design

<style>O { background: circle }</style>

O..O##O.O#.O..O
.....#...#.....
.....#...#.....
####....#...###
O..O#.O.O.#O..O
.......#...#...
......#........
##...#O.O#...##
........#......
...#...#.......
O..O#.O.O.#O..O
###...#....####
.....#...#.....
.....#...#.....
O..O.#O.O##O..O
```
<!-- AUTO-GENERATED-CONTENT:END -->

 <details>
          <summary>And then turned into this JSON</summary>

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./tests/output/alpha-bits.json) -->
<!-- The below code snippet is automatically added from ./tests/output/alpha-bits.json -->
```json
{
  "meta": {
    "title": "Alpha-Bits",
    "author": "Drew Hodson",
    "date": "Not set",
    "editor": "Not set",
    "copyright": "© 2021",
    "description": "N/A"
  },
  "tiles": [
    [
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "H"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "B"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "C"
      },
      {
        "type": "letter",
        "letter": "U"
      },
      {
        "type": "letter",
        "letter": "D"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "S"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "R"
      },
      {
        "type": "letter",
        "letter": "I"
      },
      {
        "type": "letter",
        "letter": "F"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "M"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "D"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "M"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "letter",
        "letter": "Y"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "B"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "D"
      },
      {
        "type": "letter",
        "letter": "E"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "P"
      },
      {
        "type": "letter",
        "letter": "L"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "D"
      },
      {
        "type": "letter",
        "letter": "I"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "N"
      }
    ],
    [
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "D"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "G"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "G"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "S"
      },
      {
        "type": "letter",
        "letter": "H"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "letter",
        "letter": "I"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "letter",
        "letter": "J"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "K"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "L"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "R"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "I"
      },
      {
        "type": "letter",
        "letter": "C"
      },
      {
        "type": "letter",
        "letter": "L"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "R"
      },
      {
        "type": "letter",
        "letter": "U"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "D"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "E"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "Y"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "R"
      },
      {
        "type": "letter",
        "letter": "L"
      },
      {
        "type": "letter",
        "letter": "Y"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "M"
      },
      {
        "type": "letter",
        "letter": "I"
      },
      {
        "type": "letter",
        "letter": "S"
      },
      {
        "type": "letter",
        "letter": "P"
      },
      {
        "type": "letter",
        "letter": "R"
      },
      {
        "type": "letter",
        "letter": "I"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "letter",
        "letter": "T"
      }
    ],
    [
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "I"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "M"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "S"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "C"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "L"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "letter",
        "letter": "D"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "R"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "R"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "I"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "S"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "I"
      },
      {
        "type": "letter",
        "letter": "C"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "R"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "P"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "H"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "L"
      },
      {
        "type": "letter",
        "letter": "E"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "P"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "H"
      },
      {
        "type": "letter",
        "letter": "Q"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "R"
      },
      {
        "type": "letter",
        "letter": "S"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "S"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "letter",
        "letter": "I"
      },
      {
        "type": "letter",
        "letter": "T"
      }
    ],
    [
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "L"
      },
      {
        "type": "letter",
        "letter": "L"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "H"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "L"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "S"
      },
      {
        "type": "letter",
        "letter": "P"
      },
      {
        "type": "letter",
        "letter": "I"
      },
      {
        "type": "letter",
        "letter": "R"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "L"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "S"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "R"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "S"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "D"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "O"
      },
      {
        "type": "letter",
        "letter": "N"
      },
      {
        "type": "letter",
        "letter": "E"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "U"
      },
      {
        "type": "letter",
        "letter": "W"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "V"
      },
      {
        "type": "letter",
        "letter": "E"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "W"
      },
      {
        "type": "letter",
        "letter": "A"
      },
      {
        "type": "letter",
        "letter": "X"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "Y"
      },
      {
        "type": "letter",
        "letter": "U"
      },
      {
        "type": "letter",
        "letter": "T"
      },
      {
        "type": "letter",
        "letter": "Z"
      }
    ]
  ],
  "clues": {
    "across": [
      {
        "body": "Captain of the Pequod",
        "answer": "AHAB",
        "number": 1,
        "position": {
          "col": 0,
          "index": 0
        }
      },
      {
        "body": "Food for second chance chewing",
        "answer": "CUD",
        "number": 5,
        "position": {
          "col": 6,
          "index": 0
        }
      },
      {
        "body": "Font feature",
        "answer": "SERIF",
        "number": 8,
        "position": {
          "col": 10,
          "index": 0
        }
      },
      {
        "body": "Palindromic address to a female",
        "answer": "MADAM",
        "number": 13,
        "position": {
          "col": 0,
          "index": 1
        }
      },
      {
        "body": "___ Way You Want It",
        "answer": "ANY",
        "number": 15,
        "position": {
          "col": 6,
          "index": 1
        }
      },
      {
        "body": "Place often described as humble",
        "answer": "ABODE",
        "number": 16,
        "position": {
          "col": 10,
          "index": 1
        }
      },
      {
        "body": "Flat two dimensional surface in geometry",
        "answer": "PLANE",
        "number": 17,
        "position": {
          "col": 0,
          "index": 2
        }
      },
      {
        "body": "Grim homophone of 7D",
        "answer": "DIE",
        "number": 18,
        "position": {
          "col": 6,
          "index": 2
        }
      },
      {
        "body": "Off",
        "answer": "NOTON",
        "number": 19,
        "position": {
          "col": 10,
          "index": 2
        }
      },
      {
        "body": "Heading for some lists",
        "answer": "TODO",
        "number": 20,
        "position": {
          "col": 4,
          "index": 3
        }
      },
      {
        "body": "Kanye West is famous for his",
        "answer": "EGO",
        "number": 22,
        "position": {
          "col": 9,
          "index": 3
        }
      },
      {
        "body": "Laceration",
        "answer": "GASH",
        "number": 23,
        "position": {
          "col": 0,
          "index": 4
        }
      },
      {
        "body": "Alias of Twitch star Richard Tyler Blevins",
        "answer": "NINJA",
        "number": 27,
        "position": {
          "col": 5,
          "index": 4
        }
      },
      {
        "body": "Capsize",
        "answer": "KEEL",
        "number": 29,
        "position": {
          "col": 11,
          "index": 4
        }
      },
      {
        "body": "Piece of clothing or print",
        "answer": "ARTICLE",
        "number": 33,
        "position": {
          "col": 0,
          "index": 5
        }
      },
      {
        "body": "Evangelical school in Tulsa, OK",
        "answer": "ORU",
        "number": 35,
        "position": {
          "col": 8,
          "index": 5
        }
      },
      {
        "body": "___-eyed",
        "answer": "DOE",
        "number": 37,
        "position": {
          "col": 12,
          "index": 5
        }
      },
      {
        "body": "Annual",
        "answer": "YEARLY",
        "number": 38,
        "position": {
          "col": 0,
          "index": 6
        }
      },
      {
        "body": "The stamp with the upside down airplane is a famous one",
        "answer": "MISPRINT",
        "number": 39,
        "position": {
          "col": 7,
          "index": 6
        }
      },
      {
        "body": "With 42A and Marcus, a luxury department store chain",
        "answer": "NEI",
        "number": 41,
        "position": {
          "col": 2,
          "index": 7
        }
      },
      {
        "body": "41A continued",
        "answer": "MAN",
        "number": 42,
        "position": {
          "col": 6,
          "index": 7
        }
      },
      {
        "body": "Lush",
        "answer": "SOT",
        "number": 43,
        "position": {
          "col": 10,
          "index": 7
        }
      },
      {
        "body": "The Mayan one ended in 2012",
        "answer": "CALENDAR",
        "number": 44,
        "position": {
          "col": 0,
          "index": 8
        }
      },
      {
        "body": "What a child often does to their shoes",
        "answer": "RETIES",
        "number": 47,
        "position": {
          "col": 9,
          "index": 8
        }
      },
      {
        "body": "Vanilla ___",
        "answer": "ICE",
        "number": 50,
        "position": {
          "col": 0,
          "index": 9
        }
      },
      {
        "body": "Maligned cigarette ingredient",
        "answer": "TAR",
        "number": 51,
        "position": {
          "col": 4,
          "index": 9
        }
      },
      {
        "body": "Frequent cause for a new tire",
        "answer": "POTHOLE",
        "number": 52,
        "position": {
          "col": 8,
          "index": 9
        }
      },
      {
        "body": "Los Angeles heavy metal act",
        "answer": "OTEP",
        "number": 53,
        "position": {
          "col": 0,
          "index": 10
        }
      },
      {
        "body": "Bldgs. such as the Googleplex",
        "answer": "HQTRS",
        "number": 55,
        "position": {
          "col": 5,
          "index": 10
        }
      },
      {
        "body": "A fit of irritation",
        "answer": "SNIT",
        "number": 57,
        "position": {
          "col": 11,
          "index": 10
        }
      },
      {
        "body": "Lead-in to American or day",
        "answer": "ALL",
        "number": 58,
        "position": {
          "col": 3,
          "index": 11
        }
      },
      {
        "body": "What Pokémon do at a Pokémon Center",
        "answer": "HEAL",
        "number": 60,
        "position": {
          "col": 7,
          "index": 11
        }
      },
      {
        "body": "Nixon's vice",
        "answer": "SPIRO",
        "number": 62,
        "position": {
          "col": 0,
          "index": 12
        }
      },
      {
        "body": "Nothing but ___",
        "answer": "NET",
        "number": 65,
        "position": {
          "col": 6,
          "index": 12
        }
      },
      {
        "body": "One with the world on his shoulders",
        "answer": "ATLAS",
        "number": 66,
        "position": {
          "col": 10,
          "index": 12
        }
      },
      {
        "body": "Filled pastries",
        "answer": "TARTS",
        "number": 71,
        "position": {
          "col": 0,
          "index": 13
        }
      },
      {
        "body": "Age, in Milan",
        "answer": "ETA",
        "number": 72,
        "position": {
          "col": 6,
          "index": 13
        }
      },
      {
        "body": "Lorna ___, novel or cookie",
        "answer": "DOONE",
        "number": 73,
        "position": {
          "col": 10,
          "index": 13
        }
      },
      {
        "body": "Electrocardiogram readout feature",
        "answer": "UWAVE",
        "number": 74,
        "position": {
          "col": 0,
          "index": 14
        }
      },
      {
        "body": "Hip slang for records",
        "answer": "WAX",
        "number": 75,
        "position": {
          "col": 6,
          "index": 14
        }
      },
      {
        "body": "Yiddish for a foolish person",
        "answer": "YUTZ",
        "number": 76,
        "position": {
          "col": 11,
          "index": 14
        }
      }
    ],
    "down": [
      {
        "body": "Pc. of concert gear",
        "answer": "AMP",
        "number": 1,
        "position": {
          "col": 0,
          "index": 0
        }
      },
      {
        "body": "AI antagonist of 2001",
        "answer": "HAL",
        "number": 2,
        "position": {
          "col": 1,
          "index": 0
        }
      },
      {
        "body": "Programming pioneer Lovelace",
        "answer": "ADA",
        "number": 3,
        "position": {
          "col": 2,
          "index": 0
        }
      },
      {
        "body": "Prohibit",
        "answer": "BAN",
        "number": 4,
        "position": {
          "col": 3,
          "index": 0
        }
      },
      {
        "body": "Type of person to routinely carry a club",
        "answer": "CADDIE",
        "number": 5,
        "position": {
          "col": 6,
          "index": 0
        }
      },
      {
        "body": "State of the ___ Address",
        "answer": "UNION",
        "number": 6,
        "position": {
          "col": 7,
          "index": 0
        }
      },
      {
        "body": "Colorful homophone of 18A",
        "answer": "DYE",
        "number": 7,
        "position": {
          "col": 8,
          "index": 0
        }
      },
      {
        "body": "Snitched",
        "answer": "SANG",
        "number": 8,
        "position": {
          "col": 10,
          "index": 0
        }
      },
      {
        "body": "Kindle fare",
        "answer": "EBOOK",
        "number": 9,
        "position": {
          "col": 11,
          "index": 0
        }
      },
      {
        "body": "Decayed matter",
        "answer": "ROT",
        "number": 10,
        "position": {
          "col": 12,
          "index": 0
        }
      },
      {
        "body": "Type of response you hope to get at the altar",
        "answer": "IDO",
        "number": 11,
        "position": {
          "col": 13,
          "index": 0
        }
      },
      {
        "body": "Peat-accumulating wetland",
        "answer": "FEN",
        "number": 12,
        "position": {
          "col": 14,
          "index": 0
        }
      },
      {
        "body": "The ___, NY art museum",
        "answer": "MET",
        "number": 14,
        "position": {
          "col": 4,
          "index": 1
        }
      },
      {
        "body": "___Fans",
        "answer": "ONLY",
        "number": 21,
        "position": {
          "col": 5,
          "index": 3
        }
      },
      {
        "body": "Friends, Romans, countrymen, lend me your...",
        "answer": "EARS",
        "number": 22,
        "position": {
          "col": 9,
          "index": 3
        }
      },
      {
        "body": "\"Friend of Dorothy\"",
        "answer": "GAY",
        "number": 23,
        "position": {
          "col": 0,
          "index": 4
        }
      },
      {
        "body": "We ___ the Champions",
        "answer": "ARE",
        "number": 24,
        "position": {
          "col": 1,
          "index": 4
        }
      },
      {
        "body": "Father of Spider-Man",
        "answer": "STANLEE",
        "number": 25,
        "position": {
          "col": 2,
          "index": 4
        }
      },
      {
        "body": "What a certain applicant becomes",
        "answer": "HIREE",
        "number": 26,
        "position": {
          "col": 3,
          "index": 4
        }
      },
      {
        "body": "Connect",
        "answer": "JOIN",
        "number": 28,
        "position": {
          "col": 8,
          "index": 4
        }
      },
      {
        "body": "Particular form of a published text",
        "answer": "EDITION",
        "number": 30,
        "position": {
          "col": 12,
          "index": 4
        }
      },
      {
        "body": "Suffix at the end of all of Eevee's evolutions",
        "answer": "EON",
        "number": 31,
        "position": {
          "col": 13,
          "index": 4
        }
      },
      {
        "body": "Live and ___ Die",
        "answer": "LET",
        "number": 32,
        "position": {
          "col": 14,
          "index": 4
        }
      },
      {
        "body": "Famous Eastwood whose name became a famous Gorillaz song",
        "answer": "CLINT",
        "number": 34,
        "position": {
          "col": 4,
          "index": 5
        }
      },
      {
        "body": "Unexpected result in a sporting competition",
        "answer": "UPSET",
        "number": 36,
        "position": {
          "col": 10,
          "index": 5
        }
      },
      {
        "body": "Disfigure",
        "answer": "MAR",
        "number": 39,
        "position": {
          "col": 7,
          "index": 6
        }
      },
      {
        "body": "David Lee and Tim",
        "answer": "ROTHS",
        "number": 40,
        "position": {
          "col": 11,
          "index": 6
        }
      },
      {
        "body": "Luxury watch collection by Garmin",
        "answer": "MARQ",
        "number": 42,
        "position": {
          "col": 6,
          "index": 7
        }
      },
      {
        "body": "Top dog in an IT org",
        "answer": "CIO",
        "number": 44,
        "position": {
          "col": 0,
          "index": 8
        }
      },
      {
        "body": "Sister ___",
        "answer": "ACT",
        "number": 45,
        "position": {
          "col": 1,
          "index": 8
        }
      },
      {
        "body": "Author Roald",
        "answer": "DAHL",
        "number": 46,
        "position": {
          "col": 5,
          "index": 8
        }
      },
      {
        "body": "Civil rights activist Parks",
        "answer": "ROSA",
        "number": 47,
        "position": {
          "col": 9,
          "index": 8
        }
      },
      {
        "body": "An additional name that could be part of 40D's clue",
        "answer": "ELI",
        "number": 48,
        "position": {
          "col": 13,
          "index": 8
        }
      },
      {
        "body": "Director's domain",
        "answer": "SET",
        "number": 49,
        "position": {
          "col": 14,
          "index": 8
        }
      },
      {
        "body": "Type of income to go in a 401k",
        "answer": "PRETAX",
        "number": 52,
        "position": {
          "col": 8,
          "index": 9
        }
      },
      {
        "body": "The Empire Strikes Back, to the Star Wars saga",
        "answer": "PARTV",
        "number": 54,
        "position": {
          "col": 3,
          "index": 10
        }
      },
      {
        "body": "Greek letter following 72A",
        "answer": "THETA",
        "number": 56,
        "position": {
          "col": 7,
          "index": 10
        }
      },
      {
        "body": "Misplace",
        "answer": "LOSE",
        "number": 59,
        "position": {
          "col": 4,
          "index": 11
        }
      },
      {
        "body": "Wee boy",
        "answer": "LAD",
        "number": 61,
        "position": {
          "col": 10,
          "index": 11
        }
      },
      {
        "body": "Dad to Tommy Pickles",
        "answer": "STU",
        "number": 62,
        "position": {
          "col": 0,
          "index": 12
        }
      },
      {
        "body": "The only Patrol I trust",
        "answer": "PAW",
        "number": 63,
        "position": {
          "col": 1,
          "index": 12
        }
      },
      {
        "body": "Smart savings plan, briefly",
        "answer": "IRA",
        "number": 64,
        "position": {
          "col": 2,
          "index": 12
        }
      },
      {
        "body": "Fresh",
        "answer": "NEW",
        "number": 65,
        "position": {
          "col": 6,
          "index": 12
        }
      },
      {
        "body": "Breeds such as Chihuahua or Pomeranian",
        "answer": "TOY",
        "number": 67,
        "position": {
          "col": 11,
          "index": 12
        }
      },
      {
        "body": "Bega behind \"Mambo No. 5\"",
        "answer": "LOU",
        "number": 68,
        "position": {
          "col": 12,
          "index": 12
        }
      },
      {
        "body": "Aardvark breakfast",
        "answer": "ANT",
        "number": 69,
        "position": {
          "col": 13,
          "index": 12
        }
      },
      {
        "body": "Sonic ___",
        "answer": "SEZ",
        "number": 70,
        "position": {
          "col": 14,
          "index": 12
        }
      }
    ]
  },
  "rebuses": {},
  "notes": "",
  "design": {
    "styles": {
      "O": {
        "background": "circle"
      }
    },
    "positions": [
      [
        "O",
        null,
        null,
        "O",
        null,
        null,
        "O",
        null,
        "O",
        null,
        null,
        "O",
        null,
        null,
        "O"
      ],
      [],
      [],
      [],
      [
        "O",
        null,
        null,
        "O",
        null,
        null,
        "O",
        null,
        "O",
        null,
        null,
        "O",
        null,
        null,
        "O"
      ],
      [],
      [],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        "O",
        null,
        "O"
      ],
      [],
      [],
      [
        "O",
        null,
        null,
        "O",
        null,
        null,
        "O",
        null,
        "O",
        null,
        null,
        "O",
        null,
        null,
        "O"
      ],
      [],
      [],
      [],
      [
        "O",
        null,
        null,
        "O",
        null,
        null,
        "O",
        null,
        "O",
        null,
        null,
        "O",
        null,
        null,
        "O"
      ]
    ]
  }
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

</details>

### `xd` Extensions

This lib creates `xd` compatible files, but also extends the format in a way that allows for thinking of `xd` as a human-editor format.

#### Structural

- Headers - `xd` out of the box has an implicit order:

  - Meta
  - Grid
  - Clues
  - Notes (optional)

  This library respects that behavior, but also supports a markdown header format whereby you could write an `xd` document like:

  ```md
  ## Metadata

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
  A4. A reasonable statement. ~ OK
  A5. The office centerpiece. ~ DESK

  D1. To \_ly go. ~ BOLD
  D2. Bigger than britain. ~ UK
  D3. A conscious tree. ~ BOOK
  ```

  This makes the sections a bit more explicit (and conceptually more user-friendly if you have not read the xd documentation ahead of seeing the file) and frees the order in which someone could write a document. Capitalization is ignored.

- ##### Clue Metadata

  You can add arbitrary metadata to clues by repeating the clue with a custom suffix:

  ```md
  A1. Gardener's concerns with A2 and D4. ~ BULB
  A1 ^Hint: Turned on to illuminate a room.
  A1 ^Refs. A2 D4
  A4. A reasonable statement. ~ OK
  A4 ^Hint: All \_\_.
  A5. The office centerpiece. ~ DESK
  A5 ^Hint: Fried.

  D1. To \_ly go. ~ BOLD
  D1 ^Hint: When you want to make some text stronger.
  D2. Bigger than britain. ~ UK
  D2 ^Hint: A union which left europe.
  D3. A conscious tree. ~ BOOK
  D3 ^Hint: Registering with a restaurant. ~ BOOK
  ```

  Capitalization is ignored, the metadata prefix will always be given as lowercase inside the JSON representation.

- ##### Markdown/HTML style comments

  In markdown you can write `<!--` and `-->` to comment out a section of your code. Our implementation is not _super_ smart:

  <!-- prettier-ignore -->
  ```html
  ## Metadata

  <!--  WIP: Maybe it should be called rectangle? -->

  Title: Square
  Author: Orta
  Editor: Orta Therox

  <!--
  Date: 2021-03-16
  -->
  ```

  The key is that a line has to start with `<!--` and eventually the same or another line has to **end** with `-->`.

- ##### Split character

  Provide hints for where one word terminates and the next begins in a single solution by declaring `SplitCharacter: {character}` in `Metadata`, and adding the chosen SplitCharacter between words in `Clues`.

  ```
  ## Metadata
  SplitCharacter: |

  ## Clues
  …
  D25. Father of Spider-Man ~ STAN|LEE
  ```

  The 'answer' given from the parser here will be 'STANLEE', but the indexes for each bar will be noted in the clue.

### Spec-Breaking Differences

We want to highlight that 'Clue Metadata', 'Comments' and 'Split Characters' are all spec-breaking extensions. E.g. a parser which conforms exactly to the xd spec would likely choke when seeing these features.

We'd be open to a variant of our `JSONToXD` function which produces spec-compliant versions of the xd files instead of just our extensions.

#### Metadata

- [Shrodinger's Squares](https://www.xwordinfo.com/Quantum). It's likely that a special form of Rebus will work here, for example:

  ```
  Rebus: 1=M|F
  ```

  Indicates to the game engine that the rebus for `1` on the grid can be _either_ `M` or `F`.

  ```
  Rebus: 1=M&F 2=L&T
  ```

  Indicates to the game engine that the rebus for `1` on the grid can be _either_ `M` or `F`, but that the side needs to be respected across all possible rebuses in the clue. So for `M1L2` you could have `MALE` and `FATE`but not `FALE` or `MATE`.

#### Notes

- `## Design`

  This is our WIP extension to describe the visual aspects of individual cells. The `xd` format uses lowercase letters in the grid to indicate a particular special trait (for example having a circle background.) We are looking at describing a more complex set of visual attributes, and so the puz -> xd parser uses a new section to indicate the design attributes in a manner similar to how rebuses are handled.

  ```md
  ## Design

  <style>
  O { background: circle }
  </style>

  ....###...#....
  ....##....#....
  ....#.....#....
  ............###
  ...#....##....#
  ......#....O...
  ##...#....#O...
  ..O....#...O...
  ..O.#....#.O.##
  ..O.....#..O...
  #.OO.##....#O..
  ###O........O..
  ...O#.....#.O..
  ...O#....##.O..
  ...O#...###.O..
  ```

- `## Start`

  Instead of starting with an board, create a board with letters pre-filled. For example this crossword would start with "GO" "FOR" and "IT" already in:

  ```
  ## Start

  GO..##FOR#IT...
  .....#...#.....
  .....#...#.....
  ####....#...###
  ....#.....#....
  .......#...#...
  ......#........
  ##...#...#...##
  ........#......
  ...#...#.......
  ....#.....#....
  ###...#....####
  .....#...#.....
  .....#...#.....
  .....#...##....
  ```

- `## Metapuzzle`

  We'd like a way to describe a final question and a final answer for a puzzle. For example, in alpha-bits above the circles indicate a letter pattern and there could be a way to respond that you got the theme. For example:

  ```md
  ## Metapuzzle

  How are the words sorted?

  > Alphabetic
  ```

  Case in the answer should be ignored by engines.

### Filetypes this lib is open to adding

- http://www.ipuz.org
- https://www.xwordinfo.com/XPF/ / https://www.xwordinfo.com/JSON/
