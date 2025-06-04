import { ParseMode } from "./parser/xdparser2"

export type CrosswordJSON = {
  /** Info to display about the Crossword  */
  meta: {
    title: string
    author: string
    editor: string
    date: string
    splitCharacter?: string
  } & Record<string, string>

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
    /** CSS-like selectors */
    styles: Record<string, any>
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
}

export type Report =
  | { type: "syntax"; position: Position; length: number; message: string }
  | {
      type: "clue_msg"
      position: Position
      length: number
      clueNum: number | unknown
      clueType: CursorDirection | unknown
      message: string
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

export interface LetterTile {
  letter: string
  type: "letter"
  clues?: {
    across?: number
    down?: number
  }
}

export interface SchrodingerTile {
  /** Possible letter tiles */
  validLetters: string[]
  /** Possible rebus tiles */
  validRebuses: string[]
  type: "schrodinger"
  clues?: {
    across?: number
    down?: number
  }
}

export interface RebusTile {
  word: string
  symbol: string
  type: "rebus"
  clues?: {
    across?: number
    down?: number
  }
}

export interface BlankTile {
  type: "blank"
}

export interface Position {
  col: number
  index: number
}

// Inline elements to handle when rendering clues
export type ClueComponentMarkup =
  | [type: "text", text: string]
  | [type: "italics", text: string]
  | [type: "bold", text: string]
  | [type: "strike", text: string]
  | [type: "underscore", text: string]
  | [type: "link", text: string, to: string]
  | [type: "img", url: string, alt: string, block: boolean]

export interface Clue {
  /** The "clue" as a raw string, sans markup processing */
  body: string
  /** The body as a set of inline markup components, based on the xd spec, you always want to use this for displaying clues to a user */
  display: ClueComponentMarkup[]
  /** The number, whether it is across or down is handled back at 'clues' */
  number: number
  /** The string after the "~" - if the clue has a split character than this will not be included */
  answer: string
  /** Alternative answers for Schrödinger squares (e.g. ["CONE", "CANE"]) */
  alternativeAnswers?: string[]
  /** Filled in metadata giving the location of the first char on the grid */
  position: Position
  /** Tiles that the clue is composed of */
  tiles: Tile[]
  /** Somewhat redundant, but also useful reference to whether this clue is was created when looking at acrosses or downs */
  direction: CursorDirection
  /** If an answer contains a split character, then this would include the indexes where it was used */
  splits?: number[]
  /** Duplicating a clue and using a meta suffix (e.g. "A23 ^Hint. A shot to the heart" )
   * would add to { "hint": " A shot to the heart" } to the metadata.
   */
  metadata?: Record<string, string>
}

export interface Cursor {
  /** What tile is selected */
  position: Position
  /** The direction they are writing */
  direction: CursorDirection
}

export type CursorDirection = "down" | "across"
export type ClueState = "empty" | "partial" | "incorrect" | "correct"
