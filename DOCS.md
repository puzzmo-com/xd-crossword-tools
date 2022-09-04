## Authoring an xd Crossword

[This doc is a work in progress]

xd is a file format for describing a crossword in text, built to look like a very common file format called markdown. You might have seen markdown format in Reddit/Slack/Discord and other modern formatting for example: `*bold*` or `_italics_`. Oddly enough, this document is written in markdown.

#### Sections

An `xd` file is split into sections using `##`s. They are used at the start of line and indicate what the next section will be. For example `## Grid` means the start of the grid section.

```md
## Grid

AHAB..CUD.SERIF
MADAM.ANY.ABODE
PLANE.DIE.NOTON
( ...etc )
```

The order of sections does not matter, but it is convention to be ordered in: metadata, grid, clues, notes. That's how we'll document it.

#### Metadata

Within the grid section, text is treated as a 'look up' table separated by the first colon: on the right we have the name and on the left we have the content. 

```md
## Metadata

Title: Alpha-Bits
Author: Drew Hodson
Copyright: © 2021
Description: N/A
```

This tells the crossword app 4 different types of information about the puzzle. Some crossword apps may support more bits of info and use it for more 