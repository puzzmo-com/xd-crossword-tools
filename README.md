# xd-crossword-tools

[xd](https://github.com/century-arcade/xdformat/blob/master/doc/xd-format-v4.md) is a text-based crossword format which is easy for humans to read and reason about.

This repo provides tools for taking different crossword file formats and converting them to xd. Then has a comprehensive xd to JSON function. Targets the [xd v4 spec](https://github.com/century-arcade/xdformat/blob/master/doc/xd-format-v4.md), and comes with a few editor-experience extensions for a REPL-like environment. Older xd files still parse (with deprecation warnings), and `migrateXDToV4` will [upgrade them](#migrating-to-xd-v4). Uses a [vendored](./packages/xd-crossword-tools/src/vendor/) copy of 'puzjs' which was ported to TypeScript.

Runs and tested in production in node, browsers, React Native and edge runtimes.

There are two packages here:

- `xd-crossword-tools-parser` - A parser for the xd format, if you only want to convert an xd file to JSON and have a few helper functions for working with the JSON.
- `xd-crossword-tools` - A set of tools for working with the xd format: dev tooling, importing/exporting, diffing, linting etc.

### Example

Let's take this free `.puz`: <https://dehodson.github.io/crossword-puzzles/crosswords/alpha-bits/>

Their .puz file turns into this xd:

```xd
## Metadata

title: Alpha-Bits
author: Drew Hodson
copyright: © 2021

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

O { background: circle }

O..O..O.O..O..O
...............
...............
...............
O..O..O.O..O..O
...............
...............
......O.O......
...............
...............
O..O..O.O..O..O
...............
...............
...............
O..O..O.O..O..O
```


 <details>
          <summary>And then turned into this JSON</summary>

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
  "metaDisplay": {
    "title": [
      [
        "text",
        "Alpha-Bits"
      ]
    ],
    "author": [
      [
        "text",
        "Drew Hodson"
      ]
    ],
    "copyright": [
      [
        "text",
        "© 2021"
      ]
    ],
    "description": [
      [
        "text",
        "N/A"
      ]
    ]
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
        "answers": [
          {
            "answer": "AHAB"
          }
        ],
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
          "answer:unprocessed": "AHAB",
          "answers:unprocessed": "AHAB"
        },
        "display": [
          [
            "text",
            "Captain of the Pequod"
          ]
        ],
        "plain": "Captain of the Pequod",
        "direction": "across"
      },
      {
        "body": "Food for second chance chewing",
        "answer": "CUD",
        "answers": [
          {
            "answer": "CUD"
          }
        ],
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
          "answer:unprocessed": "CUD",
          "answers:unprocessed": "CUD"
        },
        "display": [
          [
            "text",
            "Food for second chance chewing"
          ]
        ],
        "plain": "Food for second chance chewing",
        "direction": "across"
      },
      {
        "body": "Font feature",
        "answer": "SERIF",
        "answers": [
          {
            "answer": "SERIF"
          }
        ],
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
          "answer:unprocessed": "SERIF",
          "answers:unprocessed": "SERIF"
        },
        "display": [
          [
            "text",
            "Font feature"
          ]
        ],
        "plain": "Font feature",
        "direction": "across"
      },
      {
        "body": "Palindromic address to a female",
        "answer": "MADAM",
        "answers": [
          {
            "answer": "MADAM"
          }
        ],
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
          "answer:unprocessed": "MADAM",
          "answers:unprocessed": "MADAM"
        },
        "display": [
          [
            "text",
            "Palindromic address to a female"
          ]
        ],
        "plain": "Palindromic address to a female",
        "direction": "across"
      },
      {
        "body": "___ Way You Want It",
        "answer": "ANY",
        "answers": [
          {
            "answer": "ANY"
          }
        ],
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
          "answer:unprocessed": "ANY",
          "answers:unprocessed": "ANY"
        },
        "display": [
          [
            "text",
            "___ Way You Want It"
          ]
        ],
        "plain": "___ Way You Want It",
        "direction": "across"
      },
      {
        "body": "Place often described as humble",
        "answer": "ABODE",
        "answers": [
          {
            "answer": "ABODE"
          }
        ],
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
          "answer:unprocessed": "ABODE",
          "answers:unprocessed": "ABODE"
        },
        "display": [
          [
            "text",
            "Place often described as humble"
          ]
        ],
        "plain": "Place often described as humble",
        "direction": "across"
      },
      {
        "body": "Flat two dimensional surface in geometry",
        "answer": "PLANE",
        "answers": [
          {
            "answer": "PLANE"
          }
        ],
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
          "answer:unprocessed": "PLANE",
          "answers:unprocessed": "PLANE"
        },
        "display": [
          [
            "text",
            "Flat two dimensional surface in geometry"
          ]
        ],
        "plain": "Flat two dimensional surface in geometry",
        "direction": "across"
      },
      {
        "body": "Grim homophone of 7D",
        "answer": "DIE",
        "answers": [
          {
            "answer": "DIE"
          }
        ],
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
          "answer:unprocessed": "DIE",
          "answers:unprocessed": "DIE"
        },
        "display": [
          [
            "text",
            "Grim homophone of 7D"
          ]
        ],
        "plain": "Grim homophone of 7D",
        "direction": "across"
      },
      {
        "body": "Off",
        "answer": "NOTON",
        "answers": [
          {
            "answer": "NOTON"
          }
        ],
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
          "answer:unprocessed": "NOTON",
          "answers:unprocessed": "NOTON"
        },
        "display": [
          [
            "text",
            "Off"
          ]
        ],
        "plain": "Off",
        "direction": "across"
      },
      {
        "body": "Heading for some lists",
        "answer": "TODO",
        "answers": [
          {
            "answer": "TODO"
          }
        ],
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
          "answer:unprocessed": "TODO",
          "answers:unprocessed": "TODO"
        },
        "display": [
          [
            "text",
            "Heading for some lists"
          ]
        ],
        "plain": "Heading for some lists",
        "direction": "across"
      },
      {
        "body": "Kanye West is famous for his",
        "answer": "EGO",
        "answers": [
          {
            "answer": "EGO"
          }
        ],
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
          "answer:unprocessed": "EGO",
          "answers:unprocessed": "EGO"
        },
        "display": [
          [
            "text",
            "Kanye West is famous for his"
          ]
        ],
        "plain": "Kanye West is famous for his",
        "direction": "across"
      },
      {
        "body": "Laceration",
        "answer": "GASH",
        "answers": [
          {
            "answer": "GASH"
          }
        ],
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
          "answer:unprocessed": "GASH",
          "answers:unprocessed": "GASH"
        },
        "display": [
          [
            "text",
            "Laceration"
          ]
        ],
        "plain": "Laceration",
        "direction": "across"
      },
      {
        "body": "Alias of Twitch star Richard Tyler Blevins",
        "answer": "NINJA",
        "answers": [
          {
            "answer": "NINJA"
          }
        ],
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
          "answer:unprocessed": "NINJA",
          "answers:unprocessed": "NINJA"
        },
        "display": [
          [
            "text",
            "Alias of Twitch star Richard Tyler Blevins"
          ]
        ],
        "plain": "Alias of Twitch star Richard Tyler Blevins",
        "direction": "across"
      },
      {
        "body": "Capsize",
        "answer": "KEEL",
        "answers": [
          {
            "answer": "KEEL"
          }
        ],
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
          "answer:unprocessed": "KEEL",
          "answers:unprocessed": "KEEL"
        },
        "display": [
          [
            "text",
            "Capsize"
          ]
        ],
        "plain": "Capsize",
        "direction": "across"
      },
      {
        "body": "Piece of clothing or print",
        "answer": "ARTICLE",
        "answers": [
          {
            "answer": "ARTICLE"
          }
        ],
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
          "answer:unprocessed": "ARTICLE",
          "answers:unprocessed": "ARTICLE"
        },
        "display": [
          [
            "text",
            "Piece of clothing or print"
          ]
        ],
        "plain": "Piece of clothing or print",
        "direction": "across"
      },
      {
        "body": "Evangelical school in Tulsa, OK",
        "answer": "ORU",
        "answers": [
          {
            "answer": "ORU"
          }
        ],
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
          "answer:unprocessed": "ORU",
          "answers:unprocessed": "ORU"
        },
        "display": [
          [
            "text",
            "Evangelical school in Tulsa, OK"
          ]
        ],
        "plain": "Evangelical school in Tulsa, OK",
        "direction": "across"
      },
      {
        "body": "___-eyed",
        "answer": "DOE",
        "answers": [
          {
            "answer": "DOE"
          }
        ],
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
          "answer:unprocessed": "DOE",
          "answers:unprocessed": "DOE"
        },
        "display": [
          [
            "text",
            "___-eyed"
          ]
        ],
        "plain": "___-eyed",
        "direction": "across"
      },
      {
        "body": "Annual",
        "answer": "YEARLY",
        "answers": [
          {
            "answer": "YEARLY"
          }
        ],
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
          "answer:unprocessed": "YEARLY",
          "answers:unprocessed": "YEARLY"
        },
        "display": [
          [
            "text",
            "Annual"
          ]
        ],
        "plain": "Annual",
        "direction": "across"
      },
      {
        "body": "The stamp with the upside down airplane is a famous one",
        "answer": "MISPRINT",
        "answers": [
          {
            "answer": "MISPRINT"
          }
        ],
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
          "answer:unprocessed": "MISPRINT",
          "answers:unprocessed": "MISPRINT"
        },
        "display": [
          [
            "text",
            "The stamp with the upside down airplane is a famous one"
          ]
        ],
        "plain": "The stamp with the upside down airplane is a famous one",
        "direction": "across"
      },
      {
        "body": "With 42A and Marcus, a luxury department store chain",
        "answer": "NEI",
        "answers": [
          {
            "answer": "NEI"
          }
        ],
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
          "answer:unprocessed": "NEI",
          "answers:unprocessed": "NEI"
        },
        "display": [
          [
            "text",
            "With 42A and Marcus, a luxury department store chain"
          ]
        ],
        "plain": "With 42A and Marcus, a luxury department store chain",
        "direction": "across"
      },
      {
        "body": "41A continued",
        "answer": "MAN",
        "answers": [
          {
            "answer": "MAN"
          }
        ],
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
          "answer:unprocessed": "MAN",
          "answers:unprocessed": "MAN"
        },
        "display": [
          [
            "text",
            "41A continued"
          ]
        ],
        "plain": "41A continued",
        "direction": "across"
      },
      {
        "body": "Lush",
        "answer": "SOT",
        "answers": [
          {
            "answer": "SOT"
          }
        ],
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
          "answer:unprocessed": "SOT",
          "answers:unprocessed": "SOT"
        },
        "display": [
          [
            "text",
            "Lush"
          ]
        ],
        "plain": "Lush",
        "direction": "across"
      },
      {
        "body": "The Mayan one ended in 2012",
        "answer": "CALENDAR",
        "answers": [
          {
            "answer": "CALENDAR"
          }
        ],
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
          "answer:unprocessed": "CALENDAR",
          "answers:unprocessed": "CALENDAR"
        },
        "display": [
          [
            "text",
            "The Mayan one ended in 2012"
          ]
        ],
        "plain": "The Mayan one ended in 2012",
        "direction": "across"
      },
      {
        "body": "What a child often does to their shoes",
        "answer": "RETIES",
        "answers": [
          {
            "answer": "RETIES"
          }
        ],
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
          "answer:unprocessed": "RETIES",
          "answers:unprocessed": "RETIES"
        },
        "display": [
          [
            "text",
            "What a child often does to their shoes"
          ]
        ],
        "plain": "What a child often does to their shoes",
        "direction": "across"
      },
      {
        "body": "Vanilla ___",
        "answer": "ICE",
        "answers": [
          {
            "answer": "ICE"
          }
        ],
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
          "answer:unprocessed": "ICE",
          "answers:unprocessed": "ICE"
        },
        "display": [
          [
            "text",
            "Vanilla ___"
          ]
        ],
        "plain": "Vanilla ___",
        "direction": "across"
      },
      {
        "body": "Maligned cigarette ingredient",
        "answer": "TAR",
        "answers": [
          {
            "answer": "TAR"
          }
        ],
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
          "answer:unprocessed": "TAR",
          "answers:unprocessed": "TAR"
        },
        "display": [
          [
            "text",
            "Maligned cigarette ingredient"
          ]
        ],
        "plain": "Maligned cigarette ingredient",
        "direction": "across"
      },
      {
        "body": "Frequent cause for a new tire",
        "answer": "POTHOLE",
        "answers": [
          {
            "answer": "POTHOLE"
          }
        ],
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
          "answer:unprocessed": "POTHOLE",
          "answers:unprocessed": "POTHOLE"
        },
        "display": [
          [
            "text",
            "Frequent cause for a new tire"
          ]
        ],
        "plain": "Frequent cause for a new tire",
        "direction": "across"
      },
      {
        "body": "Los Angeles heavy metal act",
        "answer": "OTEP",
        "answers": [
          {
            "answer": "OTEP"
          }
        ],
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
          "answer:unprocessed": "OTEP",
          "answers:unprocessed": "OTEP"
        },
        "display": [
          [
            "text",
            "Los Angeles heavy metal act"
          ]
        ],
        "plain": "Los Angeles heavy metal act",
        "direction": "across"
      },
      {
        "body": "Bldgs. such as the Googleplex",
        "answer": "HQTRS",
        "answers": [
          {
            "answer": "HQTRS"
          }
        ],
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
          "answer:unprocessed": "HQTRS",
          "answers:unprocessed": "HQTRS"
        },
        "display": [
          [
            "text",
            "Bldgs. such as the Googleplex"
          ]
        ],
        "plain": "Bldgs. such as the Googleplex",
        "direction": "across"
      },
      {
        "body": "A fit of irritation",
        "answer": "SNIT",
        "answers": [
          {
            "answer": "SNIT"
          }
        ],
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
          "answer:unprocessed": "SNIT",
          "answers:unprocessed": "SNIT"
        },
        "display": [
          [
            "text",
            "A fit of irritation"
          ]
        ],
        "plain": "A fit of irritation",
        "direction": "across"
      },
      {
        "body": "Lead-in to American or day",
        "answer": "ALL",
        "answers": [
          {
            "answer": "ALL"
          }
        ],
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
          "answer:unprocessed": "ALL",
          "answers:unprocessed": "ALL"
        },
        "display": [
          [
            "text",
            "Lead-in to American or day"
          ]
        ],
        "plain": "Lead-in to American or day",
        "direction": "across"
      },
      {
        "body": "What Pokémon do at a Pokémon Center",
        "answer": "HEAL",
        "answers": [
          {
            "answer": "HEAL"
          }
        ],
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
          "answer:unprocessed": "HEAL",
          "answers:unprocessed": "HEAL"
        },
        "display": [
          [
            "text",
            "What Pokémon do at a Pokémon Center"
          ]
        ],
        "plain": "What Pokémon do at a Pokémon Center",
        "direction": "across"
      },
      {
        "body": "Nixon's vice",
        "answer": "SPIRO",
        "answers": [
          {
            "answer": "SPIRO"
          }
        ],
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
          "answer:unprocessed": "SPIRO",
          "answers:unprocessed": "SPIRO"
        },
        "display": [
          [
            "text",
            "Nixon's vice"
          ]
        ],
        "plain": "Nixon's vice",
        "direction": "across"
      },
      {
        "body": "Nothing but ___",
        "answer": "NET",
        "answers": [
          {
            "answer": "NET"
          }
        ],
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
          "answer:unprocessed": "NET",
          "answers:unprocessed": "NET"
        },
        "display": [
          [
            "text",
            "Nothing but ___"
          ]
        ],
        "plain": "Nothing but ___",
        "direction": "across"
      },
      {
        "body": "One with the world on his shoulders",
        "answer": "ATLAS",
        "answers": [
          {
            "answer": "ATLAS"
          }
        ],
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
          "answer:unprocessed": "ATLAS",
          "answers:unprocessed": "ATLAS"
        },
        "display": [
          [
            "text",
            "One with the world on his shoulders"
          ]
        ],
        "plain": "One with the world on his shoulders",
        "direction": "across"
      },
      {
        "body": "Filled pastries",
        "answer": "TARTS",
        "answers": [
          {
            "answer": "TARTS"
          }
        ],
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
          "answer:unprocessed": "TARTS",
          "answers:unprocessed": "TARTS"
        },
        "display": [
          [
            "text",
            "Filled pastries"
          ]
        ],
        "plain": "Filled pastries",
        "direction": "across"
      },
      {
        "body": "Age, in Milan",
        "answer": "ETA",
        "answers": [
          {
            "answer": "ETA"
          }
        ],
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
          "answer:unprocessed": "ETA",
          "answers:unprocessed": "ETA"
        },
        "display": [
          [
            "text",
            "Age, in Milan"
          ]
        ],
        "plain": "Age, in Milan",
        "direction": "across"
      },
      {
        "body": "Lorna ___, novel or cookie",
        "answer": "DOONE",
        "answers": [
          {
            "answer": "DOONE"
          }
        ],
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
          "answer:unprocessed": "DOONE",
          "answers:unprocessed": "DOONE"
        },
        "display": [
          [
            "text",
            "Lorna ___, novel or cookie"
          ]
        ],
        "plain": "Lorna ___, novel or cookie",
        "direction": "across"
      },
      {
        "body": "Electrocardiogram readout feature",
        "answer": "UWAVE",
        "answers": [
          {
            "answer": "UWAVE"
          }
        ],
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
          "answer:unprocessed": "UWAVE",
          "answers:unprocessed": "UWAVE"
        },
        "display": [
          [
            "text",
            "Electrocardiogram readout feature"
          ]
        ],
        "plain": "Electrocardiogram readout feature",
        "direction": "across"
      },
      {
        "body": "Hip slang for records",
        "answer": "WAX",
        "answers": [
          {
            "answer": "WAX"
          }
        ],
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
          "answer:unprocessed": "WAX",
          "answers:unprocessed": "WAX"
        },
        "display": [
          [
            "text",
            "Hip slang for records"
          ]
        ],
        "plain": "Hip slang for records",
        "direction": "across"
      },
      {
        "body": "Yiddish for a foolish person",
        "answer": "YUTZ",
        "answers": [
          {
            "answer": "YUTZ"
          }
        ],
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
          "answer:unprocessed": "YUTZ",
          "answers:unprocessed": "YUTZ"
        },
        "display": [
          [
            "text",
            "Yiddish for a foolish person"
          ]
        ],
        "plain": "Yiddish for a foolish person",
        "direction": "across"
      }
    ],
    "down": [
      {
        "body": "Pc. of concert gear",
        "answer": "AMP",
        "answers": [
          {
            "answer": "AMP"
          }
        ],
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
          "answer:unprocessed": "AMP",
          "answers:unprocessed": "AMP"
        },
        "display": [
          [
            "text",
            "Pc. of concert gear"
          ]
        ],
        "plain": "Pc. of concert gear",
        "direction": "down"
      },
      {
        "body": "AI antagonist of 2001",
        "answer": "HAL",
        "answers": [
          {
            "answer": "HAL"
          }
        ],
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
          "answer:unprocessed": "HAL",
          "answers:unprocessed": "HAL"
        },
        "display": [
          [
            "text",
            "AI antagonist of 2001"
          ]
        ],
        "plain": "AI antagonist of 2001",
        "direction": "down"
      },
      {
        "body": "Programming pioneer Lovelace",
        "answer": "ADA",
        "answers": [
          {
            "answer": "ADA"
          }
        ],
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
          "answer:unprocessed": "ADA",
          "answers:unprocessed": "ADA"
        },
        "display": [
          [
            "text",
            "Programming pioneer Lovelace"
          ]
        ],
        "plain": "Programming pioneer Lovelace",
        "direction": "down"
      },
      {
        "body": "Prohibit",
        "answer": "BAN",
        "answers": [
          {
            "answer": "BAN"
          }
        ],
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
          "answer:unprocessed": "BAN",
          "answers:unprocessed": "BAN"
        },
        "display": [
          [
            "text",
            "Prohibit"
          ]
        ],
        "plain": "Prohibit",
        "direction": "down"
      },
      {
        "body": "Type of person to routinely carry a club",
        "answer": "CADDIE",
        "answers": [
          {
            "answer": "CADDIE"
          }
        ],
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
          "answer:unprocessed": "CADDIE",
          "answers:unprocessed": "CADDIE"
        },
        "display": [
          [
            "text",
            "Type of person to routinely carry a club"
          ]
        ],
        "plain": "Type of person to routinely carry a club",
        "direction": "down"
      },
      {
        "body": "State of the ___ Address",
        "answer": "UNION",
        "answers": [
          {
            "answer": "UNION"
          }
        ],
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
          "answer:unprocessed": "UNION",
          "answers:unprocessed": "UNION"
        },
        "display": [
          [
            "text",
            "State of the ___ Address"
          ]
        ],
        "plain": "State of the ___ Address",
        "direction": "down"
      },
      {
        "body": "Colorful homophone of 18A",
        "answer": "DYE",
        "answers": [
          {
            "answer": "DYE"
          }
        ],
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
          "answer:unprocessed": "DYE",
          "answers:unprocessed": "DYE"
        },
        "display": [
          [
            "text",
            "Colorful homophone of 18A"
          ]
        ],
        "plain": "Colorful homophone of 18A",
        "direction": "down"
      },
      {
        "body": "Snitched",
        "answer": "SANG",
        "answers": [
          {
            "answer": "SANG"
          }
        ],
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
          "answer:unprocessed": "SANG",
          "answers:unprocessed": "SANG"
        },
        "display": [
          [
            "text",
            "Snitched"
          ]
        ],
        "plain": "Snitched",
        "direction": "down"
      },
      {
        "body": "Kindle fare",
        "answer": "EBOOK",
        "answers": [
          {
            "answer": "EBOOK"
          }
        ],
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
          "answer:unprocessed": "EBOOK",
          "answers:unprocessed": "EBOOK"
        },
        "display": [
          [
            "text",
            "Kindle fare"
          ]
        ],
        "plain": "Kindle fare",
        "direction": "down"
      },
      {
        "body": "Decayed matter",
        "answer": "ROT",
        "answers": [
          {
            "answer": "ROT"
          }
        ],
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
          "answer:unprocessed": "ROT",
          "answers:unprocessed": "ROT"
        },
        "display": [
          [
            "text",
            "Decayed matter"
          ]
        ],
        "plain": "Decayed matter",
        "direction": "down"
      },
      {
        "body": "Type of response you hope to get at the altar",
        "answer": "IDO",
        "answers": [
          {
            "answer": "IDO"
          }
        ],
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
          "answer:unprocessed": "IDO",
          "answers:unprocessed": "IDO"
        },
        "display": [
          [
            "text",
            "Type of response you hope to get at the altar"
          ]
        ],
        "plain": "Type of response you hope to get at the altar",
        "direction": "down"
      },
      {
        "body": "Peat-accumulating wetland",
        "answer": "FEN",
        "answers": [
          {
            "answer": "FEN"
          }
        ],
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
          "answer:unprocessed": "FEN",
          "answers:unprocessed": "FEN"
        },
        "display": [
          [
            "text",
            "Peat-accumulating wetland"
          ]
        ],
        "plain": "Peat-accumulating wetland",
        "direction": "down"
      },
      {
        "body": "The ___, NY art museum",
        "answer": "MET",
        "answers": [
          {
            "answer": "MET"
          }
        ],
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
          "answer:unprocessed": "MET",
          "answers:unprocessed": "MET"
        },
        "display": [
          [
            "text",
            "The ___, NY art museum"
          ]
        ],
        "plain": "The ___, NY art museum",
        "direction": "down"
      },
      {
        "body": "___Fans",
        "answer": "ONLY",
        "answers": [
          {
            "answer": "ONLY"
          }
        ],
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
          "answer:unprocessed": "ONLY",
          "answers:unprocessed": "ONLY"
        },
        "display": [
          [
            "text",
            "___Fans"
          ]
        ],
        "plain": "___Fans",
        "direction": "down"
      },
      {
        "body": "Friends, Romans, countrymen, lend me your...",
        "answer": "EARS",
        "answers": [
          {
            "answer": "EARS"
          }
        ],
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
          "answer:unprocessed": "EARS",
          "answers:unprocessed": "EARS"
        },
        "display": [
          [
            "text",
            "Friends, Romans, countrymen, lend me your..."
          ]
        ],
        "plain": "Friends, Romans, countrymen, lend me your...",
        "direction": "down"
      },
      {
        "body": "\"Friend of Dorothy\"",
        "answer": "GAY",
        "answers": [
          {
            "answer": "GAY"
          }
        ],
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
          "answer:unprocessed": "GAY",
          "answers:unprocessed": "GAY"
        },
        "display": [
          [
            "text",
            "\"Friend of Dorothy\""
          ]
        ],
        "plain": "\"Friend of Dorothy\"",
        "direction": "down"
      },
      {
        "body": "We ___ the Champions",
        "answer": "ARE",
        "answers": [
          {
            "answer": "ARE"
          }
        ],
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
          "answer:unprocessed": "ARE",
          "answers:unprocessed": "ARE"
        },
        "display": [
          [
            "text",
            "We ___ the Champions"
          ]
        ],
        "plain": "We ___ the Champions",
        "direction": "down"
      },
      {
        "body": "Father of Spider-Man",
        "answer": "STANLEE",
        "answers": [
          {
            "answer": "STANLEE"
          }
        ],
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
          "answer:unprocessed": "STANLEE",
          "answers:unprocessed": "STANLEE"
        },
        "display": [
          [
            "text",
            "Father of Spider-Man"
          ]
        ],
        "plain": "Father of Spider-Man",
        "direction": "down"
      },
      {
        "body": "What a certain applicant becomes",
        "answer": "HIREE",
        "answers": [
          {
            "answer": "HIREE"
          }
        ],
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
          "answer:unprocessed": "HIREE",
          "answers:unprocessed": "HIREE"
        },
        "display": [
          [
            "text",
            "What a certain applicant becomes"
          ]
        ],
        "plain": "What a certain applicant becomes",
        "direction": "down"
      },
      {
        "body": "Connect",
        "answer": "JOIN",
        "answers": [
          {
            "answer": "JOIN"
          }
        ],
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
          "answer:unprocessed": "JOIN",
          "answers:unprocessed": "JOIN"
        },
        "display": [
          [
            "text",
            "Connect"
          ]
        ],
        "plain": "Connect",
        "direction": "down"
      },
      {
        "body": "Particular form of a published text",
        "answer": "EDITION",
        "answers": [
          {
            "answer": "EDITION"
          }
        ],
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
          "answer:unprocessed": "EDITION",
          "answers:unprocessed": "EDITION"
        },
        "display": [
          [
            "text",
            "Particular form of a published text"
          ]
        ],
        "plain": "Particular form of a published text",
        "direction": "down"
      },
      {
        "body": "Suffix at the end of all of Eevee's evolutions",
        "answer": "EON",
        "answers": [
          {
            "answer": "EON"
          }
        ],
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
          "answer:unprocessed": "EON",
          "answers:unprocessed": "EON"
        },
        "display": [
          [
            "text",
            "Suffix at the end of all of Eevee's evolutions"
          ]
        ],
        "plain": "Suffix at the end of all of Eevee's evolutions",
        "direction": "down"
      },
      {
        "body": "Live and ___ Die",
        "answer": "LET",
        "answers": [
          {
            "answer": "LET"
          }
        ],
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
          "answer:unprocessed": "LET",
          "answers:unprocessed": "LET"
        },
        "display": [
          [
            "text",
            "Live and ___ Die"
          ]
        ],
        "plain": "Live and ___ Die",
        "direction": "down"
      },
      {
        "body": "Famous Eastwood whose name became a famous Gorillaz song",
        "answer": "CLINT",
        "answers": [
          {
            "answer": "CLINT"
          }
        ],
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
          "answer:unprocessed": "CLINT",
          "answers:unprocessed": "CLINT"
        },
        "display": [
          [
            "text",
            "Famous Eastwood whose name became a famous Gorillaz song"
          ]
        ],
        "plain": "Famous Eastwood whose name became a famous Gorillaz song",
        "direction": "down"
      },
      {
        "body": "Unexpected result in a sporting competition",
        "answer": "UPSET",
        "answers": [
          {
            "answer": "UPSET"
          }
        ],
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
          "answer:unprocessed": "UPSET",
          "answers:unprocessed": "UPSET"
        },
        "display": [
          [
            "text",
            "Unexpected result in a sporting competition"
          ]
        ],
        "plain": "Unexpected result in a sporting competition",
        "direction": "down"
      },
      {
        "body": "Disfigure",
        "answer": "MAR",
        "answers": [
          {
            "answer": "MAR"
          }
        ],
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
          "answer:unprocessed": "MAR",
          "answers:unprocessed": "MAR"
        },
        "display": [
          [
            "text",
            "Disfigure"
          ]
        ],
        "plain": "Disfigure",
        "direction": "down"
      },
      {
        "body": "David Lee and Tim",
        "answer": "ROTHS",
        "answers": [
          {
            "answer": "ROTHS"
          }
        ],
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
          "answer:unprocessed": "ROTHS",
          "answers:unprocessed": "ROTHS"
        },
        "display": [
          [
            "text",
            "David Lee and Tim"
          ]
        ],
        "plain": "David Lee and Tim",
        "direction": "down"
      },
      {
        "body": "Luxury watch collection by Garmin",
        "answer": "MARQ",
        "answers": [
          {
            "answer": "MARQ"
          }
        ],
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
          "answer:unprocessed": "MARQ",
          "answers:unprocessed": "MARQ"
        },
        "display": [
          [
            "text",
            "Luxury watch collection by Garmin"
          ]
        ],
        "plain": "Luxury watch collection by Garmin",
        "direction": "down"
      },
      {
        "body": "Top dog in an IT org",
        "answer": "CIO",
        "answers": [
          {
            "answer": "CIO"
          }
        ],
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
          "answer:unprocessed": "CIO",
          "answers:unprocessed": "CIO"
        },
        "display": [
          [
            "text",
            "Top dog in an IT org"
          ]
        ],
        "plain": "Top dog in an IT org",
        "direction": "down"
      },
      {
        "body": "Sister ___",
        "answer": "ACT",
        "answers": [
          {
            "answer": "ACT"
          }
        ],
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
          "answer:unprocessed": "ACT",
          "answers:unprocessed": "ACT"
        },
        "display": [
          [
            "text",
            "Sister ___"
          ]
        ],
        "plain": "Sister ___",
        "direction": "down"
      },
      {
        "body": "Author Roald",
        "answer": "DAHL",
        "answers": [
          {
            "answer": "DAHL"
          }
        ],
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
          "answer:unprocessed": "DAHL",
          "answers:unprocessed": "DAHL"
        },
        "display": [
          [
            "text",
            "Author Roald"
          ]
        ],
        "plain": "Author Roald",
        "direction": "down"
      },
      {
        "body": "Civil rights activist Parks",
        "answer": "ROSA",
        "answers": [
          {
            "answer": "ROSA"
          }
        ],
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
          "answer:unprocessed": "ROSA",
          "answers:unprocessed": "ROSA"
        },
        "display": [
          [
            "text",
            "Civil rights activist Parks"
          ]
        ],
        "plain": "Civil rights activist Parks",
        "direction": "down"
      },
      {
        "body": "An additional name that could be part of 40D's clue",
        "answer": "ELI",
        "answers": [
          {
            "answer": "ELI"
          }
        ],
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
          "answer:unprocessed": "ELI",
          "answers:unprocessed": "ELI"
        },
        "display": [
          [
            "text",
            "An additional name that could be part of 40D's clue"
          ]
        ],
        "plain": "An additional name that could be part of 40D's clue",
        "direction": "down"
      },
      {
        "body": "Director's domain",
        "answer": "SET",
        "answers": [
          {
            "answer": "SET"
          }
        ],
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
          "answer:unprocessed": "SET",
          "answers:unprocessed": "SET"
        },
        "display": [
          [
            "text",
            "Director's domain"
          ]
        ],
        "plain": "Director's domain",
        "direction": "down"
      },
      {
        "body": "Type of income to go in a 401k",
        "answer": "PRETAX",
        "answers": [
          {
            "answer": "PRETAX"
          }
        ],
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
          "answer:unprocessed": "PRETAX",
          "answers:unprocessed": "PRETAX"
        },
        "display": [
          [
            "text",
            "Type of income to go in a 401k"
          ]
        ],
        "plain": "Type of income to go in a 401k",
        "direction": "down"
      },
      {
        "body": "The Empire Strikes Back, to the Star Wars saga",
        "answer": "PARTV",
        "answers": [
          {
            "answer": "PARTV"
          }
        ],
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
          "answer:unprocessed": "PARTV",
          "answers:unprocessed": "PARTV"
        },
        "display": [
          [
            "text",
            "The Empire Strikes Back, to the Star Wars saga"
          ]
        ],
        "plain": "The Empire Strikes Back, to the Star Wars saga",
        "direction": "down"
      },
      {
        "body": "Greek letter following 72A",
        "answer": "THETA",
        "answers": [
          {
            "answer": "THETA"
          }
        ],
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
          "answer:unprocessed": "THETA",
          "answers:unprocessed": "THETA"
        },
        "display": [
          [
            "text",
            "Greek letter following 72A"
          ]
        ],
        "plain": "Greek letter following 72A",
        "direction": "down"
      },
      {
        "body": "Misplace",
        "answer": "LOSE",
        "answers": [
          {
            "answer": "LOSE"
          }
        ],
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
          "answer:unprocessed": "LOSE",
          "answers:unprocessed": "LOSE"
        },
        "display": [
          [
            "text",
            "Misplace"
          ]
        ],
        "plain": "Misplace",
        "direction": "down"
      },
      {
        "body": "Wee boy",
        "answer": "LAD",
        "answers": [
          {
            "answer": "LAD"
          }
        ],
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
          "answer:unprocessed": "LAD",
          "answers:unprocessed": "LAD"
        },
        "display": [
          [
            "text",
            "Wee boy"
          ]
        ],
        "plain": "Wee boy",
        "direction": "down"
      },
      {
        "body": "Dad to Tommy Pickles",
        "answer": "STU",
        "answers": [
          {
            "answer": "STU"
          }
        ],
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
          "answer:unprocessed": "STU",
          "answers:unprocessed": "STU"
        },
        "display": [
          [
            "text",
            "Dad to Tommy Pickles"
          ]
        ],
        "plain": "Dad to Tommy Pickles",
        "direction": "down"
      },
      {
        "body": "The only Patrol I trust",
        "answer": "PAW",
        "answers": [
          {
            "answer": "PAW"
          }
        ],
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
          "answer:unprocessed": "PAW",
          "answers:unprocessed": "PAW"
        },
        "display": [
          [
            "text",
            "The only Patrol I trust"
          ]
        ],
        "plain": "The only Patrol I trust",
        "direction": "down"
      },
      {
        "body": "Smart savings plan, briefly",
        "answer": "IRA",
        "answers": [
          {
            "answer": "IRA"
          }
        ],
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
          "answer:unprocessed": "IRA",
          "answers:unprocessed": "IRA"
        },
        "display": [
          [
            "text",
            "Smart savings plan, briefly"
          ]
        ],
        "plain": "Smart savings plan, briefly",
        "direction": "down"
      },
      {
        "body": "Fresh",
        "answer": "NEW",
        "answers": [
          {
            "answer": "NEW"
          }
        ],
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
          "answer:unprocessed": "NEW",
          "answers:unprocessed": "NEW"
        },
        "display": [
          [
            "text",
            "Fresh"
          ]
        ],
        "plain": "Fresh",
        "direction": "down"
      },
      {
        "body": "Breeds such as Chihuahua or Pomeranian",
        "answer": "TOY",
        "answers": [
          {
            "answer": "TOY"
          }
        ],
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
          "answer:unprocessed": "TOY",
          "answers:unprocessed": "TOY"
        },
        "display": [
          [
            "text",
            "Breeds such as Chihuahua or Pomeranian"
          ]
        ],
        "plain": "Breeds such as Chihuahua or Pomeranian",
        "direction": "down"
      },
      {
        "body": "Bega behind \"Mambo No. 5\"",
        "answer": "LOU",
        "answers": [
          {
            "answer": "LOU"
          }
        ],
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
          "answer:unprocessed": "LOU",
          "answers:unprocessed": "LOU"
        },
        "display": [
          [
            "text",
            "Bega behind \"Mambo No. 5\""
          ]
        ],
        "plain": "Bega behind \"Mambo No. 5\"",
        "direction": "down"
      },
      {
        "body": "Aardvark breakfast",
        "answer": "ANT",
        "answers": [
          {
            "answer": "ANT"
          }
        ],
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
          "answer:unprocessed": "ANT",
          "answers:unprocessed": "ANT"
        },
        "display": [
          [
            "text",
            "Aardvark breakfast"
          ]
        ],
        "plain": "Aardvark breakfast",
        "direction": "down"
      },
      {
        "body": "Sonic ___",
        "answer": "SEZ",
        "answers": [
          {
            "answer": "SEZ"
          }
        ],
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
          "answer:unprocessed": "SEZ",
          "answers:unprocessed": "SEZ"
        },
        "display": [
          [
            "text",
            "Sonic ___"
          ]
        ],
        "plain": "Sonic ___",
        "direction": "down"
      }
    ]
  },
  "rebuses": {},
  "notes": "",
  "unknownSections": {},
  "report": {
    "success": true,
    "errors": [],
    "warnings": [
      {
        "type": "deprecation",
        "position": {
          "col": 0,
          "index": 122
        },
        "length": -1,
        "message": "xd v4 design sections do not wrap their style definitions in a <style> tag"
      }
    ]
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


</details>

## CLI

You can convert crossword files to `.xd` format directly from the command line without installing outside of Node.js:

```sh
# Convert a .puz file
npx xd-crossword-tools puzzle.puz -o ./output

# Convert multiple files at once
npx xd-crossword-tools *.puz *.jpz -o ./xd-files

# Convert a PuzzleMe URL
npx xd-crossword-tools "https://puzzleme.amuselabs.com/pmm/crossword?id=abc123&set=..." -o ./output

# Mix files and URLs
npx xd-crossword-tools puzzle.puz "https://puzzleme.amuselabs.com/pmm/crossword?id=abc123&set=..." -o ./output
```

Supported input formats: `.puz`, `.jpz`, `.ipuz`, `.xml` (UClick or Crossword Compiler), `.json` (Amuse Labs or ipuz), `.txt` (Across text), and URLs which contain PuzzleMe crosswords.

## Import / Export

### .xd to .JSON

This is effectively the only function which matters in `xd-crossword-tools-parser`.

```ts
import { xdToJSON } from "xd-crossword-tools-parser"

const xd = "[...]"
const crossword = xdToJSON(xd)
```

The JSON format is a bit more verbose than you might expect (see above for an example), but the goal is to have as much information pre-computed at parse time in order to save lookups later at runtime. You should use `crossword.report` to determine the parsing's success. You can see the type definitions here: [`./packages/xd-crossword-tools-parser/src/types.ts`](./packages/xd-crossword-tools-parser/src/types.ts).

### Any file to .xd (recommended)

If you have a file and don't want to write the "is this a `.jpz` / `.puz` / Crossword Compiler XML / …" detection yourself, hand it to `fileToXD`. It picks the right converter based on the filename and — where the extension is ambiguous or missing — the file's contents, and works with whatever shape is convenient (`string`, `ArrayBuffer`, `Uint8Array`, or a `Blob`/`File`).

```ts
import { fileToXD } from "xd-crossword-tools"

// e.g. a File from a drag-and-drop, or a Blob from fetch
const { xd, format } = await fileToXD(file.name, file)
console.log(`Imported a ${format} file`, xd)
```

It handles `.xd` (passed through), `.jpz`, `.puz`, `.ipuz`, Amuse `.json`, UClick / Crossword Compiler `.xml`, Across Lite `.puz.txt`, and PuzzleMe `.html`. It throws if the format can't be detected or the underlying converter fails (for example a `.json` that isn't an Amuse export). The individual converters below are still exported if you already know the format.

