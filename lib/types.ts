
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

export type CursorDirection = "down" | "across"
export type ClueState = "empty" | "partial" | "incorrect" | "correct"

export type CrosswordState = {
  /** An implementation detail */
  game: "crossword:state"
  /** API does not need to return this, so could also be considered an implementation detail */
  props: CrosswordProps
  /** The user's current interaction model */
  cursor?: Cursor
  /** Cursors to show for other players */
  additionalCursors?: Array<Cursor & { id: string }>
  /** A sparse array of the right column length for user input.
   * There is always needs to be at least as many arrays as there are columns, so it can safely write to an arbitrary x, y */
  userInput: UserInput[][]

  /** What state is each individual clue in? */
  clueState: {
    across: ClueState[]
    down: ClueState[]
  }

  /** User input which is layered on top of the crossword at x,y */
  ui: UIChanges[]

  /** Should committing a letter be classed as a draft */
  draft?: true

  /** The current game settings */
  settings: {
    /** Do we show incorrect inputs? */
    highlightWrongLetters: "always" | "after-completion" | "never"
    /** How should the inputs be recognized */
    controlScheme: "ours" | "nytimes"
  }

  /** Session state which is never stored */
  session: {
    /** Should we turn on cheats? */
    hasAskedAboutShowingFails?: true
    /** Can you edit the crossword? */
    readonly?: true
    /** Should we be showing the on-screen keyboard? */
    showOnscreenKeyboard?: boolean,
    /** Game completion info */
    gameCompleted?: {
      timerTime?: number
      date: Date
    }
  }
}
