export * from "xd-crossword-tools-parser"

export { JSONToXD, resolveFullClueAnswer } from "./JSONtoXD"
export { puzToXD } from "./puzToXD"
export { uclickXMLToXD } from "./uclickToXD"
export { editorInfoAtCursor, type PositionInfo } from "./editorInfoAtCursor"
export { JSONToPuzJSON } from "./JSONToPuzJSON"
export { xdDiff } from "./xdDiff"
export { jpzToXD } from "./jpzToXD"
export { encode as puzEncode, decode as puzDecode } from "./vendor/puzjs"
export type { Puz2JSONResult } from "./vendor/puzjs"
export { runLinterForClue } from "./xdLints"
export { amuseToXD } from "./amuseJSONToXD"
export { decodePuzzleMeHTML, decodePuzzleMeRawc, extractPuzzleMeRawc, puzzleMeDataToAmuseTopLevel } from "./puzzleMeDecode"
export { validateClueAnswersMatchGrid } from "./validateClueAnswersMatchGrid"

// Export the package version
import packageJson from "../package.json"
export const version = packageJson.version
