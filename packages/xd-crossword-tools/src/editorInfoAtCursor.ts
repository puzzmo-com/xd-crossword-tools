import { clueInfosForPosition } from "xd-crossword-tools-parser"
import { Clue, CrosswordJSON, CursorDirection, Position } from "xd-crossword-tools-parser"

export type PositionInfo =
  | { type: "noop" }
  | { type: "grid"; position: Position; clues: { across: Clue | undefined; down: Clue | undefined } }
  | { type: "clue"; direction: CursorDirection; number: number }
  | { type: "metadata"; key: string; value: string }

export const editorInfoAtCursor =
  (data: CrosswordJSON) =>
  (line: number, index: number): PositionInfo => {
    if (!data.editorInfo)
      throw new Error("Cannot use editorInfoAtCursor with CrosswordJSON without editorInfo info attached, turn on the third param")
    const noop = { type: "noop" } as const

    const { sections } = data.editorInfo
    const section = sections.find(({ startLine, endLine }) => startLine <= line && endLine >= line)
    if (!section) return noop

    switch (section.type) {
      case "design":
      case "design-style":
      case "comment":
      case "metapuzzle":
      case "notes":
      case "start":
      case "unknown":
        return noop

      case "metadata": {
        const content = data.editorInfo.lines[line]
        const trimmed = content.trim()

        // Check if it's a metadata line (contains :)
        if (!trimmed.includes(":")) return noop

        const colonIndex = trimmed.indexOf(":")
        const key = trimmed.substring(0, colonIndex).trim()
        const value = trimmed.substring(colonIndex + 1).trim()

        return { type: "metadata", key, value }
      }

      case "clues": {
        const content = data.editorInfo.lines[line]
        const trimmed = content.toLowerCase().trim()

        if (!trimmed.startsWith("a") && !trimmed.startsWith("d")) return noop
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

        let clueIndexes = {} as any
        try {
          clueIndexes = clueInfosForPosition(data.tiles, data.clues, { col: index, index: yIndex })
        } catch (e) {
          // tile not found
        }

        const clues = {
          across: clueIndexes.across && data.clues.across[clueIndexes.across.index],
          down: clueIndexes.down && data.clues.down[clueIndexes.down.index],
        }
        return { type: "grid", position: { col: index, index: yIndex }, clues }
    }
  }
