# xd-crossword-tools

Tools for taking different crossword file formats and converting them to xd. Consolidates a few older JS libraries into a single repo with no dependencies, converts them all to TypeScript, ensures they run in a browser and Node, then adds some tests for them.

[xd](https://github.com/century-arcade/xd) is a text-based crossword format which is easy for humans to read and reason about.

### xd to JSON

Builds on [xd-crossword-parser](https://github.com/j-norwood-young/xd-crossword-parser) (MIT license).


```ts
import {xdToJSON} from "xd-crossword-tools"

const xd = '[...]'
const crossword = xdToJSON(xd)
```

The JSON format is a bit more verbose than you might expect (see below for an example), but the goal is to have as much information pre-computed at parse time
in order to save lookups later at runtime. You can see the type definitions here: [`./lib/types.ts`](./lib/types.ts)

### .puz to .xd

Builds on [puzjs](https://www.npmjs.com/package/puzjs) (ISC license). The puz format is generally what tools and websites will give you as an output format.

```ts
import {puzToXd} from "xd-crossword-tools"

const puzResponse = await fetch(url)
const puzBuffer = await res.arrayBuffer()
const xd = puzToXd(puzBuffer)
```

Converting from puz to xd _is lossy_ like in the example below, the crossword has a fun play with the circles marks (e.g. highlighted tiles) which isn't supported
metadata inside the xd file format. This is a trade-off, and it's quite possible that xd-crossword-tools will be extending the xd format to handle some of the differences eventually.

### Example

Let's take this free .puz: https://dehodson.github.io/crossword-puzzles/crosswords/alpha-bits/

Their .puz file turns into this xd:

```s
Title: Alpha-Bits
Author: Drew Hodson
Copyright: © 2021
Description: N/A


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


A1. Captain of the Pequod ~ AHAB
A5. Food for second chance chewing ~ CUD
A8. Font feature ~ SERIF
A13. Palindromic address to a female ~ MADAM
...

D1. Pc. of concert gear ~ AMP
D2. AI antagonist of 2001 ~ HAL
D3. Programming pioneer Lovelace ~ ADA
D4. Prohibit ~ BAN
...

```

And then turned into this JSON:

```json
{
  "game": "crossword:props",
  "meta": {
    "title": "Alpha-Bits",
    "author": "Drew Hodson",
    "copyright": "© 2021",
    "description": "N/A"
  },
  "tiles": [
    [
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "H",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "B",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "C",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "U",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "D",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "S",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "R",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "I",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "F",
        "state": "normal"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "M",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "D",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "M",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "Y",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "B",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "D",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "P",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "L",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "D",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "I",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
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
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "D",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "G",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
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
        "letter": "G",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "S",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "H",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "I",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "J",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "K",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "L",
        "state": "normal"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "R",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "I",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "C",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "L",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "R",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "U",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "D",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "Y",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "R",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "L",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "Y",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "M",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "I",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "S",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "P",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "R",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "I",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
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
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "I",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "M",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "S",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
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
        "letter": "C",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "L",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "D",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "R",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "R",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "I",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "S",
        "state": "normal"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "I",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "C",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "R",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "P",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "H",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "L",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "P",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "H",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "Q",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "R",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "S",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "S",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "I",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
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
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "L",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "L",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "H",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "L",
        "state": "normal"
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
        "letter": "S",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "P",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "I",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "R",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "L",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "S",
        "state": "normal"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "R",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "S",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "D",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "O",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "N",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      }
    ],
    [
      {
        "type": "letter",
        "letter": "U",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "W",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "V",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "E",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "W",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "A",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "X",
        "state": "normal"
      },
      {
        "type": "blank"
      },
      {
        "type": "blank"
      },
      {
        "type": "letter",
        "letter": "Y",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "U",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "T",
        "state": "normal"
      },
      {
        "type": "letter",
        "letter": "Z",
        "state": "normal"
      }
    ]
  ],
  "clues": {
    "across": [
      {
        "main": "Captain of the Pequod",
        "answer": "AHAB",
        "number": 1,
        "position": {
          "col": 0,
          "index": 0
        }
      },
      {
        "main": "Food for second chance chewing",
        "answer": "CUD",
        "number": 5,
        "position": {
          "col": 6,
          "index": 0
        }
      },
      {
        "main": "Font feature",
        "answer": "SERIF",
        "number": 8,
        "position": {
          "col": 10,
          "index": 0
        }
      },
      {
        "main": "Palindromic address to a female",
        "answer": "MADAM",
        "number": 13,
        "position": {
          "col": 0,
          "index": 1
        }
      },
      {
        "main": "___ Way You Want It",
        "answer": "ANY",
        "number": 15,
        "position": {
          "col": 6,
          "index": 1
        }
      },
    ],
    "down": [
      {
        "main": "Pc. of concert gear",
        "answer": "AMP",
        "number": 1,
        "position": {
          "col": 0,
          "index": 0
        }
      },
      {
        "main": "AI antagonist of 2001",
        "answer": "HAL",
        "number": 2,
        "position": {
          "col": 1,
          "index": 0
        }
      },
      {
        "main": "Programming pioneer Lovelace",
        "answer": "ADA",
        "number": 3,
        "position": {
          "col": 2,
          "index": 0
        }
      },
      {
        "main": "Prohibit",
        "answer": "BAN",
        "number": 4,
        "position": {
          "col": 3,
          "index": 0
        }
      },
      {
        "main": "Type of person to routinely carry a club",
        "answer": "CADDIE",
        "number": 5,
        "position": {
          "col": 6,
          "index": 0
        }
      },
      {
        "main": "State of the ___ Address",
        "answer": "UNION",
        "number": 6,
        "position": {
          "col": 7,
          "index": 0
        }
      },
      {
        "main": "Colorful homophone of 18A",
        "answer": "DYE",
        "number": 7,
        "position": {
          "col": 8,
          "index": 0
        }
      },
      {
        "main": "Snitched",
        "answer": "SANG",
        "number": 8,
        "position": {
          "col": 10,
          "index": 0
        }
      },
      {
        "main": "Kindle fare",
        "answer": "EBOOK",
        "number": 9,
        "position": {
          "col": 11,
          "index": 0
        }
      },
      {
        "main": "Decayed matter",
        "answer": "ROT",
        "number": 10,
        "position": {
          "col": 12,
          "index": 0
        }
      }
    ]
  }
}

```


### Filetypes this lib is open to adding

- http://www.ipuz.org
- https://www.xwordinfo.com/XPF/ / https://www.xwordinfo.com/JSON/
