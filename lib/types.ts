import { ParseMode } from "./xdparser2"

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
}

export type EditorInfo = {
  sections: Array<{ startLine: number; endLine: number; type: ParseMode }>
  lines: string[]
}

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

export type Tile = LetterTile | BlankTile | RebusTile

export interface LetterTile {
  letter: string
  type: "letter"
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

interface BlankTile {
  type: "blank"
}

export interface Position {
  col: number
  index: number
}

// Inline elements to handle when rendering clues
export type MDClueComponent =
  | [type: "text", text: string]
  | [type: "italics", text: string]
  | [type: "bold", text: string]
  | [type: "strike", text: string]
  | [type: "link", text: string, to: string]

export interface Clue {
  /** The "clue" as it were */
  body: string
  /** The body as a set of inline markdown components, not a full markdown processor, but a simple enough heuristic */
  bodyMD?: MDClueComponent[]
  /** The number, whether it is across or down is handled back at 'clues' */
  number: number
  /** The string after the "~"" - if the clue has a split character than this will not be included */
  answer: string
  /** Filled in metadata giving the location of the first char on the grid */
  position: Position
  /** If an answer contains a split character, then this would include the indexes  */
  splits?: number[]
  /** Duplicating a clue and using a meta suffix (e.g. "A23~Hint. A shot to the heart" )
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
