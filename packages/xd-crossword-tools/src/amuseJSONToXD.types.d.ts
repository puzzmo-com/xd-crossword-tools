// These types are based on putting all of the .json files into https://app.quicktype.io
// and then manually cleaning them up over time.
//

export interface AmuseTopLevel {
  data: Data
  meta: Meta
}

export interface Data {
  id: number
  attributes: Attributes
}

export interface Attributes {
  amuse_id: string
  amuse_set: string
  amuse_data: AmuseData
  createdAt: Date
  updatedAt: Date
  unsupported: boolean | null
}

export interface AmuseData {
  h: number
  w: number
  id: string
  box: Array<Array<Letter | null>>
  help: string
  tags: any[]
  title: string
  author: string
  locale: Locale
  srcJPZ: boolean
  checkPDF: boolean
  clueNums: Array<Array<null | string>>
  problems?: any[]
  subtitle: string
  authorURL: string
  cellInfos?: CellInfo[]
  copyright: Copyright
  showRebus: boolean
  endMessage: string
  isImported: boolean
  puzzleType: PuzzleType
  targetTime: number
  authorEmail: string
  bonusPoints: number
  description: string
  placedWords: PlacedWord[]
  publishTime: number
  srcFileName?: string
  allowSharing: boolean
  attributions: string
  checkEnabled: boolean
  creationTime: number
  hideInPicker: boolean
  hintsEnabled: boolean
  modifiedTime: number
  pauseMessage: string
  caseSensitive: boolean
  letterPenalty: number
  preRevealIdxs?: Array<boolean[]>
  revealEnabled: boolean
  hideClueColumns: boolean
  publishTimeZone: PublishTimeZone
  showStartButton: boolean
  correctWordPoints: number
  contestModeEnabled: boolean
  unlinkGridAndClues: boolean
  wordLengthsEnabled: boolean
  mediaPreviewEnabled: boolean
  boxToPlacedWordsIdxs: Array<Array<number[] | null>>
  errorCheckModeEnabled: boolean
  mediaPreviewAndTextEnabled: boolean
  tn_url?: string
  backdropURL?: string
  boxImageURL?: string
  referenceId?: string
  shareImageURL?: string
  wrongSoundURL?: string
  correctSoundURL?: string
  clueSections?: ClueSection[]
  completionSoundURL?: string
}

export enum Letter {
  A = "A",
  AI = "A/I",
  B = "B",
  C = "C",
  CP = "C/P",
  D = "D",
  E = "E",
  F = "F",
  G = "G",
  GN = "G/N",
  H = "H",
  I = "I",
  IE = "I/E",
  J = "J",
  K = "K",
  L = "L",
  M = "M",
  N = "N",
  O = "O",
  P = "P",
  R = "R",
  RS = "R/S",
  S = "S",
  T = "T",
  U = "U",
  V = "V",
  W = "W",
  X = "X",
  Y = "Y",
  Z = "Z",
}

export interface CellInfo {
  x: number
  y: number
  isVoid: boolean
  isCircled: boolean
  rightWall: boolean
  bottomWall: boolean
  displayRightWallShort: boolean
  displayBottomWallShort: boolean
}

export enum ClueSection {
  Across = "Across",
  Down = "Down",
}

export enum Copyright {
  Empty = "",
  The2019 = "© 2019",
}

export enum Locale {
  EnUS = "en-US",
}

export interface PlacedWord {
  x: number
  y: number
  clue: Clue
  word?: string
  nBoxes: number
  clueNum: string
  wordLens?: number[]
  direction?: Letter
  intersects: boolean
  clueSection?: ClueSection
  originalTerm: string
  acrossNotDown: boolean
  linkedWordIdxs?: number[]
  boxesForWord?: BoxesForWord[]
}

export interface BoxesForWord {
  x: number
  y: number
}

export interface Clue {
  clue: string
  fullSentenceLowerCase?: string
  URLs?: string[]
  refText?: string
  problems?: Problem[]
}

export interface Problem {
  lineNum: number
  message: string
  warningNotError: boolean
}

export enum PublishTimeZone {
  EtcUTC = "Etc/UTC",
  UTC = "UTC",
}

export enum PuzzleType {
  Crossword = "CROSSWORD",
}

export interface Meta {}
