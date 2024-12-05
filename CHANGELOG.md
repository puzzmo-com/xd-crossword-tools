This isn't a comprehensive doc because to our knowledge there are no OSS consumers of this lib, but for posterities sake here are the breaking changes:

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
