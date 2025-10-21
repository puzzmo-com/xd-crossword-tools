# xd-crossword-tools

[xd](https://github.com/century-arcade/xd/blob/master/doc/xd-format.md) is a text-based crossword format which is easy for humans to read and reason about.

This repo provides tools for taking different crossword file formats and converting them to xd. Then has a comprehensive xd to JSON function. Mostly conforms to the v2 xd spec, and comes with a few editor-experience extensions for a REPL-like environment. Uses a [vendored](./packages/xd-crossword-tools/src/vendor/) copy of 'puzjs' which was ported to TypeScript.

Runs and tested in production in node, browsers, React Native and edge runtimes.

There are two packages here:

- `xd-crossword-tools-parser` - A parser for the xd format, if you only want to convert an xd file to JSON and have a few helper functions for working with the JSON.
- `xd-crossword-tools` - A set of tools for working with the xd format: dev tooling, importing/exporting, diffing, linting etc.

### Example

Let's take this free `.puz`: https://dehodson.github.io/crossword-puzzles/crosswords/alpha-bits/

Their .puz file turns into this xd:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./tests/output/alpha-bits.xd) -->
<!-- The below code snippet is automatically added from ./tests/output/alpha-bits.xd -->

```xd
## Metadata

title: Alpha-Bits
author: Drew Hodson
copyright: © 2021
description: N/A

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
    "title:line": "2",
    "author:line": "3",
    "copyright": "© 2021",
    "copyright:line": "4",
    "description": "N/A",
    "description:line": "5"
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
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "28",
          "answer:unprocessed": "AHAB"
        },
        "display": [["text", "Captain of the Pequod"]],
        "direction": "across"
      },
      {
        "body": "Food for second chance chewing",
        "answer": "CUD",
        "number": 5,
        "position": {
          "col": 6,
          "index": 0
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "29",
          "answer:unprocessed": "CUD"
        },
        "display": [["text", "Food for second chance chewing"]],
        "direction": "across"
      },
      {
        "body": "Font feature",
        "answer": "SERIF",
        "number": 8,
        "position": {
          "col": 10,
          "index": 0
        },
        "tiles": [
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
        "metadata": {
          "body:line": "30",
          "answer:unprocessed": "SERIF"
        },
        "display": [["text", "Font feature"]],
        "direction": "across"
      },
      {
        "body": "Palindromic address to a female",
        "answer": "MADAM",
        "number": 13,
        "position": {
          "col": 0,
          "index": 1
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "31",
          "answer:unprocessed": "MADAM"
        },
        "display": [["text", "Palindromic address to a female"]],
        "direction": "across"
      },
      {
        "body": "___ Way You Want It",
        "answer": "ANY",
        "number": 15,
        "position": {
          "col": 6,
          "index": 1
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "32",
          "answer:unprocessed": "ANY"
        },
        "display": [["text", "___ Way You Want It"]],
        "direction": "across"
      },
      {
        "body": "Place often described as humble",
        "answer": "ABODE",
        "number": 16,
        "position": {
          "col": 10,
          "index": 1
        },
        "tiles": [
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
        "metadata": {
          "body:line": "33",
          "answer:unprocessed": "ABODE"
        },
        "display": [["text", "Place often described as humble"]],
        "direction": "across"
      },
      {
        "body": "Flat two dimensional surface in geometry",
        "answer": "PLANE",
        "number": 17,
        "position": {
          "col": 0,
          "index": 2
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "34",
          "answer:unprocessed": "PLANE"
        },
        "display": [["text", "Flat two dimensional surface in geometry"]],
        "direction": "across"
      },
      {
        "body": "Grim homophone of 7D",
        "answer": "DIE",
        "number": 18,
        "position": {
          "col": 6,
          "index": 2
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "35",
          "answer:unprocessed": "DIE"
        },
        "display": [["text", "Grim homophone of 7D"]],
        "direction": "across"
      },
      {
        "body": "Off",
        "answer": "NOTON",
        "number": 19,
        "position": {
          "col": 10,
          "index": 2
        },
        "tiles": [
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
        "metadata": {
          "body:line": "36",
          "answer:unprocessed": "NOTON"
        },
        "display": [["text", "Off"]],
        "direction": "across"
      },
      {
        "body": "Heading for some lists",
        "answer": "TODO",
        "number": 20,
        "position": {
          "col": 4,
          "index": 3
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "37",
          "answer:unprocessed": "TODO"
        },
        "display": [["text", "Heading for some lists"]],
        "direction": "across"
      },
      {
        "body": "Kanye West is famous for his",
        "answer": "EGO",
        "number": 22,
        "position": {
          "col": 9,
          "index": 3
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "38",
          "answer:unprocessed": "EGO"
        },
        "display": [["text", "Kanye West is famous for his"]],
        "direction": "across"
      },
      {
        "body": "Laceration",
        "answer": "GASH",
        "number": 23,
        "position": {
          "col": 0,
          "index": 4
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "39",
          "answer:unprocessed": "GASH"
        },
        "display": [["text", "Laceration"]],
        "direction": "across"
      },
      {
        "body": "Alias of Twitch star Richard Tyler Blevins",
        "answer": "NINJA",
        "number": 27,
        "position": {
          "col": 5,
          "index": 4
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "40",
          "answer:unprocessed": "NINJA"
        },
        "display": [["text", "Alias of Twitch star Richard Tyler Blevins"]],
        "direction": "across"
      },
      {
        "body": "Capsize",
        "answer": "KEEL",
        "number": 29,
        "position": {
          "col": 11,
          "index": 4
        },
        "tiles": [
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
        "metadata": {
          "body:line": "41",
          "answer:unprocessed": "KEEL"
        },
        "display": [["text", "Capsize"]],
        "direction": "across"
      },
      {
        "body": "Piece of clothing or print",
        "answer": "ARTICLE",
        "number": 33,
        "position": {
          "col": 0,
          "index": 5
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "42",
          "answer:unprocessed": "ARTICLE"
        },
        "display": [["text", "Piece of clothing or print"]],
        "direction": "across"
      },
      {
        "body": "Evangelical school in Tulsa, OK",
        "answer": "ORU",
        "number": 35,
        "position": {
          "col": 8,
          "index": 5
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "43",
          "answer:unprocessed": "ORU"
        },
        "display": [["text", "Evangelical school in Tulsa, OK"]],
        "direction": "across"
      },
      {
        "body": "___-eyed",
        "answer": "DOE",
        "number": 37,
        "position": {
          "col": 12,
          "index": 5
        },
        "tiles": [
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
        "metadata": {
          "body:line": "44",
          "answer:unprocessed": "DOE"
        },
        "display": [["text", "___-eyed"]],
        "direction": "across"
      },
      {
        "body": "Annual",
        "answer": "YEARLY",
        "number": 38,
        "position": {
          "col": 0,
          "index": 6
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "45",
          "answer:unprocessed": "YEARLY"
        },
        "display": [["text", "Annual"]],
        "direction": "across"
      },
      {
        "body": "The stamp with the upside down airplane is a famous one",
        "answer": "MISPRINT",
        "number": 39,
        "position": {
          "col": 7,
          "index": 6
        },
        "tiles": [
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
        "metadata": {
          "body:line": "46",
          "answer:unprocessed": "MISPRINT"
        },
        "display": [["text", "The stamp with the upside down airplane is a famous one"]],
        "direction": "across"
      },
      {
        "body": "With 42A and Marcus, a luxury department store chain",
        "answer": "NEI",
        "number": 41,
        "position": {
          "col": 2,
          "index": 7
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "47",
          "answer:unprocessed": "NEI"
        },
        "display": [["text", "With 42A and Marcus, a luxury department store chain"]],
        "direction": "across"
      },
      {
        "body": "41A continued",
        "answer": "MAN",
        "number": 42,
        "position": {
          "col": 6,
          "index": 7
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "48",
          "answer:unprocessed": "MAN"
        },
        "display": [["text", "41A continued"]],
        "direction": "across"
      },
      {
        "body": "Lush",
        "answer": "SOT",
        "number": 43,
        "position": {
          "col": 10,
          "index": 7
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "49",
          "answer:unprocessed": "SOT"
        },
        "display": [["text", "Lush"]],
        "direction": "across"
      },
      {
        "body": "The Mayan one ended in 2012",
        "answer": "CALENDAR",
        "number": 44,
        "position": {
          "col": 0,
          "index": 8
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "50",
          "answer:unprocessed": "CALENDAR"
        },
        "display": [["text", "The Mayan one ended in 2012"]],
        "direction": "across"
      },
      {
        "body": "What a child often does to their shoes",
        "answer": "RETIES",
        "number": 47,
        "position": {
          "col": 9,
          "index": 8
        },
        "tiles": [
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
        "metadata": {
          "body:line": "51",
          "answer:unprocessed": "RETIES"
        },
        "display": [["text", "What a child often does to their shoes"]],
        "direction": "across"
      },
      {
        "body": "Vanilla ___",
        "answer": "ICE",
        "number": 50,
        "position": {
          "col": 0,
          "index": 9
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "52",
          "answer:unprocessed": "ICE"
        },
        "display": [["text", "Vanilla ___"]],
        "direction": "across"
      },
      {
        "body": "Maligned cigarette ingredient",
        "answer": "TAR",
        "number": 51,
        "position": {
          "col": 4,
          "index": 9
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "53",
          "answer:unprocessed": "TAR"
        },
        "display": [["text", "Maligned cigarette ingredient"]],
        "direction": "across"
      },
      {
        "body": "Frequent cause for a new tire",
        "answer": "POTHOLE",
        "number": 52,
        "position": {
          "col": 8,
          "index": 9
        },
        "tiles": [
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
        "metadata": {
          "body:line": "54",
          "answer:unprocessed": "POTHOLE"
        },
        "display": [["text", "Frequent cause for a new tire"]],
        "direction": "across"
      },
      {
        "body": "Los Angeles heavy metal act",
        "answer": "OTEP",
        "number": 53,
        "position": {
          "col": 0,
          "index": 10
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "55",
          "answer:unprocessed": "OTEP"
        },
        "display": [["text", "Los Angeles heavy metal act"]],
        "direction": "across"
      },
      {
        "body": "Bldgs. such as the Googleplex",
        "answer": "HQTRS",
        "number": 55,
        "position": {
          "col": 5,
          "index": 10
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "56",
          "answer:unprocessed": "HQTRS"
        },
        "display": [["text", "Bldgs. such as the Googleplex"]],
        "direction": "across"
      },
      {
        "body": "A fit of irritation",
        "answer": "SNIT",
        "number": 57,
        "position": {
          "col": 11,
          "index": 10
        },
        "tiles": [
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
        "metadata": {
          "body:line": "57",
          "answer:unprocessed": "SNIT"
        },
        "display": [["text", "A fit of irritation"]],
        "direction": "across"
      },
      {
        "body": "Lead-in to American or day",
        "answer": "ALL",
        "number": 58,
        "position": {
          "col": 3,
          "index": 11
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "58",
          "answer:unprocessed": "ALL"
        },
        "display": [["text", "Lead-in to American or day"]],
        "direction": "across"
      },
      {
        "body": "What Pokémon do at a Pokémon Center",
        "answer": "HEAL",
        "number": 60,
        "position": {
          "col": 7,
          "index": 11
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "59",
          "answer:unprocessed": "HEAL"
        },
        "display": [["text", "What Pokémon do at a Pokémon Center"]],
        "direction": "across"
      },
      {
        "body": "Nixon's vice",
        "answer": "SPIRO",
        "number": 62,
        "position": {
          "col": 0,
          "index": 12
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "60",
          "answer:unprocessed": "SPIRO"
        },
        "display": [["text", "Nixon's vice"]],
        "direction": "across"
      },
      {
        "body": "Nothing but ___",
        "answer": "NET",
        "number": 65,
        "position": {
          "col": 6,
          "index": 12
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "61",
          "answer:unprocessed": "NET"
        },
        "display": [["text", "Nothing but ___"]],
        "direction": "across"
      },
      {
        "body": "One with the world on his shoulders",
        "answer": "ATLAS",
        "number": 66,
        "position": {
          "col": 10,
          "index": 12
        },
        "tiles": [
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
        "metadata": {
          "body:line": "62",
          "answer:unprocessed": "ATLAS"
        },
        "display": [["text", "One with the world on his shoulders"]],
        "direction": "across"
      },
      {
        "body": "Filled pastries",
        "answer": "TARTS",
        "number": 71,
        "position": {
          "col": 0,
          "index": 13
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "63",
          "answer:unprocessed": "TARTS"
        },
        "display": [["text", "Filled pastries"]],
        "direction": "across"
      },
      {
        "body": "Age, in Milan",
        "answer": "ETA",
        "number": 72,
        "position": {
          "col": 6,
          "index": 13
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "64",
          "answer:unprocessed": "ETA"
        },
        "display": [["text", "Age, in Milan"]],
        "direction": "across"
      },
      {
        "body": "Lorna ___, novel or cookie",
        "answer": "DOONE",
        "number": 73,
        "position": {
          "col": 10,
          "index": 13
        },
        "tiles": [
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
        "metadata": {
          "body:line": "65",
          "answer:unprocessed": "DOONE"
        },
        "display": [["text", "Lorna ___, novel or cookie"]],
        "direction": "across"
      },
      {
        "body": "Electrocardiogram readout feature",
        "answer": "UWAVE",
        "number": 74,
        "position": {
          "col": 0,
          "index": 14
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "66",
          "answer:unprocessed": "UWAVE"
        },
        "display": [["text", "Electrocardiogram readout feature"]],
        "direction": "across"
      },
      {
        "body": "Hip slang for records",
        "answer": "WAX",
        "number": 75,
        "position": {
          "col": 6,
          "index": 14
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "67",
          "answer:unprocessed": "WAX"
        },
        "display": [["text", "Hip slang for records"]],
        "direction": "across"
      },
      {
        "body": "Yiddish for a foolish person",
        "answer": "YUTZ",
        "number": 76,
        "position": {
          "col": 11,
          "index": 14
        },
        "tiles": [
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
        ],
        "metadata": {
          "body:line": "68",
          "answer:unprocessed": "YUTZ"
        },
        "display": [["text", "Yiddish for a foolish person"]],
        "direction": "across"
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
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "A"
          },
          {
            "type": "letter",
            "letter": "M"
          },
          {
            "type": "letter",
            "letter": "P"
          }
        ],
        "metadata": {
          "body:line": "70",
          "answer:unprocessed": "AMP"
        },
        "display": [["text", "Pc. of concert gear"]],
        "direction": "down"
      },
      {
        "body": "AI antagonist of 2001",
        "answer": "HAL",
        "number": 2,
        "position": {
          "col": 1,
          "index": 0
        },
        "tiles": [
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
            "letter": "L"
          }
        ],
        "metadata": {
          "body:line": "71",
          "answer:unprocessed": "HAL"
        },
        "display": [["text", "AI antagonist of 2001"]],
        "direction": "down"
      },
      {
        "body": "Programming pioneer Lovelace",
        "answer": "ADA",
        "number": 3,
        "position": {
          "col": 2,
          "index": 0
        },
        "tiles": [
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
          }
        ],
        "metadata": {
          "body:line": "72",
          "answer:unprocessed": "ADA"
        },
        "display": [["text", "Programming pioneer Lovelace"]],
        "direction": "down"
      },
      {
        "body": "Prohibit",
        "answer": "BAN",
        "number": 4,
        "position": {
          "col": 3,
          "index": 0
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "B"
          },
          {
            "type": "letter",
            "letter": "A"
          },
          {
            "type": "letter",
            "letter": "N"
          }
        ],
        "metadata": {
          "body:line": "73",
          "answer:unprocessed": "BAN"
        },
        "display": [["text", "Prohibit"]],
        "direction": "down"
      },
      {
        "body": "Type of person to routinely carry a club",
        "answer": "CADDIE",
        "number": 5,
        "position": {
          "col": 6,
          "index": 0
        },
        "tiles": [
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
            "letter": "D"
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
          }
        ],
        "metadata": {
          "body:line": "74",
          "answer:unprocessed": "CADDIE"
        },
        "display": [["text", "Type of person to routinely carry a club"]],
        "direction": "down"
      },
      {
        "body": "State of the ___ Address",
        "answer": "UNION",
        "number": 6,
        "position": {
          "col": 7,
          "index": 0
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "U"
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
            "letter": "O"
          },
          {
            "type": "letter",
            "letter": "N"
          }
        ],
        "metadata": {
          "body:line": "75",
          "answer:unprocessed": "UNION"
        },
        "display": [["text", "State of the ___ Address"]],
        "direction": "down"
      },
      {
        "body": "Colorful homophone of 18A",
        "answer": "DYE",
        "number": 7,
        "position": {
          "col": 8,
          "index": 0
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "D"
          },
          {
            "type": "letter",
            "letter": "Y"
          },
          {
            "type": "letter",
            "letter": "E"
          }
        ],
        "metadata": {
          "body:line": "76",
          "answer:unprocessed": "DYE"
        },
        "display": [["text", "Colorful homophone of 18A"]],
        "direction": "down"
      },
      {
        "body": "Snitched",
        "answer": "SANG",
        "number": 8,
        "position": {
          "col": 10,
          "index": 0
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "S"
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
            "letter": "G"
          }
        ],
        "metadata": {
          "body:line": "77",
          "answer:unprocessed": "SANG"
        },
        "display": [["text", "Snitched"]],
        "direction": "down"
      },
      {
        "body": "Kindle fare",
        "answer": "EBOOK",
        "number": 9,
        "position": {
          "col": 11,
          "index": 0
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "E"
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
            "letter": "O"
          },
          {
            "type": "letter",
            "letter": "K"
          }
        ],
        "metadata": {
          "body:line": "78",
          "answer:unprocessed": "EBOOK"
        },
        "display": [["text", "Kindle fare"]],
        "direction": "down"
      },
      {
        "body": "Decayed matter",
        "answer": "ROT",
        "number": 10,
        "position": {
          "col": 12,
          "index": 0
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "R"
          },
          {
            "type": "letter",
            "letter": "O"
          },
          {
            "type": "letter",
            "letter": "T"
          }
        ],
        "metadata": {
          "body:line": "79",
          "answer:unprocessed": "ROT"
        },
        "display": [["text", "Decayed matter"]],
        "direction": "down"
      },
      {
        "body": "Type of response you hope to get at the altar",
        "answer": "IDO",
        "number": 11,
        "position": {
          "col": 13,
          "index": 0
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "I"
          },
          {
            "type": "letter",
            "letter": "D"
          },
          {
            "type": "letter",
            "letter": "O"
          }
        ],
        "metadata": {
          "body:line": "80",
          "answer:unprocessed": "IDO"
        },
        "display": [["text", "Type of response you hope to get at the altar"]],
        "direction": "down"
      },
      {
        "body": "Peat-accumulating wetland",
        "answer": "FEN",
        "number": 12,
        "position": {
          "col": 14,
          "index": 0
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "F"
          },
          {
            "type": "letter",
            "letter": "E"
          },
          {
            "type": "letter",
            "letter": "N"
          }
        ],
        "metadata": {
          "body:line": "81",
          "answer:unprocessed": "FEN"
        },
        "display": [["text", "Peat-accumulating wetland"]],
        "direction": "down"
      },
      {
        "body": "The ___, NY art museum",
        "answer": "MET",
        "number": 14,
        "position": {
          "col": 4,
          "index": 1
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "M"
          },
          {
            "type": "letter",
            "letter": "E"
          },
          {
            "type": "letter",
            "letter": "T"
          }
        ],
        "metadata": {
          "body:line": "82",
          "answer:unprocessed": "MET"
        },
        "display": [["text", "The ___, NY art museum"]],
        "direction": "down"
      },
      {
        "body": "___Fans",
        "answer": "ONLY",
        "number": 21,
        "position": {
          "col": 5,
          "index": 3
        },
        "tiles": [
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
            "letter": "L"
          },
          {
            "type": "letter",
            "letter": "Y"
          }
        ],
        "metadata": {
          "body:line": "83",
          "answer:unprocessed": "ONLY"
        },
        "display": [["text", "___Fans"]],
        "direction": "down"
      },
      {
        "body": "Friends, Romans, countrymen, lend me your...",
        "answer": "EARS",
        "number": 22,
        "position": {
          "col": 9,
          "index": 3
        },
        "tiles": [
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
            "letter": "S"
          }
        ],
        "metadata": {
          "body:line": "84",
          "answer:unprocessed": "EARS"
        },
        "display": [["text", "Friends, Romans, countrymen, lend me your..."]],
        "direction": "down"
      },
      {
        "body": "\"Friend of Dorothy\"",
        "answer": "GAY",
        "number": 23,
        "position": {
          "col": 0,
          "index": 4
        },
        "tiles": [
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
            "letter": "Y"
          }
        ],
        "metadata": {
          "body:line": "85",
          "answer:unprocessed": "GAY"
        },
        "display": [["text", "\"Friend of Dorothy\""]],
        "direction": "down"
      },
      {
        "body": "We ___ the Champions",
        "answer": "ARE",
        "number": 24,
        "position": {
          "col": 1,
          "index": 4
        },
        "tiles": [
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
            "letter": "E"
          }
        ],
        "metadata": {
          "body:line": "86",
          "answer:unprocessed": "ARE"
        },
        "display": [["text", "We ___ the Champions"]],
        "direction": "down"
      },
      {
        "body": "Father of Spider-Man",
        "answer": "STANLEE",
        "number": 25,
        "position": {
          "col": 2,
          "index": 4
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "S"
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
            "letter": "N"
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
            "letter": "E"
          }
        ],
        "metadata": {
          "body:line": "87",
          "answer:unprocessed": "STANLEE"
        },
        "display": [["text", "Father of Spider-Man"]],
        "direction": "down"
      },
      {
        "body": "What a certain applicant becomes",
        "answer": "HIREE",
        "number": 26,
        "position": {
          "col": 3,
          "index": 4
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "H"
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
            "letter": "E"
          },
          {
            "type": "letter",
            "letter": "E"
          }
        ],
        "metadata": {
          "body:line": "88",
          "answer:unprocessed": "HIREE"
        },
        "display": [["text", "What a certain applicant becomes"]],
        "direction": "down"
      },
      {
        "body": "Connect",
        "answer": "JOIN",
        "number": 28,
        "position": {
          "col": 8,
          "index": 4
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "J"
          },
          {
            "type": "letter",
            "letter": "O"
          },
          {
            "type": "letter",
            "letter": "I"
          },
          {
            "type": "letter",
            "letter": "N"
          }
        ],
        "metadata": {
          "body:line": "89",
          "answer:unprocessed": "JOIN"
        },
        "display": [["text", "Connect"]],
        "direction": "down"
      },
      {
        "body": "Particular form of a published text",
        "answer": "EDITION",
        "number": 30,
        "position": {
          "col": 12,
          "index": 4
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "E"
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
            "letter": "T"
          },
          {
            "type": "letter",
            "letter": "I"
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
        "metadata": {
          "body:line": "90",
          "answer:unprocessed": "EDITION"
        },
        "display": [["text", "Particular form of a published text"]],
        "direction": "down"
      },
      {
        "body": "Suffix at the end of all of Eevee's evolutions",
        "answer": "EON",
        "number": 31,
        "position": {
          "col": 13,
          "index": 4
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "E"
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
        "metadata": {
          "body:line": "91",
          "answer:unprocessed": "EON"
        },
        "display": [["text", "Suffix at the end of all of Eevee's evolutions"]],
        "direction": "down"
      },
      {
        "body": "Live and ___ Die",
        "answer": "LET",
        "number": 32,
        "position": {
          "col": 14,
          "index": 4
        },
        "tiles": [
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
            "letter": "T"
          }
        ],
        "metadata": {
          "body:line": "92",
          "answer:unprocessed": "LET"
        },
        "display": [["text", "Live and ___ Die"]],
        "direction": "down"
      },
      {
        "body": "Famous Eastwood whose name became a famous Gorillaz song",
        "answer": "CLINT",
        "number": 34,
        "position": {
          "col": 4,
          "index": 5
        },
        "tiles": [
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
        "metadata": {
          "body:line": "93",
          "answer:unprocessed": "CLINT"
        },
        "display": [["text", "Famous Eastwood whose name became a famous Gorillaz song"]],
        "direction": "down"
      },
      {
        "body": "Unexpected result in a sporting competition",
        "answer": "UPSET",
        "number": 36,
        "position": {
          "col": 10,
          "index": 5
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "U"
          },
          {
            "type": "letter",
            "letter": "P"
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
            "letter": "T"
          }
        ],
        "metadata": {
          "body:line": "94",
          "answer:unprocessed": "UPSET"
        },
        "display": [["text", "Unexpected result in a sporting competition"]],
        "direction": "down"
      },
      {
        "body": "Disfigure",
        "answer": "MAR",
        "number": 39,
        "position": {
          "col": 7,
          "index": 6
        },
        "tiles": [
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
            "letter": "R"
          }
        ],
        "metadata": {
          "body:line": "95",
          "answer:unprocessed": "MAR"
        },
        "display": [["text", "Disfigure"]],
        "direction": "down"
      },
      {
        "body": "David Lee and Tim",
        "answer": "ROTHS",
        "number": 40,
        "position": {
          "col": 11,
          "index": 6
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "R"
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
            "letter": "S"
          }
        ],
        "metadata": {
          "body:line": "96",
          "answer:unprocessed": "ROTHS"
        },
        "display": [["text", "David Lee and Tim"]],
        "direction": "down"
      },
      {
        "body": "Luxury watch collection by Garmin",
        "answer": "MARQ",
        "number": 42,
        "position": {
          "col": 6,
          "index": 7
        },
        "tiles": [
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
            "letter": "R"
          },
          {
            "type": "letter",
            "letter": "Q"
          }
        ],
        "metadata": {
          "body:line": "97",
          "answer:unprocessed": "MARQ"
        },
        "display": [["text", "Luxury watch collection by Garmin"]],
        "direction": "down"
      },
      {
        "body": "Top dog in an IT org",
        "answer": "CIO",
        "number": 44,
        "position": {
          "col": 0,
          "index": 8
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "C"
          },
          {
            "type": "letter",
            "letter": "I"
          },
          {
            "type": "letter",
            "letter": "O"
          }
        ],
        "metadata": {
          "body:line": "98",
          "answer:unprocessed": "CIO"
        },
        "display": [["text", "Top dog in an IT org"]],
        "direction": "down"
      },
      {
        "body": "Sister ___",
        "answer": "ACT",
        "number": 45,
        "position": {
          "col": 1,
          "index": 8
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "A"
          },
          {
            "type": "letter",
            "letter": "C"
          },
          {
            "type": "letter",
            "letter": "T"
          }
        ],
        "metadata": {
          "body:line": "99",
          "answer:unprocessed": "ACT"
        },
        "display": [["text", "Sister ___"]],
        "direction": "down"
      },
      {
        "body": "Author Roald",
        "answer": "DAHL",
        "number": 46,
        "position": {
          "col": 5,
          "index": 8
        },
        "tiles": [
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
            "letter": "H"
          },
          {
            "type": "letter",
            "letter": "L"
          }
        ],
        "metadata": {
          "body:line": "100",
          "answer:unprocessed": "DAHL"
        },
        "display": [["text", "Author Roald"]],
        "direction": "down"
      },
      {
        "body": "Civil rights activist Parks",
        "answer": "ROSA",
        "number": 47,
        "position": {
          "col": 9,
          "index": 8
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "R"
          },
          {
            "type": "letter",
            "letter": "O"
          },
          {
            "type": "letter",
            "letter": "S"
          },
          {
            "type": "letter",
            "letter": "A"
          }
        ],
        "metadata": {
          "body:line": "101",
          "answer:unprocessed": "ROSA"
        },
        "display": [["text", "Civil rights activist Parks"]],
        "direction": "down"
      },
      {
        "body": "An additional name that could be part of 40D's clue",
        "answer": "ELI",
        "number": 48,
        "position": {
          "col": 13,
          "index": 8
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "E"
          },
          {
            "type": "letter",
            "letter": "L"
          },
          {
            "type": "letter",
            "letter": "I"
          }
        ],
        "metadata": {
          "body:line": "102",
          "answer:unprocessed": "ELI"
        },
        "display": [["text", "An additional name that could be part of 40D's clue"]],
        "direction": "down"
      },
      {
        "body": "Director's domain",
        "answer": "SET",
        "number": 49,
        "position": {
          "col": 14,
          "index": 8
        },
        "tiles": [
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
            "letter": "T"
          }
        ],
        "metadata": {
          "body:line": "103",
          "answer:unprocessed": "SET"
        },
        "display": [["text", "Director's domain"]],
        "direction": "down"
      },
      {
        "body": "Type of income to go in a 401k",
        "answer": "PRETAX",
        "number": 52,
        "position": {
          "col": 8,
          "index": 9
        },
        "tiles": [
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
            "type": "letter",
            "letter": "X"
          }
        ],
        "metadata": {
          "body:line": "104",
          "answer:unprocessed": "PRETAX"
        },
        "display": [["text", "Type of income to go in a 401k"]],
        "direction": "down"
      },
      {
        "body": "The Empire Strikes Back, to the Star Wars saga",
        "answer": "PARTV",
        "number": 54,
        "position": {
          "col": 3,
          "index": 10
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "P"
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
            "letter": "V"
          }
        ],
        "metadata": {
          "body:line": "105",
          "answer:unprocessed": "PARTV"
        },
        "display": [["text", "The Empire Strikes Back, to the Star Wars saga"]],
        "direction": "down"
      },
      {
        "body": "Greek letter following 72A",
        "answer": "THETA",
        "number": 56,
        "position": {
          "col": 7,
          "index": 10
        },
        "tiles": [
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
            "letter": "E"
          },
          {
            "type": "letter",
            "letter": "T"
          },
          {
            "type": "letter",
            "letter": "A"
          }
        ],
        "metadata": {
          "body:line": "106",
          "answer:unprocessed": "THETA"
        },
        "display": [["text", "Greek letter following 72A"]],
        "direction": "down"
      },
      {
        "body": "Misplace",
        "answer": "LOSE",
        "number": 59,
        "position": {
          "col": 4,
          "index": 11
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "L"
          },
          {
            "type": "letter",
            "letter": "O"
          },
          {
            "type": "letter",
            "letter": "S"
          },
          {
            "type": "letter",
            "letter": "E"
          }
        ],
        "metadata": {
          "body:line": "107",
          "answer:unprocessed": "LOSE"
        },
        "display": [["text", "Misplace"]],
        "direction": "down"
      },
      {
        "body": "Wee boy",
        "answer": "LAD",
        "number": 61,
        "position": {
          "col": 10,
          "index": 11
        },
        "tiles": [
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
            "letter": "D"
          }
        ],
        "metadata": {
          "body:line": "108",
          "answer:unprocessed": "LAD"
        },
        "display": [["text", "Wee boy"]],
        "direction": "down"
      },
      {
        "body": "Dad to Tommy Pickles",
        "answer": "STU",
        "number": 62,
        "position": {
          "col": 0,
          "index": 12
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "S"
          },
          {
            "type": "letter",
            "letter": "T"
          },
          {
            "type": "letter",
            "letter": "U"
          }
        ],
        "metadata": {
          "body:line": "109",
          "answer:unprocessed": "STU"
        },
        "display": [["text", "Dad to Tommy Pickles"]],
        "direction": "down"
      },
      {
        "body": "The only Patrol I trust",
        "answer": "PAW",
        "number": 63,
        "position": {
          "col": 1,
          "index": 12
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "P"
          },
          {
            "type": "letter",
            "letter": "A"
          },
          {
            "type": "letter",
            "letter": "W"
          }
        ],
        "metadata": {
          "body:line": "110",
          "answer:unprocessed": "PAW"
        },
        "display": [["text", "The only Patrol I trust"]],
        "direction": "down"
      },
      {
        "body": "Smart savings plan, briefly",
        "answer": "IRA",
        "number": 64,
        "position": {
          "col": 2,
          "index": 12
        },
        "tiles": [
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
            "letter": "A"
          }
        ],
        "metadata": {
          "body:line": "111",
          "answer:unprocessed": "IRA"
        },
        "display": [["text", "Smart savings plan, briefly"]],
        "direction": "down"
      },
      {
        "body": "Fresh",
        "answer": "NEW",
        "number": 65,
        "position": {
          "col": 6,
          "index": 12
        },
        "tiles": [
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
            "letter": "W"
          }
        ],
        "metadata": {
          "body:line": "112",
          "answer:unprocessed": "NEW"
        },
        "display": [["text", "Fresh"]],
        "direction": "down"
      },
      {
        "body": "Breeds such as Chihuahua or Pomeranian",
        "answer": "TOY",
        "number": 67,
        "position": {
          "col": 11,
          "index": 12
        },
        "tiles": [
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
            "letter": "Y"
          }
        ],
        "metadata": {
          "body:line": "113",
          "answer:unprocessed": "TOY"
        },
        "display": [["text", "Breeds such as Chihuahua or Pomeranian"]],
        "direction": "down"
      },
      {
        "body": "Bega behind \"Mambo No. 5\"",
        "answer": "LOU",
        "number": 68,
        "position": {
          "col": 12,
          "index": 12
        },
        "tiles": [
          {
            "type": "letter",
            "letter": "L"
          },
          {
            "type": "letter",
            "letter": "O"
          },
          {
            "type": "letter",
            "letter": "U"
          }
        ],
        "metadata": {
          "body:line": "114",
          "answer:unprocessed": "LOU"
        },
        "display": [["text", "Bega behind \"Mambo No. 5\""]],
        "direction": "down"
      },
      {
        "body": "Aardvark breakfast",
        "answer": "ANT",
        "number": 69,
        "position": {
          "col": 13,
          "index": 12
        },
        "tiles": [
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
            "letter": "T"
          }
        ],
        "metadata": {
          "body:line": "115",
          "answer:unprocessed": "ANT"
        },
        "display": [["text", "Aardvark breakfast"]],
        "direction": "down"
      },
      {
        "body": "Sonic ___",
        "answer": "SEZ",
        "number": 70,
        "position": {
          "col": 14,
          "index": 12
        },
        "tiles": [
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
            "letter": "Z"
          }
        ],
        "metadata": {
          "body:line": "116",
          "answer:unprocessed": "SEZ"
        },
        "display": [["text", "Sonic ___"]],
        "direction": "down"
      }
    ]
  },
  "rebuses": {},
  "notes": "",
  "report": {
    "success": true,
    "errors": [],
    "warnings": []
  },
  "editorInfo": {
    "sections": [
      {
        "startLine": 0,
        "endLine": 6,
        "type": "metadata"
      },
      {
        "startLine": 7,
        "endLine": 25,
        "type": "grid"
      },
      {
        "startLine": 26,
        "endLine": 117,
        "type": "clues"
      },
      {
        "startLine": 118,
        "endLine": 119,
        "type": "notes"
      },
      {
        "startLine": 120,
        "endLine": 140,
        "type": "design"
      }
    ],
    "lines": [
      "## Metadata",
      "",
      "title: Alpha-Bits",
      "author: Drew Hodson",
      "copyright: © 2021",
      "description: N/A",
      "",
      "## Grid",
      "",
      "AHAB..CUD.SERIF",
      "MADAM.ANY.ABODE",
      "PLANE.DIE.NOTON",
      "....TODO.EGO...",
      "GASH.NINJA.KEEL",
      "ARTICLE.ORU.DOE",
      "YEARLY.MISPRINT",
      "..NEI.MAN.SOT..",
      "CALENDAR.RETIES",
      "ICE.TAR.POTHOLE",
      "OTEP.HQTRS.SNIT",
      "...ALL.HEAL....",
      "SPIRO.NET.ATLAS",
      "TARTS.ETA.DOONE",
      "UWAVE.WAX..YUTZ",
      "",
      "",
      "## Clues",
      "",
      "A1. Captain of the Pequod ~ AHAB",
      "A5. Food for second chance chewing ~ CUD",
      "A8. Font feature ~ SERIF",
      "A13. Palindromic address to a female ~ MADAM",
      "A15. ___ Way You Want It ~ ANY",
      "A16. Place often described as humble ~ ABODE",
      "A17. Flat two dimensional surface in geometry ~ PLANE",
      "A18. Grim homophone of 7D ~ DIE",
      "A19. Off ~ NOTON",
      "A20. Heading for some lists ~ TODO",
      "A22. Kanye West is famous for his ~ EGO",
      "A23. Laceration ~ GASH",
      "A27. Alias of Twitch star Richard Tyler Blevins ~ NINJA",
      "A29. Capsize ~ KEEL",
      "A33. Piece of clothing or print ~ ARTICLE",
      "A35. Evangelical school in Tulsa, OK ~ ORU",
      "A37. ___-eyed ~ DOE",
      "A38. Annual ~ YEARLY",
      "A39. The stamp with the upside down airplane is a famous one ~ MISPRINT",
      "A41. With 42A and Marcus, a luxury department store chain ~ NEI",
      "A42. 41A continued ~ MAN",
      "A43. Lush ~ SOT",
      "A44. The Mayan one ended in 2012 ~ CALENDAR",
      "A47. What a child often does to their shoes ~ RETIES",
      "A50. Vanilla ___ ~ ICE",
      "A51. Maligned cigarette ingredient ~ TAR",
      "A52. Frequent cause for a new tire ~ POTHOLE",
      "A53. Los Angeles heavy metal act ~ OTEP",
      "A55. Bldgs. such as the Googleplex ~ HQTRS",
      "A57. A fit of irritation ~ SNIT",
      "A58. Lead-in to American or day ~ ALL",
      "A60. What Pokémon do at a Pokémon Center ~ HEAL",
      "A62. Nixon's vice ~ SPIRO",
      "A65. Nothing but ___ ~ NET",
      "A66. One with the world on his shoulders ~ ATLAS",
      "A71. Filled pastries ~ TARTS",
      "A72. Age, in Milan ~ ETA",
      "A73. Lorna ___, novel or cookie ~ DOONE",
      "A74. Electrocardiogram readout feature ~ UWAVE",
      "A75. Hip slang for records ~ WAX",
      "A76. Yiddish for a foolish person ~ YUTZ",
      "",
      "D1. Pc. of concert gear ~ AMP",
      "D2. AI antagonist of 2001 ~ HAL",
      "D3. Programming pioneer Lovelace ~ ADA",
      "D4. Prohibit ~ BAN",
      "D5. Type of person to routinely carry a club ~ CADDIE",
      "D6. State of the ___ Address ~ UNION",
      "D7. Colorful homophone of 18A ~ DYE",
      "D8. Snitched ~ SANG",
      "D9. Kindle fare ~ EBOOK",
      "D10. Decayed matter ~ ROT",
      "D11. Type of response you hope to get at the altar ~ IDO",
      "D12. Peat-accumulating wetland ~ FEN",
      "D14. The ___, NY art museum ~ MET",
      "D21. ___Fans ~ ONLY",
      "D22. Friends, Romans, countrymen, lend me your... ~ EARS",
      "D23. \"Friend of Dorothy\" ~ GAY",
      "D24. We ___ the Champions ~ ARE",
      "D25. Father of Spider-Man ~ STANLEE",
      "D26. What a certain applicant becomes ~ HIREE",
      "D28. Connect ~ JOIN",
      "D30. Particular form of a published text ~ EDITION",
      "D31. Suffix at the end of all of Eevee's evolutions ~ EON",
      "D32. Live and ___ Die ~ LET",
      "D34. Famous Eastwood whose name became a famous Gorillaz song ~ CLINT",
      "D36. Unexpected result in a sporting competition ~ UPSET",
      "D39. Disfigure ~ MAR",
      "D40. David Lee and Tim ~ ROTHS",
      "D42. Luxury watch collection by Garmin ~ MARQ",
      "D44. Top dog in an IT org ~ CIO",
      "D45. Sister ___ ~ ACT",
      "D46. Author Roald ~ DAHL",
      "D47. Civil rights activist Parks ~ ROSA",
      "D48. An additional name that could be part of 40D's clue ~ ELI",
      "D49. Director's domain ~ SET",
      "D52. Type of income to go in a 401k ~ PRETAX",
      "D54. The Empire Strikes Back, to the Star Wars saga ~ PARTV",
      "D56. Greek letter following 72A ~ THETA",
      "D59. Misplace ~ LOSE",
      "D61. Wee boy ~ LAD",
      "D62. Dad to Tommy Pickles ~ STU",
      "D63. The only Patrol I trust ~ PAW",
      "D64. Smart savings plan, briefly ~ IRA",
      "D65. Fresh ~ NEW",
      "D67. Breeds such as Chihuahua or Pomeranian ~ TOY",
      "D68. Bega behind \"Mambo No. 5\" ~ LOU",
      "D69. Aardvark breakfast ~ ANT",
      "D70. Sonic ___ ~ SEZ",
      "",
      "## Notes",
      "",
      "## Design",
      "",
      "<style>O { background: circle }</style>",
      "",
      "O..O##O.O#.O..O",
      ".....#...#.....",
      ".....#...#.....",
      "####....#...###",
      "O..O#.O.O.#O..O",
      ".......#...#...",
      "......#........",
      "##...#O.O#...##",
      "........#......",
      "...#...#.......",
      "O..O#.O.O.#O..O",
      "###...#....####",
      ".....#...#.....",
      ".....#...#.....",
      "O..O.#O.O##O..O",
      ""
    ]
  },
  "design": {
    "styles": {
      "O": {
        "background": "circle"
      }
    },
    "positions": [
      ["O", null, null, "O", null, null, "O", null, "O", null, null, "O", null, null, "O"],
      [],
      [],
      [],
      ["O", null, null, "O", null, null, "O", null, "O", null, null, "O", null, null, "O"],
      [],
      [],
      [null, null, null, null, null, null, "O", null, "O"],
      [],
      [],
      ["O", null, null, "O", null, null, "O", null, "O", null, null, "O", null, null, "O"],
      [],
      [],
      [],
      ["O", null, null, "O", null, null, "O", null, "O", null, null, "O", null, null, "O"]
    ]
  }
}
```

