export type CrosswordJSON = {
  /** Info to display about the Crossword  */
  meta: {
    title: string
    author: string
    editor: string
    date: string
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

export interface Clue {
  main: string
  second?: string
  number: number
  answer: string
  position: Position
}

export interface Cursor {
  /** What tile is selected */
  position: Position
  /** The direction they are writing */
  direction: CursorDirection
}

export type CursorDirection = "down" | "across"
export type ClueState = "empty" | "partial" | "incorrect" | "correct"
