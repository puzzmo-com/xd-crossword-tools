This isn't a comprehensive doc because to our knowledge there are no OSS consumers of this lib, but for posterities sake here are the breaking changes:

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

- Image inline: `{!`<kbd>url</kbd>`|`<kbd>alt text</kbd>`!}`
- Image block: `{!!`<kbd>url</kbd>`|`<kbd>alt text</kbd>`!}`

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
