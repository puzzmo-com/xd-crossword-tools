import { CrosswordJSON, CursorDirection, Position } from "./types"

export type PositionInfo =
  | { type: "noop" }
  | { type: "grid"; position: Position }
  | { type: "clue"; direction: CursorDirection; number: number }

export const editorInfoAtCursor =
  (data: CrosswordJSON) =>
  (line: number, index: number): PositionInfo => {
    if (!data.editorInfo)
      throw new Error("Cannot use editorInfoAtCursor with CrosswordJSON without editorInfo info attached, turn on the third param")
    const noop = { type: "noop" } as const

    const { sections } = data.editorInfo
    const section = sections.find(({ startLine, endLine }) => startLine <= line && endLine >= line)
    if (!section) return noop

    // console.log({ section })

    switch (section.type) {
      case "design":
      case "design-style":
      case "comment":
      case "metapuzzle":
      case "notes":
      case "start":
      case "unknown":
      case "metadata":
        return noop

      case "clues": {
        const content = data.editorInfo.lines[line]
        const trimmed = content.toLowerCase().trim()

        if (!trimmed.startsWith("a") && !trimmed.endsWith("d")) return noop
        if (!trimmed.includes(".") && !trimmed.includes("^")) return noop
        if (trimmed === "") return noop

        const direction = trimmed.startsWith("a") ? "across" : "down"
        const numStr = trimmed.slice(1).split(" ")[0].replace(".", "")
        const number = parseInt(numStr)
        return { type: "clue", direction, number }
      }

      case "grid":
        const lines = data.editorInfo.lines.slice(section.startLine, section.endLine)
        const startLine = lines.findIndex((line) => !line.startsWith("#") && line.trim() !== "")
        const yIndex = line - section.startLine - startLine
        if (yIndex < 0) return noop

        return { type: "grid", position: { col: index, index: yIndex } }
    }
  }
