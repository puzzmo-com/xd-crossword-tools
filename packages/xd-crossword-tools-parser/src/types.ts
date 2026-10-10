import type { ParseMode } from "./parser/xdToJSON"

export type CrosswordJSON = {
  /** Info to display about the Crossword, keys are lowercased because they are case-insensitive in xd  */
  meta: {
    title: string
    author: string
    editor: string
    date: string
    splitCharacter?: string
  } & Record<string, string>

  /**
   * Metadata values can contain xdown markup in xd v4, this is each value from `meta` (keyed the
   * same way) parsed into components for rendering. Use `xdownToPlainText` for a markup-free version.
   */
  metaDisplay: Record<string, XDownComponent[]>

  /** 2 dimensional array of tiles */
  tiles: Tile[][]
  /** Derived clue info with positioning for the xword */
  clues: {
    across: Clue[]
    down: Clue[]
  }
  /** Anything which lives in the notes section */
  notes: string

  /** A sparse array of pre-filled letters */
  start?: string[][]

  /** A Key : Value list of rebus tiles */
  rebuses: Record<string, string>
  /** An after the puzzle is done question */
  metapuzzle?: {
    clue: string
    answer: string
  }
  /** Aesthetics */
  design?: {
    /** CSS-like rules, keyed by their single character selector, e.g. `{ O: { background: "circle" } }` */
    styles: Record<string, Record<string, string>>
    /** A sparse array of strings for where the design elements should exist */
    positions: string[][]
  }

  /** Info generated during parse which can be passed when
   *  figuring out what is under the cursor. There is an argument in xdToJSON
   * which will have this info included in the results. */
  editorInfo?: EditorInfo

  /** A summary of the parse  */
  report: {
    /** Did we parse successfully */
    success: boolean
    /** Errors are 'this syntax is wrong' */
    errors: Report[]
    /** Lint warnings which are general 'hey should you be doing this?' */
    warnings: Report[]
  }
  /**
   * If there are any sections which were not known, we slugify
   * the title and use it as the key, then add the text content as the value
   */
  unknownSections: Record<string, { title: string; content: string }>
}

export type Report =
  | { type: "syntax"; position: Position; length: number; message: string }
  /** Pre-v4 syntax which still parses, `migrateXDToV4` can update the file */
  | { type: "deprecation"; position: Position; length: number; message: string }
  | {
      type: "clue_msg"
      position: Position
      length: number
      clueNum: number | unknown
      clueType: CursorDirection | unknown
      message: string
    }
  | {
      type: "clue_grid_mismatch"
      position: Position
      length: number
      clueNum: number
      message: string
      clueType: CursorDirection | unknown
      expectedAnswer: string
      actualAnswer: string
    }

export type EditorInfo = {
  /** Positioning for the blocks of xd content */
  sections: Array<{ startLine: number; endLine: number; type: ParseMode }>
  /** The original lines which were separated by '/n' so you can work directly
   * against the input instead of keeping a potentially outdated reference to the text */
  lines: string[]
}

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

export type Tile = LetterTile | BlankTile | RebusTile | SchrodingerTile

export type TileDesignFlags = "bar-top" | "bar-left"

export interface LetterTile {
  letter: string
  type: "letter"
  clues?: {
    across?: number
    down?: number
  }
  design?: TileDesignFlags[]
}

export interface SchrodingerTile {
  type: "schrodinger"
  /** Possible letter tiles */
  validLetters: string[]
  /** Possible rebus tiles */
  validRebuses: { letters: string; symbol: string }[]
  /**
   * Every valid value for this square (single letters and multi-letter rebus values
   * in one ordered list). The position in the array is the variant index: Schrödinger
   * squares which resolve to the same index belong to the same solution, so checkers
   * can compare one index instead of special-casing letters vs rebuses. For rebus-based
   * squares the order matches the declaration order in the `rebus:` metadata, for
   * `^alt`-based squares it is [primary answer, alt, alt2, ...].
   */
  validOptions?: string[]
  /** Present when this Schrödinger tile originated from a multi-valued rebus key */
  symbol?: string
  clues?: {
    across?: number
    down?: number
  }
  design?: TileDesignFlags[]
}

export interface RebusTile {
  type: "rebus"
  word: string
  symbol: string
  clues?: {
    across?: number
    down?: number
  }
  design?: TileDesignFlags[]
}