> **Note on PuzzleMe HTML:** `fileToXD` expects the raw HTML of a PuzzleMe / AmuseLabs puzzle page (it reads the embedded `rawc` field). PuzzleMe puzzles are usually behind a URL rather than a file on disk, so in practice you fetch the page first and hand the HTML to `fileToXD` — or use `decodePuzzleMeHTML` directly. The playground imports these via URL for that reason, and its file-drop UI intentionally doesn't list `.html`.

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

### .ipuz to .xd

Supports the [ipuz](https://libipuz.org/spec/ipuz-spec.html) crossword kind, including blocks, null cells, custom `block`/`empty` characters, rebus cells, Schrödinger cells (solutions with multiple candidate values, converted to multi-valued rebus keys), circled/shaded cells, barred grids and pre-filled cells (converted to an xd Start section). Accepts the raw file text (including the optional `ipuz(...)` JSONP wrapper) or an already-parsed JSON object.

```ts
import { ipuzToXD } from "xd-crossword-tools"

const ipuzText = "..."
const xd = ipuzToXD(ipuzText)
```

### Crossword Compiler .xml to .xd

Crossword Compiler exports XML conforming to the [`rectangular-puzzle`](https://crossword.info/xml/rectangular-puzzle.xsd) schema.

```ts
import { crossCompilerXMLToXD } from "xd-crossword-tools"

const xmlResponse = await fetch(url)
const xmlString = await xmlResponse.text()
const xd = crossCompilerXMLToXD(xmlString)
```

### Across Text (.puz.txt) to .xd

This library supports both v1 and v2 formats, including rebus cells and circled cells (MARK flag).

[Format Document](https://www.litsoft.com/across/docs/AcrossTextFormat.pdf)

```ts
import { acrossTextToXD } from "xd-crossword-tools"

const acrossText = "..."
const xd = acrossTextToXD(acrossText)
```

### .xd to .puz

`xdToPuz` writes a .puz file as a `Uint8Array`, which you can write to a file in node or offer as a download on the web. Clues use their plain text (markup removed), and the original .xd is embedded so `puzToXD` can re-import it losslessly. Use `JSONToPuz(json, { xd })` if you already have a `CrosswordJSON`.

```ts
import { xdToPuz } from "xd-crossword-tools"

const xd = "[...]"
const puz = xdToPuz(xd)
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

### Migrating to xd v4

`migrateXDToV4(xd)` (exported from both packages) rewrites an xd file written for an earlier version of the spec, or with pre-v4 Puzzmo extensions, into v4 syntax. It works on the text so section order and unknown sections are kept, and running it on a v4 file returns it unchanged.

- Implicit (header-less) sections get `## Headings`
- `<!-- -->` comment lines are removed, xd doesn't support comments
- Pre-v4 xdown links `{@text|url@}`, images `{![url|alt]!}` / `{!![url]!}` and colours `{#text|light|dark#}` move to the attribute syntax, and text which v4 would read as markup is escaped
- Clue bodies containing ` ~ ` (pre-v4 bodies ran to the _last_ ` ~ `) get it escaped as `{\~\}`
- Split characters move out of answers into an end-of-line annotation: `~ OK|GO ~ OK|AY` becomes `~ OKGO ~ OKAY // OK|GO OK|AY`
- A duplicated clue line, which was used as a hint, becomes `^Hint:` metadata
- The v3 `Special: circle|shaded` field with lowercase grid cells becomes a `## Design` section
- `## Design` sections lose their `<style>` wrapper and use `.` for unstyled cells
- A `?` rebus key moves to an unused character, as v4 reserves `?` for unfilled cells

Rebuses and Schrödinger squares are not fully specified in v4 yet, so `Rebus:`, `*` squares and `^alt:` answers are left as they are.

```ts
import { migrateXDToV4, xdToJSON } from "xd-crossword-tools"

xdToJSON(oldXD).report.warnings // includes `type: "deprecation"` warnings for pre-v4 syntax
const v4 = migrateXDToV4(oldXD)
xdToJSON(v4).report.warnings // no deprecation warnings
```

Or from the command line, which updates the files in place (or writes them to `-o <dir>`), and `--check` lists the files which need migrating:

```sh
xd-crossword-tools migrate puzzles/*.xd
xd-crossword-tools migrate puzzles/*.xd --check
```

### `xd` Extensions

This lib creates `xd` compatible files, but also extends the format in a way that allows for thinking of `xd` as a human-editor format.

#### Clue Metadata

You can add arbitrary metadata to clues by repeating the clue reference with a `^Key:` suffix (this is part of the xd spec since v3):

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

Keys are case-insensitive, they are always lowercase inside the JSON representation and `JSONToXD` writes them lowercase.

#### Schrödinger Squares

A Schrödinger square is a cell which has more than one correct answer. You declare one by giving a rebus key more than one value in the metadata, then using that symbol in the grid:

```
## Metadata

rebus: 1=O 1=A

## Grid

TILE
APEX
C1NE
ODDS

## Clues

A1. Mosaic piece ~ TILE
A5. Pinnacle ~ APEX
A6. Sugar ____ ~ CONE
A7. Chances, in gambling ~ ODDS

D1. Tuesday treat ~ TACO
D2. Apple tech ~ IPOD
D3. Complement to borrow ~ LEND
D4. Former intimates ~ EXES
```

Here the `1` cell accepts either `O` or `A`, and clue answers are written using one of the valid options (e.g. `CONE`/`IPOD`). Values can also be multiple letters, making a Schrödinger rebus cell (`rebus: 1=OR 1=AR`), and multi-valued keys can be mixed with regular single-valued rebus keys in the same declaration.

In the JSON, these tiles carry `validOptions`: every value in declaration order, where the array position acts as a variant index. Squares that resolve to the same index belong to the same solution of the puzzle, which lets a checker verify answers with several Schrödinger squares (e.g. an entry reading either `CLINTON` or `BOBDOLE`, never a mix) by comparing one index per square — see the 14.0.0 notes in [CHANGELOG.md](./CHANGELOG.md) for a worked example.

##### Deprecated: `*` grid squares with `^alt` clue metadata

The original syntax — a `"*"` in the grid with the alternatives declared via `alt`, `alt2`, `alt3` (etc) clue metadata — is still parsed, but is deprecated in favour of the rebus-based syntax above:

```
## Grid

TILE
APEX
C*NE
ODDS

## Clues

A6. Sugar ____ ~ CONE
A6 ^alt: CANE

D2. Apple tech ~ IPOD
D2 ^alt: IPAD
```

For rebuses inside a `*`-style schrödinger use the symbol inside the clue/alt:

```
A6. Sugar ____ ~ 1NE
A6 ^alt: 2NE
```

#### xdown: markup in clues and metadata

xd v4 calls its inline markup [xdown](https://github.com/century-arcade/xdformat/blob/master/doc/xd-format-v4.md#xdown-formatting). It is available in clue bodies and metadata values. A span is a `{`, a type character, the content, the same type character again, and a `}`. Spans can nest.

<!-- prettier-ignore -->
```md
A1. {/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here | href: https://mylink.com@} ~ AHAB
```

Clues always have a `display` array of components (and a `plain` string with the markup removed):

```json
{
  "answer": "AHAB",
  "body": "{/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here | href: https://mylink.com@}",
  "display": [
    ["italics", "Captain", [["text", "Captain"]]],
    ["text", ", "],
    ["bold", "of", [["text", "of"]]],
    ["text", ", "],
    ["underscore", "the", [["text", "the"]]],
    ["text", ", ship "],
    ["strike", "pequod", [["text", "pequod"]]],
    ["text", " "],
    ["link", "see here", "https://mylink.com", [["text", "see here"]]]
  ],
  "plain": "Captain, of, the, ship pequod [see here](https://mylink.com)"
}
```

Metadata values are parsed the same way into `metaDisplay`, e.g. `json.metaDisplay.title`.

- Italics: `{/`<kbd>words</kbd>`/}`
- Bold: `{*`<kbd>words</kbd>`*}`
- Strike through: `{-`<kbd>words</kbd>`-}`
- Underline: `{_`<kbd>words</kbd>`_}`
- Subscript `{~`<kbd>words</kbd>`~}`
- Superscript `{^`<kbd>words</kbd>`^}`
- Small caps: `{=`<kbd>words</kbd>`=}`
- Link: `{@`<kbd>words</kbd>` | href: `<kbd>url</kbd>`@}`
- Image: `{!`<kbd>alt text</kbd>` | src: `<kbd>url</kbd>`; width: 100; height: 50!}` - add `display: block` to put it on its own line. Quote a value which contains a `;`, like a data URI: `src: 'data:image/png;base64,...'`
- Literal: `{\`<kbd>text</kbd>`\}` - nothing inside is interpreted, use `{\~\}` for a ` ~ ` in a clue body
- Line break: `{\\}`
- Inline colours (a Puzzmo extension, still being discussed for the spec): `{#`<kbd>text</kbd>` | light: `<kbd>colour</kbd>`; dark: `<kbd>colour</kbd>`#}`

Every ASCII punctuation character is reserved as a type character, a `{` followed by anything else is just text. The pre-v4 positional forms (`{@text|url@}`, `{![url|alt|width|height]!}`, `{!![url]!}`, `{#text|light|dark#}`) are still read, with a deprecation warning.

`parseXDown`, `serializeXDown` and `xdownToPlainText` are exported if you want to work with xdown yourself.

#### Unfilled cells

A `?` in the grid is a cell which takes a letter, but whose solution isn't known yet - an unsolved puzzle, or a grid which is still being constructed. It is still part of its across and down words, and answers write it as `?`:

```
## Grid

C?NE

## Clues

A1. Sugar ___ ~ C?NE
```

It parses to `{ type: "letter", letter: "", unfilled: true }`, so code which switches on `tile.type` keeps working and renders an empty square. `spellLetterTile(tile)` gives the letter as it's written in an answer (`?` for an unfilled cell).

#### Answers and split characters

A clue line can list more than one answer, each after a ` ~ `. Every answer is in `clue.answers`, with `clue.answer` being the first:

```json
"answers": [{ "answer": "CONE" }, { "answer": "CANE" }]
```

Provide hints for where one word terminates and the next begins by declaring `SplitCharacter: {character}` in `Metadata`, then adding an annotation to the end of the clue line after a `//`. Each word in the annotation is one of the answers written with the split character, in any order, and answers without splits can be left out. xd v4 only reads the first word of an answer, so this stays spec-compatible:

```
## Metadata

SplitCharacter: |

## Clues
…
D25. Father of Spider-Man ~ STANLEE // STAN|LEE
D26. Band ~ OKGO ~ OKAY // OK|GO OK|AY
```

The parser gives `STANLEE` as the answer, with the split indexes on each entry in `answers` (and the first answer's on `clue.splits`). Without a `SplitCharacter` declared, `|` is used. An annotation word which doesn't spell one of the answers is an error, as is a ` ~ ` after the `//`.

Putting the split character inside the answer itself (`~ STAN|LEE`) is deprecated: it still works with a warning, and `migrateXDToV4` converts it.

### Spec-Breaking Differences

We want to highlight that 'Schrödinger clues' and the colour markup extension are spec-breaking. E.g. a parser which conforms exactly to the xd spec would likely choke when seeing these features.

### Aesthetics

The xd spec is built for displaying a large corpus of finished Crosswords, we use it for creation of new ones. This means we have a few extensions to the format to make it easier to write puzzles.

- `## Design`

Describes the visual aspects of individual cells. This started as a Puzzmo extension and is part of xd v4, replacing the older lowercase-letters-plus-`Special:` approach. The section starts with style rules, each for a single (case-sensitive) character, then a grid the same size as the puzzle where `.` is an unstyled cell:

```md
## Design

O { background: circle }

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

- `background: circle` - a circle in the cell
- `background: shaded` - a shaded cell
- `background-image: url('...')` - an image drawn in the cell, prefer a data URI
- `background-size: N M` - the image spans N cells across and M down, marked on its top-left cell
- `background-light: #[hex]` - sets the tile's background when in light mode (Puzzmo extension)
- `background-dark: #[hex]` - sets the tile's background when in dark mode (Puzzmo extension)
- `bar-top: true` - a bar on the top edge of this tile
- `bar-left: true` - a bar on the left edge of this tile

A grid with bars is treated as a barred crossword, `form: barred` metadata is no longer needed (it's still honoured). Barred grids don't support rebuses or Schrödinger squares. Rules can span lines, list many selectors (`A, B { ... }`), be re-opened, and use quoted values. For example:

<!-- prettier-ignore -->
```css
O { background: circle }
R { background-light: #FF69B4; background-dark: #C71585 }
G { background-light: #00FF00; background-dark: #008000 }
B { background-light: #00FFFF; background-dark: #00008B }
T, U { bar-top: true }
U { bar-left: true }
P { background-image: url('data:image/png;base64,iVBORw0KGgo='); background-size: 2 2 }
```

`JSONToXD` writes these rules in a canonical, compact form: properties shared by the same characters are grouped into one rule (`A, B, C { background: circle }`, `A, C { bar-top: true }`), keeping the characters as they are. A hand-written design section can come back laid out differently, but it means the same thing.

Pre-v4 design sections wrapped the rules in a `<style>` tag, which is still read with a deprecation warning.

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

| Function                       | Description                                     | Parameters                                                                 | Return Type                                            | Notes                                                                        |
| ------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `fileToXD`                     | Detects the format of a file and converts to XD | `filename: string`, `content: string \| ArrayBuffer \| Uint8Array \| Blob` | `Promise<{ xd: string; format: CrosswordFileFormat }>` | One entry point for every importer below; detects by extension then contents |
| `puzToXD`                      | Converts .puz file buffer to XD format          | `buffer: ArrayBuffer`                                                      | `string`                                               | Handles rebus symbols, circles, shades, and metadata                         |
| `uclickXMLToXD`                | Converts UClick XML format to XD                | `str: string`                                                              | `string`                                               | Parses XML crossword data and converts to XD format                          |
| `jpzToXD`                      | Converts JPZ (XML) format to XD                 | `xmlString: string`                                                        | `string`                                               | Handles JPZ crossword puzzle format conversion                               |
| `ipuzToXD`                     | Converts ipuz format to XD                      | `source: string \| object`                                                 | `string`                                               | Handles rebuses, circles, bars and pre-filled cells                          |
| `amuseToXD`                    | Converts Amuse JSON format to XD                | `amuseJSON: AmuseTopLevel`                                                 | `string`                                               | Converts Amuse Labs crossword format to XD                                   |
| `acrossTextToXD`               | Converts Across Text format to XD               | `textContent: string`                                                      | `string`                                               | Supports v1 and v2 formats, handles rebus and circles                        |
| `JSONToXD`                     | Converts CrosswordJSON back to XD format string | `json: CrosswordJSON`                                                      | `string`                                               | Main function for converting parsed data back to XD                          |
| `xdToPuz`                     | Converts an XD string to a .puz file            | `xd: string`                                                               | `Uint8Array`                                           | Embeds the .xd so `puzToXD` can re-import it losslessly                      |
| `JSONToPuz`                    | Converts CrosswordJSON to a .puz file           | `json: CrosswordJSON`, `options?: { xd?: string }`                         | `Uint8Array`                                           | Clues use their plain text, pre-filled `## Start` squares are kept           |
| `puzEncode`                    | Encodes puzzle data to .puz binary format       | `puzzle: Puzzle`                                                           | `Uint8Array`                                           | Low-level binary .puz file encoding                                          |
| `puzDecode`                    | Decodes .puz binary format to JSON              | `bytes: ArrayBuffer`                                                       | `Puz2JSONResult`                                       | Low-level binary .puz file decoding                                          |
| `editorInfoAtCursor`           | Gets crossword information at cursor position   | `data: CrosswordJSON`                                                      | `(line: number, index: number) => PositionInfo`        | For editor integrations - requires editorInfo                                |
| `xdDiff`                       | Creates semantic diff between two XD files      | `beforeXD: string`, `afterXD: string`                                      | `DiffResults`                                          | Line-by-line differences with metadata awareness                             |
| `runLinterForClue`             | Runs linting checks on individual clues         | `clue: Clue`, `ordinal: "across" \| "down"`                                | `Report[]`                                             | Checks for common crossword construction issues                              |
| `validateClueAnswersMatchGrid` | Validates clue answers match grid tiles         | `json: CrosswordJSON`                                                      | `Report[]`                                             | Checks consistency between answers and grid                                  |
| `resolveFullClueAnswer`        | Resolves clue answer with rebus and splits      | `clue: Clue`, `splitChar: string`                                          | `string`                                               | Handles rebus substitution and split characters                              |

### xd-crossword-tools-parser Utility Functions

The `xd-crossword-tools-parser` package exports several utility functions for working with crossword data:

| Function                                    | Description                                                          | Parameters                                                                                | Return Type                                            |
| ------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `getTile`                                   | Gets a specific tile from the crossword grid at the given position   | `tiles: Tile[][]`, `position: Position`                                                   | `Tile \| undefined`                                    |
| `clueInfosForPosition`                      | Finds which clues (across/down) exist at a given grid position       | `tiles: Tile[][]`, `clues: Clues`, `position: Position`                                   | `{down?: ClueInfo, across?: ClueInfo}`                 |
| `tilePositionsForClue`                      | Gets all tile positions that belong to a specific clue               | `clue: Clue`, `direction: CursorDirection`                                                | `Position[]`                                           |
| `getWordTilesForCursor`                     | Gets all tile positions that are part of the word at cursor position | `tiles: Tile[][]`, `cursor: Cursor`                                                       | `Position[]`                                           |
| `getSortedTilesForCursor`                   | Gets word tiles for cursor, sorted with boundary info                | `tiles: Tile[][]`, `cursor: Cursor`                                                       | `{first: Position, last: Position, tiles: Position[]}` |
| `getCluePositionsForBoard`                  | Analyzes grid to determine all positions where clues start           | `tiles: Tile[][]`                                                                         | `PositionWithTiles[]`                                  |
| `parseXDown`                                | Parses xdown markup into structured components                       | `input: string`, `options?: XDownParseOptions`                                            | `XDownComponent[]`                                     |
| `serializeXDown`                            | Writes xdown components back out as an xd v4 string                  | `components: XDownComponent[]`                                                            | `string`                                               |
| `xdownToPlainText`                          | Flattens xdown components to a string without markup                 | `components: XDownComponent[]`                                                            | `string`                                               |
| `migrateXDToV4`                             | Rewrites an older xd file in xd v4 syntax                            | `xd: string`                                                                              | `string`                                               |
| `parseDesignRules`                          | Parses the style rules from a `## Design` section                    | `text: string`                                                                            | `{ styles, errors }`                                   |
| `isBarredGrid`                              | Whether a crossword uses bars rather than blocks                     | `json: CrosswordJSON`                                                                     | `boolean`                                              |
| `EditorError`                               | Custom error class for XD parsing errors with line numbers           | `message: string`, `line: number`                                                         | `EditorError`                                          |
| `hasImplicitSections`                       | Checks if an xd file uses implicit (header-less) sections            | `xd: string`                                                                              | `boolean`                                              |
| `addHeadersToImplicitSections`              | Adds `## Headings` to an xd file which uses implicit sections        | `xd: string`                                                                              | `string`                                               |
| `letterToTile`                              | Converts a single letter string to a Tile object                     | `letter: string`                                                                          | `Tile`                                                 |
| `stringGridToTiles`                         | Converts a 2D string array to a 2D Tile array                        | `rebuses: Rebuses`, `strArr: string[][]`, `schrodingerRebuses?: Record<string, string[]>` | `Tile[][]`                                             |
| `replaceWordWithSymbol`                     | Replaces a word in tiles with a rebus symbol                         | `word: string`, `tiles: Tile[]`, `splitChar: string`                                      | `void`                                                 |

## Publishing and deployment

### NPM Package Publishing

NPM package publishing happens automatically via GitHub Actions when changes are pushed to the `main` branch. The workflow compares local package versions with published versions on npm and only publishes if versions have been bumped.

#### To Prepare a New Release

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
