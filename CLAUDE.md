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

Basic structure:
```
Title: Example Puzzle
Author: Jane Doe

[grid definition with letters/blanks]

Across
1. First clue
2. Second clue

Down
1. First down clue
```

Special features:
- Rebus: `(OK)` in grid
- Markup: `{/italic/}`, `{*bold*}`, `{&link|url&}`, `{!image|alt!}`
- Metadata in curly braces: `{Notes: Some notes}`

## Development Tips

- When modifying the parser, update both the parser logic and the corresponding TypeScript types
- Format conversion tests use snapshot testing - review snapshots carefully when they change
- The website automatically rebuilds when packages change in dev mode
- Check existing test fixtures in `tests/` directories for format examples