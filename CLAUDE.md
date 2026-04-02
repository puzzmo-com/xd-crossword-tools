# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

xd-crossword-tools is a TypeScript monorepo for working with crossword puzzles, centered around the `.xd` format - a human-readable text format for crosswords. The project provides parsing, conversion between formats (.puz, .jpz, UClick XML, Amuse JSON), and an interactive web playground.

## Monorepo Structure

Three main packages:

- `packages/xd-crossword-tools-parser/`: Core parser (.xd → JSON), minimal dependencies
- `packages/xd-crossword-tools/`: Full toolset with format conversions, depends on parser
- `website/`: React-based interactive playground with Monaco editor

## Common Commands

### Building

```bash
# Build all packages
yarn build

# Build individual packages
cd packages/xd-crossword-tools-parser && yarn build
cd packages/xd-crossword-tools && yarn build
cd website && yarn build

# Development mode with watch
cd packages/xd-crossword-tools-parser && yarn dev
cd packages/xd-crossword-tools && yarn dev
cd website && yarn dev
```

### Testing

```bash
# Run all tests
yarn test

# Run tests for a specific file
yarn test path/to/test.ts

# Update snapshots
yarn test -u
```

### Type Checking

```bash
yarn type-check
```

### Running the Website

```bash
cd website
yarn dev  # Starts on http://localhost:5173
```

## Architecture Notes

- The parser (xdparser2.ts) returns comprehensive JSON with pre-computed information for runtime efficiency
- Editor support (cursor positions, linting) is opt-in via the `supportCursorPosition` flag
- Format converters are in `packages/xd-crossword-tools/src/` (e.g., importPuz.ts, exportPuz.ts)
- Tests use Vitest with extensive snapshot testing for format conversions
- The project uses tsup for building, outputting both ESM and CJS formats

## XD Format Syntax

Real example from `tests/output/alpha-bits.xd` (trimmed):

```
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

## Clues

A1. Captain of the Pequod ~ AHAB
A5. Food for second chance chewing ~ CUD
A8. Font feature ~ SERIF
...
D1. Pc. of concert gear ~ AMP
D2. Conceal ~ HIDE
D3. AAA's counterpart across the pond ~ RAC
...

## Notes

## Design

<style>O { background: circle }</style>

O..O##O.O#.O..O
.....#...#.....
...
```

Sections are separated by `## Headers`. Grid uses `.` for black squares, letters for fills. Clues use `A`/`D` prefixes with `~` separating clue from answer.

Special features:

- Markup: `{/italic/}`, `{*bold*}`, `{&link|url&}`, `{!image|alt!}` and more


## Development Tips

- When modifying the parser, update both the parser logic and the corresponding TypeScript types
- Format conversion tests use snapshot testing - review snapshots carefully when they change
- The website automatically rebuilds when packages change in dev mode
- Check existing test fixtures in `tests/` directories for format examples
- When writing tests prefer using fixtures instead of writing objects yourself which conform to the interface shapes
- **Round-trip fidelity is a hard problem in this project.** The pipeline xd → AST → xd must produce the same document. New features should always include a full pipeline round-trip test to verify the output matches the original input