export interface BlankTile {
  type: "blank"
  /** Set for '_' in the grid: a spacer or non-existent square (usually on the edges) which should not be drawn */
  spacer?: true
}

export interface Position {
  col: number
  index: number
}

/**
 * Inline xdown elements to handle when rendering clues and metadata values.
 * The `children` field contains parsed inner components and supports nested markup
 * (e.g. {*{/bold italic/}*}). The `text` field retains the raw content string.
 */
export type XDownComponent =
  | [type: "text", text: string]
  | [type: "linebreak"]
  | [type: "img", url: string, alt: string, block: boolean, width?: string, height?: string]
  | [type: "italics", /** @deprecated  */ text: string, children: XDownComponent[]]
  | [type: "bold", /** @deprecated  */ text: string, children: XDownComponent[]]
  | [type: "strike", /** @deprecated  */ text: string, children: XDownComponent[]]
  | [type: "underscore", /** @deprecated  */ text: string, children: XDownComponent[]]
  | [type: "subscript", /** @deprecated  */ text: string, children: XDownComponent[]]
  | [type: "superscript", /** @deprecated  */ text: string, children: XDownComponent[]]
  | [type: "smallcaps", /** @deprecated  */ text: string, children: XDownComponent[]]
  | [type: "link", /** @deprecated  */ text: string, to: string, children: XDownComponent[]]
  | [type: "color", /** @deprecated  */ text: string, lightColor: string, darkColor: string, children: XDownComponent[]]

/** @deprecated clue markup is called xdown in xd v4, use XDownComponent */
export type ClueComponentMarkup = XDownComponent

export interface Clue {
  /** The "clue" as a raw string, sans markup processing */
  body: string
  /** The body as a set of inline xdown components, you always want to use this for displaying clues to a user */
  display: XDownComponent[]
  /**
   * The body with all markup flattened into a single string, for consumers which cannot render markup.
   * Images become their alt text in square brackets (`[a sleepy cat]`, or `[image]` when no alt text was
   * given) and links are kept in markdown form (`[you should read](https://github.com)`).
   */
  plain: string
  /** The number, whether it is across or down is handled back at 'clues' */
  number: number
  /** The first answer after the " ~ ", without any split characters. The same as `answers[0].answer` */
  answer: string
  /**
   * Every valid answer for the clue, the first is `answer`. Most clues have one, a Schrödinger slot lists each of
   * its fills: `A1. Sugar ___ ~ CONE ~ CANE`. Includes pre-v4 `^alt:` answers. Rebuses are expanded.
   */
  answers: ClueAnswer[]
  /** Filled in metadata giving the location of the first char on the grid */
  position: Position
  /** Tiles that the clue is composed of */
  tiles: Tile[]
  /** Somewhat redundant, but also useful reference to whether this clue is was created when looking at acrosses or downs */
  direction: CursorDirection
  /** The splits for the first answer, the same as `answers[0].splits` - see ClueAnswer */
  splits?: number[]
  /** For splits that occur within rebus squares, maps tile index to array of internal split positions */
  rebusInternalSplits?: Record<number, number[]>
  /**
   * Clue metadata lines (e.g. "A23 ^Hint: A shot to the heart") add { "hint": "A shot to the heart" }
   * to the metadata. This works for any key, and keys are lowercased as they are case-insensitive
   *
   * When either 'hint' or 'revealer' are set, then template string processing is applied
   * resulting in "hint:display" and "revealer:display" which contain processed markup components,
   * alongside "hint:plain" and "revealer:plain" which contain the flattened strings.
   */
  metadata?: Record<string, string> & {
    "hint:display"?: XDownComponent[]
    "revealer:display"?: XDownComponent[]
    "hint:plain"?: string
    "revealer:plain"?: string
  }
}

export interface ClueAnswer {
  /** The answer without any split characters */
  answer: string
  /**
   * Where the answer splits into words, from the end-of-line annotation 'A1. Clue ~ ANSWER // ANS|WER' (or the
   * deprecated 'A1. Clue ~ ANS|WER'), using the 'SplitCharacter' metadata. Each index is the tile before a split.
   */
  splits?: number[]
  /** For splits that occur within rebus squares, maps tile index to array of internal split positions */
  rebusInternalSplits?: Record<number, number[]>
}

export interface Cursor {
  /** What tile is selected */
  position: Position
  /** The direction they are writing */
  direction: CursorDirection
}

export type CursorDirection = "down" | "across"
export type ClueState = "empty" | "partial" | "incorrect" | "correct"
