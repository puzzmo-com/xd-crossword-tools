export type CrosswordProps = {
  game: "crossword:props"
  /** Info to display about the Crossword  */
  meta: {
    title: string
    author: string
    editor: string
    date: string
  }
  /** 2 dimensional array of tile representations */
  tiles: Tile[][]
  /** Derived clue info  */
  clues: {
    across: Clue[]
    down: Clue[]
  }
}

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

export type Tile = LetterTile | BlankTile | RebusTile
export type UserInput = LetterInput | RebusInput

export interface LetterTile {
  letter: string
  type: "letter"
  state: "speculative" | "normal" | "locked"
}

export interface LetterInput extends LetterTile {
  correct: boolean
  revealed?: true
  correctWord?: {
    across: boolean
    down: boolean
  }
}

export interface RebusTile {
  word: string
  symbol: string
  type: "rebus"
  state: "speculative" | "normal" | "locked"
}

export interface RebusInput extends RebusTile {
  correct: boolean
  revealed?: true
  speculative?: true
  correctWord?: {
    across: boolean
    down: boolean
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
