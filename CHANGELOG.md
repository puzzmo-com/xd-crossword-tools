This isn't a comprehensive doc because to our knowledge there are no OSS consumers of this lib, but for posterities sake here are the breaking changes:

### 14.0.1

- puz importer handles more rebus cases

### 14.0.0

- The Amuse importer collapses `<br>`/`<div>` line breaks inside clue text and revealer metadata to spaces - xd clues are one line each, and multi-line clue bodies produced xd which failed to parse.
- The playground's Design tab editor now renders background colors (including on blank squares) and circles, shows color swatches on the style picker, and gains an eraser tool.

- The Amuse importer now converts cell background colors (`cellInfos[].bgColor`) into Design section styles using `background-light`/`background-dark`, including cells which are both circled and colored. Bar and color style letters are allocated from a shared pool so they can no longer collide.
- Adds `ipuzToXD(source)`, a converter for [ipuz](https://libipuz.org/spec/ipuz-spec.html) crossword files. It accepts the raw file text (including the optional `ipuz(...)` JSONP wrapper) or an already-parsed JSON object, and supports blocks, null cells, custom `block`/`empty` characters, rebus cells (multi-letter solutions), Schrödinger cells (solutions with multiple candidate values, emitted as 14.0.0's multi-valued rebus keys), circled/shaded cells, barred grids, pre-filled cells (as an xd Start section) and the common metadata fields. `fileToXD` now routes `.ipuz` files — and `.json` or extension-less files carrying an `ipuz.org` marker — to it automatically.

- Schrödinger squares can now be declared through the rebus metadata by giving a key more than one value, e.g. `rebus: 1=O 1=A` with a `1` in the grid. Values can be single letters, multi-letter (rebus) values, or a mix, and multi-valued keys can sit alongside regular single-valued rebus keys. These tiles get an optional `symbol` field on `SchrodingerTile`, and `JSONToXD` round-trips the syntax.
- The previous way of declaring Schrödinger squares (a `*` in the grid plus `^alt:` clue metadata) is deprecated. It is still parsed, and the two techniques can be combined, but the rebus-based syntax is now the recommended approach.
- `stringGridToTiles` gains an optional third parameter, `schrodingerRebuses` — existing two-argument calls are unaffected.
- `SchrodingerTile` gains `validOptions: string[]`: every valid value for the square (single letters and rebus values in one list) in declaration order, so the array position is a variant index. Squares which resolve to the same index belong to the same solution of the puzzle. The pre-existing `validLetters`/`validRebuses` split can't express this — with `rebus: 1=O 1=AR`, "O" is `validLetters[0]` and "AR" is `validRebuses[0]`, so index comparisons collapse two different solutions onto index 0.

  FWIW this is what a completeness checker should look like, run per square as the player fills one in. A Schrödinger square's value must be one of the tile's options _and_ agree on the variant index with every other filled Schrödinger square in the two words crossing it (e.g. seven squares in one answer reading `CLINTON` or `BOBDOLE`, but never a mix). The board is complete when every square holds a value which passed this check:

  ```ts
  import { getTile, clueInfosForPosition, tilePositionsForClue } from "xd-crossword-tools-parser"

  /** valueAt is your game's user-input state: the string in a square, or undefined when empty */
  function isTileCorrect(data: CrosswordJSON, position: Position, value: string, valueAt: (p: Position) => string | undefined) {
    const tile = getTile(data.tiles, position)
    if (!tile) return false
    switch (tile.type) {
      case "letter":
        return tile.letter === value
      case "rebus":
        return tile.word === value
      case "blank":
        return false
      case "schrodinger": {
        const variant = tile.validOptions?.indexOf(value) ?? -1
        if (variant === -1) return false

        // Both the across and the down word through this square must agree on the variant
        const clueInfos = clueInfosForPosition(data.tiles, data.clues, position)
        for (const direction of ["across", "down"] as const) {
          const clueInfo = clueInfos[direction]
          if (!clueInfo) continue
          for (const pos of tilePositionsForClue(clueInfo.clue, direction)) {
            const otherTile = getTile(data.tiles, pos)
            const otherValue = valueAt(pos)
            if (otherTile?.type !== "schrodinger" || otherValue === undefined) continue
            const otherVariant = otherTile.validOptions?.indexOf(otherValue) ?? -1
            if (otherVariant !== -1 && otherVariant !== variant) return false
          }
        }
        return true
      }
    }
  }
  ```

  You could do a simpler clue-based checker, but you need some way to know that a tile is correct eventually.

  One caveat with checking per square: a value is only compared against the Schrödinger squares filled in _so far_, so if the player later flips an earlier square to the other variant, re-run the check for the other squares in the affected words.

### 13.3.1

- Adds support for cross compiler XML without a root element of `<crossword-compiler>`

### 13.3.0

- Adds `fileToXD(filename, content)`, a single entry point that detects a crossword file's format (from its extension, then its contents) and converts it to xd — so consumers no longer need to hand-roll the "is this a `.jpz` / `.puz` / Crossword Compiler XML / …" checks. Accepts a `string`, `ArrayBuffer`, `Uint8Array`, or `Blob`/`File`, and covers `.xd`, `.jpz`, `.puz`, Amuse `.json`, UClick / Crossword Compiler `.xml`, Across Lite `.puz.txt`, and PuzzleMe `.html`.

### 13.2.0

- Adds support for Crossword Compiler XML files
- Makes some of the Puzzmo-y feeling linters only apply if you have split character on

### 13.1.0

- Switched the xml parsing library from xml-parser to fast-xml-parser. It may claim to be faster, but it can handle more complicated XML setups. This is mostly useful for the jpz -> xd clue parsing which should cover more cases now

### 13.0.0

- All formatting types (bold, italics, strike, underscore, subscript, superscript, link, color) now have a required `children` field containing parsed inner components. This enables nested markup like `{*{/bold italic/}*}` or `{*bold {/and italic/} text*}`.

- The `text` field (index 1) still contains the raw content string for backwards compatibility. It has been marked as deprecated though.

- The markup has switched from some regexes to a real parser.

### 12.3.0

- Adds a CLI, see the README for examples of usage

### 12.2.1

- Roundtrips through xdToJSON and back do not add newlines to custom sections

### 12.2.0

- Adds support for converting Across Text format to XD.

### 12.1.0

- Adds some functions for handling importing from a Puzzleme URL. Built on code found in <https://github.com/thisisparker/xword-dl> and <https://github.com/jpd236/kotwords>

### 12.0.0

- Fix bug with pipe positions inside rebus answers that occurred when converting xd format to JSON and back to xd. This change updates the format of JSON puzzle to include `rebusInternalSplits`, and updates the signature of the resolveFullClueAnswer function to no longer take a rebusMap parameter.

### 11.1.0

Markup changes:

- Changed ~ from strike to subscript
- Added ^ for superscript
- Strike now only uses -

### 11.0.1

- Amuse JSON import improvements

### 11.0.0

Three breaking changes:

Two minor:

- `clue.metadata` not isn't always a `Record<string, string>` - we process both `hint` and `revealer` clue metadata strings, so that you can use template syntax inside the strings. Available as `hint:display` and `revealer:display`.

- `backgroundLight` and `backgroundDark` are now documented as `background-light` and `background-dark` in the design docs.

The second is a pretty drastic change to barred support. Instead of trying to derive all of the bars by an algorithm, we now explicitly require a design section which describes the bars positions.

I prefer the explicit nature of this, but a lot of the reason is that making a perfect algorithm for this is tricky and requires having access to a lot of examples. This way we can make the jpz/json port simpler and makes the xd file describe the problem better.

We support describing both a bar-top and bar-left in the CSS style system. So, for example the below crossword would have a design section like:

```
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
```

### 10.0.0

Adds support for barred Crosswords (in jpz imports, and if you are hand authoring) - a barred xd file requires you to declare that it is barred via

```
form: barred
```

in the metadata, and then during processing we will derive all of the inline bars based on the answers in the clues. Here is an example of a converted jpz to xd which I took [from the internet](https://beneaththesurfacepuzzles.blogspot.com/2023/02/printers-devilry-4-midi.html) (thanks Kyle!):

```
## Metadata

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

```

Sem-ver major because I removed an exported function which was used inside the jpz to xd converter.

### 9.1.9

Adds a new function `validateClueAnswersMatchGrid` which verifies the tiles and clues answer matches

### 9.1.8

Added `width/height` to:

- Image inline: `{!`<kbd>url</kbd>`|`<kbd>alt text</kbd>`|width|height!}`
- Image block: `{!!`<kbd>url</kbd>`|`<kbd>alt text</kbd>`|width|height!}`

### 9.1.7

Unknown sections of an xd file are now added into the JSON model, so you can use arbitrary sections at will.

### 9.1.6

Clues can contain inline colours on a word:

> Inline colours: `{#`<kbd>text</kbd>`|`<kbd>hex colour light</kbd>|<kbd>hex colour dark</kbd>`#}`

### 9.1.4 - 5

It's now possible to put a rebus inside a schrodinger's square. You reference the rebus via the clue/alt

```
A6. Sugar ____ ~ 1NE
A6 ^alt: 2NE
```

With the rebus as `Rebus: 1=CO 2=BO

### 9.1.3

Exports more types

### 9.1.1

Adds the ability to track and store Schrödinger squares:

```
## Metadata

title: Mini 240918 Schrödinger 1
author: Puzzled in CNY
copyright: Copyright Puzzled in CNY, all rights reserved
description: Not the world's most challenging or entertaining Schrödinger but...baby steps! - Created on crosshare.org

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

Supports multiples of alts, so:

```
A6. Sugar ____ ~ CONE
A6 ^alt: CANE
A6 ^alt2: BONE
```

Would all be legit.

### 9.1.0

Adds the ability to parse inline and block images in a clue using the following syntax:

- Image inline: `{!`<kbd>url</kbd>`|`<kbd>alt text</kbd>`|width|height!}`
- Image block: `{!!`<kbd>url</kbd>`|`<kbd>alt text</kbd>`|width|height!}`

(Updated in 9.1.8)

### 9.0.0

Split out the parser into it's own package. So, if you're making a crossword game, then you can just depend on `xd-crossword-tools-parser` and not have to depend on the tools.

### 8.1.0

Adds support for parsing jpz files into xd files using the new `jpzToXD` function.

Also adds a function for re-creating the answer metadata on clues (e.g. the `~ ABC` bit) on an existing `CrosswordJSON` object. Needed this for the jpz parser but it's a useful thing to have in general.

### 8.0.1

After 3 separate attempts to figure out markup support in clues, we've settled on the xd spec compliant version of "markdown with a curly brace."

In the process we've dropped `bodyMD` as an optional field on a clue, and switched over to having a "display" field on the clue which should really always be used when presenting a clue for user-facing cases. It is a tuple array indicating how to present chunks of the clue incrementally.

<!-- prettier-ignore -->
```md
A1. {/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here|https://mylink.com@} ~ AHAB
```

Turns into:

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

Also adds "direction" on the clue, it's a tiny micro-optimization, but when you are writing tools which interact with clues, you're often keeping track of this separately - might as well move it inline properly.

### 7.x.x

A brief sojourn into using BBCode as the markup language for clues.

### 6.6.0

A chunky re-write of the markdown parser now that it's actually in use at Puzzmo, see the README for an up-to-date look at what we think it should do.

### 6.3.3

Fixes xd -> JSON -> xd process by converting clue answer to an answer that includes the rebus (if there is one), adding back in pipes/splits (if there are any) and then replacing the rebus symbols back to their word mappings.

### 6.3.0

Adds a fn for generating semantic diffs between xd crossword files: `xdDiff`.

### 6.0.0

- The xdparser is now a recoverable parser, what this means is that it will not throw at the first sign of some unexpected input.
  This means you can't rely on `try {}` to determine if you have a successful parse. Thus: a breaking semver change.

- Added a new `report` object on the JSON response from `xdToJSON`. This will contain any errors or warnings that were encountered during parsing and a `success` boolean.

- Added the concept of warnings. These are generalized messages which you probably want to act on, but really shouldn't be blocking builds.

- Added a markdown parser to the clue - we don't make assumptions about the rendering engine and so have a mini-markdown parser in the code base, which gives you a JSON array of the clue's text and formatting. See the README for more.

### 5.1.1

- Clues from .puz files have newlines stripped out of them

### 5.1

- Adds support taking an `.xd` and getting it into a format so it can be used with `@confuzzle/writepuz` to generate a `.puz` file

- Fixes the editor info for the down clues!

### 4 -> 5

- The output for the xd from the app now always uses lowercase keys for the meta section

### 3 -> 4

- Makes the older hint format of:

  ```
  A1. Gardener's concerns with A2 and D4. ~ BULB
  A1. Turned on to illuminate a room. ~ BULB
  ```

  throw an error. The new format is:

  ```
  A1. Gardener's concerns with A2 and D4. ~ BULB
  A1 ^Hint: Turned on to illuminate a room.
  A1 ^Refs: A2 D4
  ```

  Includes an auto-migration to a 'hint' which wll be removed with v5 when not in strict mode.

- Strict mode parsing is also switched to default as 'off' if you don't pass that parameter to `xdToJSON`.

- Converts license from ISC to MIT. ISC is the default for npm projects, but I'm old school and I like MIT.
  Adds a license file to the root of the project, so that automated tooling can get it.

- The text for a crossword's clue's field used to be `hint` and now lives in `body`

### 2 -> 3

Clue formats changed to handle secondary clue parsing

### 1 -> 2

Shifted the type exports in a way which was breaking but made it easier to have a crossword app extend the types.
