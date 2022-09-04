This isn't a comprehensive doc because to our knowledge there are no OSS consumers of this lib, but for posterities sake here are the breaking changes:


### 3 -> 4

- Makes the older hint format of:

```
A1. Gardener's concerns with A2 and D4. ~ BULB
A1. Turned on to illuminate a room. ~ BULB
```

now get errors, and instead they look like:

```
A1. Gardener's concerns with A2 and D4. ~ BULB
A1~Hint. Turned on to illuminate a room.
A1~Refs. A2 D4
```

Includes an auto-migration to a 'hint' which wll be removed with v5 when not in strict mode.

- Strict mode parsing is also switched to default as 'off' if you don't pass that parameter to `xdToJSON`.

- Converts license from ISC to MIT. ISC is the defaults in npm projects, but I'm an old school and I like MIT.
  Adds a license file to the root of the project, so that automated tooling can get it. 

### 2 -> 3

Clue formats changed to handle secondary clue parsing

### 1 -> 2

Shifted the type exports in a way which was breaking but made it easier to have a crossword app extend the types.