<!-- AUTO-GENERATED-CONTENT:END -->

</details>

## Import / Export

### .xd to .JSON

This is effectively the only function which matters in `xd-crossword-tools-parser`.

```ts
import { xdToJSON } from "xd-crossword-tools-parser"

const xd = "[...]"
const crossword = xdToJSON(xd)
```

The JSON format is a bit more verbose than you might expect (see above for an example), but the goal is to have as much information pre-computed at parse time in order to save lookups later at runtime. You should use `crossword.report` to determine the parsing's success. You can see the type definitions here: [`./packages/xd-crossword-tools-parser/src/types.ts`](./packages/xd-crossword-tools-parser/src/types.ts).

### .puz to .xd

Builds on [puzjs](https://www.npmjs.com/package/puzjs) (ISC license). The puz format is generally what tools and websites will give you as an output format.

```ts
import { puzToXD } from "xd-crossword-tools"

const puzResponse = await fetch(url)
const puzBuffer = await res.arrayBuffer()
const xd = puzToXD(puzBuffer)
```

This API should cover most features in puz and xd.

### UClick .xml to .xd

```ts
import { uclickXMLToXD } from "xd-crossword-tools"

const xmlResponse = await fetch(url)
const xmlString = await res.body()
const xd = uclickXMLToXD(xmlString)
```

### .jpz to .xd

```ts
import { jpzToXD } from "xd-crossword-tools"

const jpz = "[...]"
const xd = jpzToXD(jpz)
```

The jpz format import supports barred crosswords.

### .xd to .puz

We don't support _all_ of .puz features, but this library can generate a JSON object which can then be used `@confuzzle/writepuz` to generate a .puz file as a buffer which you can write to a file in node, or offer as a download on the web.

```ts
import { JSONToPuzJSON } from "xd-crossword-tools"
import { writepuz } from "@confuzzle/writepuz"

const xd = "[...]"
const writeJSON = JSONToPuzJSON(xd)
const puzBuffer = writepuz(writeJSON)
```

### Editor Support

You can opt-in to more information from the parser, and lint warnings, by passing `true` as the third argument to `xdToJSON`.

Triggering this will:

- Turn on the linter for your code editor, which will give you warnings about your crossword based on pretty universally useful rules.
- Add section metadata in the return value's `editorInfo` property
- Add line numbers to the metadata section of the puzzle
- Add line numbers to clues/hints/other in the metadata section of each clue

This library includes `editorInfoAtCursor` which can get some information about what's under the cursor at `{ line, index }`.

```ts
import { xdToJSON, editorInfoAtCursor } from "xd-crossword-tools"

const xd = "[...]"
const editorSupport = true
const crossword = xdToJSON(xd, true, editorSupport)

const info = editorInfoAtCursor(crossword)
const cursorInfo = info(0, 0)
```

Which returns a union of different results, you can check the types + tests to see what's available, but it's something like this:

```tss
export type PositionInfo =
  | { type: "noop" }
  | { type: "grid"; position: Position }
  | { type: "clue"; direction: CursorDirection; number: number }
  | ...etc
```

### xd Diffing

This library includes a diffing function which can take two xd strings and return a list of changes. This is useful for version control, and for building a diffing UI.

```ts
import { diffXD } from "xd-crossword-tools"

const diff = diffXD(xd1, xd2)
```

### `xd` Extensions

This lib creates `xd` compatible files, but also extends the format in a way that allows for thinking of `xd` as a human-editor format.

#### Clue Metadata

You can add arbitrary metadata to clues by repeating the clue with a custom suffix:

```
A1. Gardener's concerns with A2 and D4. ~ BULB
A1 ^Hint: Turned on to illuminate a room.
A1 ^Refs: A2 D4

A4. A reasonable statement. ~ OK
A4 ^Hint: All ___.

A5. The office centerpiece. ~ DESK
A5 ^Hint: Fried.

D1. To ___ly go. ~ BOLD
D1 ^Hint: When you want to make some text stronger.

D2. Bigger than britain. ~ UK
D2 ^Hint: A union which left europe.

D3. A conscious tree. ~ BOOK
D3 ^Hint: Registering with a restaurant. ~ BOOK
```

Capitalization is ignored, the metadata prefix will always be given as lowercase inside the JSON representation.

#### Schrödinger Squares

We support declaring schrödinger's by indicating in the grid with a `"*"` and then using `alt`, and `alt2`, `alt3` (etc)

```
## Grid

TILE
APEX
C*NE
ODDS

## Clues

A1. Mosaic piece ~ TILE
A5. Pinnacle ~ APEX
A6. Sugar ____ ~ CONE
A6 ^alt: CANE
A7. Chances, in gambling ~ ODDS

D1. Tuesday treat ~ TACO
D2. Apple tech ~ IPOD
D2 ^alt: IPAD
D3. Complement to borrow ~ LEND
D4. Former intimates ~ EXES
```

For rebuses inside schrödinger use the symbol inside the clue/alt:

```
A6. Sugar ____ ~ 1NE
A6 ^alt: 2NE
```

#### Markdown/HTML style comments

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

The key is that a line has to start with `<!--` and eventually the same or another line has to **end** with `-->`. **Note:** If you are doing automated transforms, these comments are likely to get lost.

#### Markup in Clues

The [xd spec](https://github.com/century-arcade/xd/blob/master/doc/xd-format.md#clues-section-3) defines markup inside a clue as roughly being "markdown sigil's wrapped in `{` and `}`". We support this format, and will always fill out a key of `markup` which is an array of components. We also add support for links via this syntax: `{@text|url@}`.

<!-- prettier-ignore -->
```md
A1. {/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here|https://mylink.com@} ~ AHAB
```

Which will add the optional `"bodyMD"` to the clue:

```json
{
  "answer": "AHAB",
  "body": "{/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here|https://mylink.com@}",
  "display": [
    ["italics", "Captain"],
    ["text", ", "],
    ["bold", "of"],
    ["text", ", "],
    ["underscore", "the"],
    ["text", ", ship "],
    ["strike", "pequod"],
    ["text", " "],
    ["link", "see here", "https://mylink.com"]
  ]
}
```

- Italics: `{/`<kbd>words</kbd>`/}`
- Bold: `{*`<kbd>words</kbd>`*}`
- Strike through: `{-`<kbd>words</kbd>`-}`
- Underline: `{_`<kbd>words</kbd>`_}`
- Link: `{@`<kbd>words</kbd>`|`<kbd>url</kbd>`@}`
- Image inline: `{!`<kbd>url</kbd>`|`<kbd>alt text</kbd>`|width|height!}`
- Image block: `{!!`<kbd>url</kbd>`|`<kbd>alt text</kbd>`|width|height!}`
- Inline colours: `{#`<kbd>text</kbd>`|`<kbd>hex colour light</kbd>|<kbd>hex colour dark</kbd>`#}`
- Subscript `{~`<kbd>words</kbd>`~}`
- Superscript `{^`<kbd>words</kbd>`^}`

There is an exported `xdMarkupProcessor` which you can use to do your own markup processing if needed.

#### Split character

Provide hints for where one word terminates and the next begins in a single solution by declaring `SplitCharacter: {character}` in `Metadata`, and adding the chosen SplitCharacter between words in `Clues`.

```
## Metadata

splitcharacter: |

## Clues
…
D25. Father of Spider-Man ~ STAN|LEE
```

The 'answer' given from the parser here will be 'STANLEE', but the indexes for each bar will be noted in the clue.

### Spec-Breaking Differences

We want to highlight that 'Comments', 'Split Characters', 'Schrödinger clues' and some markup extensions are all spec-breaking. E.g. a parser which conforms exactly to the xd spec would likely choke when seeing these features.

### Aesthetics

The xd spec is built for isplaying a large corpus of finished Crosswords, we use it for creation of new ones. This means we have a few extensions to the format to make it easier to write puzzles.

- `## Design`

This is our extension to describe the visual aspects of individual cells. The `xd` format uses lowercase letters in the grid to indicate a particular special trait (for example having a circle background.) We are looking at describing a more complex set of visual attributes, and so the puz -> xd parser uses a new section to indicate the design attributes in a manner similar to how rebuses are handled.

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

CSS Properties supported in style:

- `background`: "circle" - sets a circle in the background
- `background-light: #[hex]` - sets the tile's background when in light mode
- `background-dark: #[hex]` - sets the tile's background when in dark mode
- `bar-top: true` - describes that in a barred crossword the bar is on the left of this tile
- `bar-left: true` - describes that in a barred crossword the bar is on the top of this tile

For example:

<!-- prettier-ignore -->
```html
<style>
O { background: circle }
R { background-light: #FF69B4; background-dark: #C71585 }
G { background-light: #00FF00; background-dark: #008000 }
B { background-light: #00FFFF; background-dark: #00008B }
T { bar-top: true }
</style>
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

## API Reference

### xd-crossword-tools Functions

The main `xd-crossword-tools` package provides comprehensive functionality for format conversion, validation, and development tools:

| Function                       | Description                                     | Parameters                                           | Return Type                                     | Notes                                                |
| ------------------------------ | ----------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `puzToXD`                      | Converts .puz file buffer to XD format          | `buffer: ArrayBuffer`                                | `string`                                        | Handles rebus symbols, circles, shades, and metadata |
| `uclickXMLToXD`                | Converts UClick XML format to XD                | `str: string`                                        | `string`                                        | Parses XML crossword data and converts to XD format  |
| `jpzToXD`                      | Converts JPZ (XML) format to XD                 | `xmlString: string`                                  | `string`                                        | Handles JPZ crossword puzzle format conversion       |
| `amuseToXD`                    | Converts Amuse JSON format to XD                | `amuseJSON: AmuseTopLevel`                           | `string`                                        | Converts Amuse Labs crossword format to XD           |
| `JSONToXD`                     | Converts CrosswordJSON back to XD format string | `json: CrosswordJSON`                                | `string`                                        | Main function for converting parsed data back to XD  |
| `JSONToPuzJSON`                | Converts CrosswordJSON to .puz format JSON      | `json: CrosswordJSON`, `config?: {filled?: boolean}` | `any`                                           | Creates JSON for @confuzzle/writepuz                 |
| `puzEncode`                    | Encodes puzzle data to .puz binary format       | `puzzle: Puzzle`                                     | `Uint8Array`                                    | Low-level binary .puz file encoding                  |
| `puzDecode`                    | Decodes .puz binary format to JSON              | `bytes: ArrayBuffer`                                 | `Puz2JSONResult`                                | Low-level binary .puz file decoding                  |
| `editorInfoAtCursor`           | Gets crossword information at cursor position   | `data: CrosswordJSON`                                | `(line: number, index: number) => PositionInfo` | For editor integrations - requires editorInfo        |
| `xdDiff`                       | Creates semantic diff between two XD files      | `beforeXD: string`, `afterXD: string`                | `DiffResults`                                   | Line-by-line differences with metadata awareness     |
| `runLinterForClue`             | Runs linting checks on individual clues         | `clue: Clue`, `ordinal: "across" \| "down"`          | `Report[]`                                      | Checks for common crossword construction issues      |
| `validateClueAnswersMatchGrid` | Validates clue answers match grid tiles         | `json: CrosswordJSON`                                | `Report[]`                                      | Checks consistency between answers and grid          |
| `resolveFullClueAnswer`        | Resolves clue answer with rebus and splits      | `clue: Clue`, `splitChar: string`                    | `string`                                        | Handles rebus substitution and split characters      |

### xd-crossword-tools-parser Utility Functions

The `xd-crossword-tools-parser` package exports several utility functions for working with crossword data:

| Function                                    | Description                                                          | Parameters                                              | Return Type                                            |
| ------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| `getTile`                                   | Gets a specific tile from the crossword grid at the given position   | `tiles: Tile[][]`, `position: Position`                 | `Tile \| undefined`                                    |
| `clueInfosForPosition`                      | Finds which clues (across/down) exist at a given grid position       | `tiles: Tile[][]`, `clues: Clues`, `position: Position` | `{down?: ClueInfo, across?: ClueInfo}`                 |
| `tilePositionsForClue`                      | Gets all tile positions that belong to a specific clue               | `clue: Clue`, `direction: CursorDirection`              | `Position[]`                                           |
| `getWordTilesForCursor`                     | Gets all tile positions that are part of the word at cursor position | `tiles: Tile[][]`, `cursor: Cursor`                     | `Position[]`                                           |
| `getSortedTilesForCursor`                   | Gets word tiles for cursor, sorted with boundary info                | `tiles: Tile[][]`, `cursor: Cursor`                     | `{first: Position, last: Position, tiles: Position[]}` |
| `getCluePositionsForBoard`                  | Analyzes grid to determine all positions where clues start           | `tiles: Tile[][]`                                       | `PositionWithTiles[]`                                  |
| `xdMarkupProcessor`                         | Processes XD markup syntax into structured components                | `input: string`                                         | `ClueComponentMarkup[]`                                |
| `EditorError`                               | Custom error class for XD parsing errors with line numbers           | `message: string`, `line: number`                       | `EditorError`                                          |
| `shouldConvertToExplicitHeaders`            | Checks if XD string needs conversion from v1 to v2 format            | `xd: string`                                            | `boolean`                                              |
| `convertImplicitOrderedXDToExplicitHeaders` | Converts old v1 implicit XD format to new v2 explicit headers        | `xd: string`                                            | `string`                                               |
| `letterToTile`                              | Converts a single letter string to a Tile object                     | `letter: string`                                        | `Tile`                                                 |
| `stringGridToTiles`                         | Converts a 2D string array to a 2D Tile array                        | `rebuses: Rebuses`, `strArr: string[][]`                | `Tile[][]`                                             |
| `replaceWordWithSymbol`                     | Replaces a word in tiles with a rebus symbol                         | `word: string`, `tiles: Tile[]`, `splitChar: string`    | `void`                                                 |

## Publishing and deployment

### NPM Package Publishing

NPM package publishing happens automatically via GitHub Actions when changes are pushed to the `main` branch. The workflow compares local package versions with published versions on npm and only publishes if versions have been bumped.

#### To Prepare a New Release:

1. **Update the changelog** (if applicable) to document changes in this release

2. **Bump package versions** using Yarn workspaces:

   ```sh
   # Bump all workspace packages by the same amount
   yarn workspaces foreach -A version [major|minor|patch]

   # Examples:
   yarn workspaces foreach -A version patch  # 1.0.0 -> 1.0.1
   yarn workspaces foreach -A version minor  # 1.0.0 -> 1.1.0
   yarn workspaces foreach -A version major  # 1.0.0 -> 2.0.0
   ```

3. **Commit and push** the version changes:

   ```sh
   git add .
   git commit -m "v1.2.3"  # Use the new version number
   git push
   ```

4. **Automated CI process** runs on push to `main`:
   - Builds both packages (`xd-crossword-tools-parser` and `xd-crossword-tools`)
   - Runs type checking and tests
   - Compares local versions with npm registry versions
   - Publishes any packages with version mismatches
   - Creates a git tag for the release (e.g., `v1.2.3`)

**Note:** The workflow automatically handles the dependency between packages - it converts `workspace:*` references to actual version numbers before publishing.

### Website Deployment

The interactive playground website deploys automatically to GitHub Pages on every push to `main`.
