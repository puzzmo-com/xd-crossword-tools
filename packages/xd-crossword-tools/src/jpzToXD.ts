import { Clue, CrosswordJSON, Tile } from "xd-crossword-tools-parser"
import { JSONToXD } from "./JSONtoXD"
import parse from "xml-parser"
import { LetterTile } from "xd-crossword-tools-parser"
import { cleanupClueMetadata } from "./cleanupClueMetadata"

/**
 * Takes a jpz xml string and converts it to an xd file.
 */
export function jpzToXD(xmlString: string): string {
  const parsed = parse(xmlString)

  const rectangularPuzzle = parsed.root.children.find((child: { name: string }) => child.name === "rectangular-puzzle")
  if (!rectangularPuzzle) throw new Error("Could not find rectangular-puzzle element in JPZ")

  const metadataEl = rectangularPuzzle.children.find((child: { name: string }) => child.name === "metadata")
  if (!metadataEl) throw new Error("Could not find metadata element in JPZ")

  const crosswordEl = rectangularPuzzle.children.find((child: { name: string }) => child.name === "crossword")
  if (!crosswordEl) throw new Error("Could not find crossword element in JPZ")

  const gridEl = crosswordEl.children.find((child: { name: string }) => child.name === "grid")
  if (!gridEl) throw new Error("Could not find grid element in JPZ")

  const cluesEls = crosswordEl.children.filter((child: { name: string }) => child.name === "clues")
  if (cluesEls.length !== 2) throw new Error("Expected exactly two clues elements in JPZ")

  const title = metadataEl.children.find((c: { name: string }) => c.name === "title")?.content ?? "Untitled"

  // Grabbing metadata from the JPZ file
  const meta: CrosswordJSON["meta"] = {
    title,
    author: metadataEl.children.find((c: { name: string }) => c.name === "creator")?.content ?? "Unknown Author",
    editor: title.includes("edited by") ? title.split("edited by")[1].trim() : "",
    date: metadataEl.children.find((c: { name: string }) => c.name === "created_at")?.content ?? "",
    copyright: metadataEl.children.find((c: { name: string }) => c.name === "copyright")?.content ?? "",
  }

  // Extracting the grid
  const gridWidth = parseInt(gridEl.attributes.width, 10)
  const gridHeight = parseInt(gridEl.attributes.height, 10)
  const tiles: Tile[][] = Array.from({ length: gridHeight }, () => Array(gridWidth).fill({ type: "blank" }))
  const numberPositions: { [num: string]: { row: number; col: number } } = {}

  for (const cell of gridEl.children) {
    if (cell.name !== "cell") continue
    const x = parseInt(cell.attributes.x, 10) - 1 // 1-based to 0-based
    const y = parseInt(cell.attributes.y, 10) - 1 // 1-based to 0-based

    if (cell.attributes.type === "block") {
      tiles[y][x] = { type: "blank" }
    } else {
      // Check if there are any definitions for bars
      const barAttributes = ["left-bar", "right-bar", "top-bar", "bottom-bar"]
      if (barAttributes.some((attr) => cell.attributes[attr] === "true")) meta.form = "barred"

      const tile: LetterTile = {
        type: "letter",
        letter: cell.attributes.solution ?? "?", // Use '?' if solution missing
      }

      if (cell.attributes.number) {
        numberPositions[cell.attributes.number] = { row: y, col: x }
      }

      // TODO: Rebuses
      tiles[y][x] = tile
    }
  }

  // Extract word definitions to get answers
  const wordEls = crosswordEl.children.filter((child: { name: string }) => child.name === "word")
  const wordAnswers: { [wordId: string]: string } = {}

  for (const wordEl of wordEls) {
    const wordID = wordEl.attributes.id
    const cellsEls = wordEl.children.filter((child: { name: string }) => child.name === "cells")
    let answer = ""

    for (const cellEl of cellsEls) {
      const x = parseInt(cellEl.attributes.x, 10) - 1
      const y = parseInt(cellEl.attributes.y, 10) - 1
      const tile = tiles[y][x]
      if (tile.type === "letter") {
        answer += tile.letter
      }
    }

    wordAnswers[wordID] = answer
  }

  // Grabbing the clues
  const clues: CrosswordJSON["clues"] = { across: [], down: [] }

  for (const cluesEl of cluesEls) {
    const titleEl = cluesEl.children.find((c: { name: string }) => c.name === "title")
    const direction = (titleEl?.children?.length || 0) > 0 ? titleEl?.children[0]?.content?.toLowerCase() : titleEl?.content?.toLowerCase()

    if (!direction || (direction !== "across" && direction !== "down")) continue

    for (const clueEl of cluesEl.children) {
      if (clueEl.name !== "clue") continue

      const num = clueEl.attributes.number
      let text = ""

      // Sometimes, the clue text is wrapped in a span element
      if (clueEl.children.length > 0) {
        const textEl = clueEl.children.find((c: { name: string }) => c.name === "span")
        text = textEl?.content ?? ""
      } else {
        // Sometimes its not
        text = clueEl.content ?? ""
      }
      const pos = numberPositions[num]
      if (!pos) {
        console.warn(`Could not find position for clue number ${num}`)
        continue
      }

      const wordID = clueEl.attributes.word
      const answer = wordAnswers[wordID] || ""

      // Skip clues without valid answers
      if (!answer || answer.length === 0) {
        console.warn(`Skipping clue ${num} with empty answer`)
        continue
      }

      const clue: Clue = {
        number: parseInt(num, 10),
        body: text,
        position: { col: pos.col, index: pos.row },
        answer: answer,
        direction: direction.toUpperCase() as "across" | "down",
        display: [],
        tiles: [],
      }
      clues[direction].push(clue)
    }
  }

  // Sort clues by number
  clues.across.sort((a, b) => a.number - b.number)
  clues.down.sort((a, b) => a.number - b.number)

  const crosswordJSON: CrosswordJSON = {
    meta,
    tiles,
    clues,
    notes: "",
    rebuses: {},
    unknownSections: {},
    report: { success: true, errors: [], warnings: [] },
  }

  cleanupClueMetadata(crosswordJSON)

  // For now, log the bars we found
  return JSONToXD(crosswordJSON)
}
