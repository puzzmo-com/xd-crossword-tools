import { Clue, CrosswordJSON, Tile } from "xd-crossword-tools-parser"
import { JSONToXD } from "./JSONtoXD"
import { XMLParser } from "fast-xml-parser"
import { LetterTile } from "xd-crossword-tools-parser"

// -- fast-xml-parser preserveOrder helpers --
// With preserveOrder: true, each node is an object like:
//   { tagName: [...children], ":@": { attr1: "val", ... } }
// Text nodes are: { "#text": "some text" }

type FxpNode = { [key: string]: any }

/** Get the tag name of a node (first key that isn't ":@" or "#text") */
function nodeName(node: FxpNode): string | undefined {
  return Object.keys(node).find((k) => k !== ":@" && k !== "#text")
}

/** Get the children array of a node */
function nodeChildren(node: FxpNode): FxpNode[] {
  const name = nodeName(node)
  return name ? node[name] : []
}

/** Get an attribute value from a node */
function attr(node: FxpNode, key: string): string | undefined {
  return node[":@"]?.[key]
}

/** Find first child element with the given tag name */
function findChild(nodes: FxpNode[], name: string): FxpNode | undefined {
  return nodes.find((n) => nodeName(n) === name)
}

/** Filter child elements by tag name */
function filterChildren(nodes: FxpNode[], name: string): FxpNode[] {
  return nodes.filter((n) => nodeName(n) === name)
}

/** Get plain text content from a node's children, stripping all tags */
function textContent(nodes: FxpNode[]): string {
  let result = ""
  for (const n of nodes) {
    if ("#text" in n) {
      result += n["#text"]
    } else {
      result += textContent(nodeChildren(n))
    }
  }
  return result
}

/**
 * Converts a fast-xml-parser preserveOrder node tree into xd markup.
 * Handles <i>/<em>, <b>/<strong>, <u>, <s>/<strike>/<del>, <a href>, and <img>.
 * Strips an optional wrapping <span> and any unknown tags (keeping their text).
 */
function convertNodesToXDMarkup(nodes: FxpNode[]): string {
  // Unwrap a single outer <span> wrapper
  if (nodes.length === 1 && nodeName(nodes[0]) === "span") {
    nodes = nodeChildren(nodes[0])
  }

  const tagMap: { [tag: string]: { open: string; close: string } } = {
    i: { open: "{/", close: "/}" },
    em: { open: "{/", close: "/}" },
    b: { open: "{*", close: "*}" },
    strong: { open: "{*", close: "*}" },
    u: { open: "{_", close: "_}" },
    s: { open: "{-", close: "-}" },
    strike: { open: "{-", close: "-}" },
    del: { open: "{-", close: "-}" },
    sub: { open: "{~", close: "~}" },
    sup: { open: "{^", close: "^}" },
  }

  let result = ""
  for (const node of nodes) {
    if ("#text" in node) {
      result += node["#text"]
      continue
    }

    const tag = nodeName(node)
    if (!tag) continue
    const children = nodeChildren(node)

    if (tag === "img") {
      const src = attr(node, "src") ?? ""
      const alt = attr(node, "alt") ?? ""
      result += alt ? `{![${src}|${alt}]!}` : `{![${src}]!}`
    } else if (tag === "a") {
      const href = attr(node, "href") ?? ""
      const text = convertNodesToXDMarkup(children)
      result += `{@${text}|${href}@}`
    } else if (tag in tagMap) {
      const { open, close } = tagMap[tag]
      result += `${open}${convertNodesToXDMarkup(children)}${close}`
    } else {
      // Unknown tag — recurse into children, keeping text
      result += convertNodesToXDMarkup(children)
    }
  }

  return result
}

const fxpParser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: "",
  processEntities: false,
  trimValues: false,
})

/**
 * Takes a jpz xml string and converts it to an xd file.
 */
export function jpzToXD(xmlString: string): string {
  const parsed: FxpNode[] = fxpParser.parse(xmlString)

  // The root is typically <crossword-compiler-applet>
  const root = parsed.find((n) => nodeName(n) !== undefined && nodeName(n) !== "?xml")
  if (!root) throw new Error("Could not find root element in JPZ")

  const rootChildren = nodeChildren(root)
  const rectangularPuzzle = findChild(rootChildren, "rectangular-puzzle")
  if (!rectangularPuzzle) throw new Error("Could not find rectangular-puzzle element in JPZ")

  const rpChildren = nodeChildren(rectangularPuzzle)
  const metadataEl = findChild(rpChildren, "metadata")
  if (!metadataEl) throw new Error("Could not find metadata element in JPZ")

  const crosswordEl = findChild(rpChildren, "crossword")
  if (!crosswordEl) throw new Error("Could not find crossword element in JPZ")

  const cwChildren = nodeChildren(crosswordEl)
  const gridEl = findChild(cwChildren, "grid")
  if (!gridEl) throw new Error("Could not find grid element in JPZ")

  const cluesEls = filterChildren(cwChildren, "clues")
  if (cluesEls.length !== 2) throw new Error("Expected exactly two clues elements in JPZ")

  const metaChildren = nodeChildren(metadataEl)
  const titleEl = findChild(metaChildren, "title")
  const title = titleEl ? textContent(nodeChildren(titleEl)).trim() : "Untitled"

  // Grabbing metadata from the JPZ file
  const meta: CrosswordJSON["meta"] = {
    title,
    author: (() => {
      const el = findChild(metaChildren, "creator")
      return el ? textContent(nodeChildren(el)).trim() : "Unknown Author"
    })(),
    editor: title.includes("edited by") ? title.split("edited by")[1].trim() : "",
    date: (() => {
      const el = findChild(metaChildren, "created_at")
      return el ? textContent(nodeChildren(el)).trim() : ""
    })(),
    copyright: (() => {
      const el = findChild(metaChildren, "copyright")
      return el ? textContent(nodeChildren(el)).trim() : ""
    })(),
  }

  // Extracting the grid
  const gridWidth = parseInt(attr(gridEl, "width")!, 10)
  const gridHeight = parseInt(attr(gridEl, "height")!, 10)
  const tiles: Tile[][] = Array.from({ length: gridHeight }, () => Array(gridWidth).fill({ type: "blank" }))
  const numberPositions: { [num: string]: { row: number; col: number } } = {}

  // Track cells with bars and their combinations
  const cellBars: { [key: string]: { left?: boolean; top?: boolean } } = {}
  let hasAnyBars = false

  const gridChildren = nodeChildren(gridEl)
  for (const cell of filterChildren(gridChildren, "cell")) {
    const x = parseInt(attr(cell, "x")!, 10) - 1 // 1-based to 0-based
    const y = parseInt(attr(cell, "y")!, 10) - 1 // 1-based to 0-based

    if (attr(cell, "type") === "block") {
      tiles[y][x] = { type: "blank" }
    } else {
      // Check if there are any definitions for bars
      const barAttributes = ["left-bar", "right-bar", "top-bar", "bottom-bar"]
      if (barAttributes.some((a) => attr(cell, a) === "true")) meta.form = "barred"

      const tile: LetterTile = {
        type: "letter",
        letter: attr(cell, "solution") ?? "?", // Use '?' if solution missing
      }

      const num = attr(cell, "number")
      if (num) {
        numberPositions[num] = { row: y, col: x }
      }

      // Collect bar information for this cell
      const bars: { left?: boolean; top?: boolean } = {}
      if (attr(cell, "left-bar") === "true") {
        bars.left = true
        hasAnyBars = true
      }
      if (attr(cell, "top-bar") === "true") {
        bars.top = true
        hasAnyBars = true
      }

      // Note: right-bar and bottom-bar are converted to left-bar and top-bar on adjacent cells
      // For the XD format, we need to store them on the adjacent cells
      if (attr(cell, "right-bar") === "true" && x < gridWidth - 1) {
        const key = `${y},${x + 1}`
        if (!cellBars[key]) cellBars[key] = {}
        cellBars[key].left = true
        hasAnyBars = true
      }
      if (attr(cell, "bottom-bar") === "true" && y < gridHeight - 1) {
        const key = `${y + 1},${x}`
        if (!cellBars[key]) cellBars[key] = {}
        cellBars[key].top = true
        hasAnyBars = true
      }

      if (bars.left || bars.top) {
        const key = `${y},${x}`
        if (!cellBars[key]) cellBars[key] = {}
        if (bars.left) cellBars[key].left = true
        if (bars.top) cellBars[key].top = true
      }

      // TODO: Rebuses
      tiles[y][x] = tile
    }
  }

  // Extract word definitions to get answers
  const wordEls = filterChildren(cwChildren, "word")
  const wordAnswers: { [wordId: string]: string } = {}

  for (const wordEl of wordEls) {
    const wordID = attr(wordEl, "id")!
    const cellsEls = filterChildren(nodeChildren(wordEl), "cells")
    let answer = ""

    for (const cellEl of cellsEls) {
      const x = parseInt(attr(cellEl, "x")!, 10) - 1
      const y = parseInt(attr(cellEl, "y")!, 10) - 1
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
    const cluesChildren = nodeChildren(cluesEl)
    const titleNode = findChild(cluesChildren, "title")
    const titleChildren = titleNode ? nodeChildren(titleNode) : []
    const direction = textContent(titleChildren).toLowerCase().trim()

    if (!direction || (direction !== "across" && direction !== "down")) continue

    for (const clueEl of filterChildren(cluesChildren, "clue")) {
      const num = attr(clueEl, "number")!
      const wordID = attr(clueEl, "word")!
      const clueChildren = nodeChildren(clueEl)

      // Convert the clue's child nodes (which may contain mixed content
      // like <i>, <b>, etc.) directly to xd markup
      const text = convertNodesToXDMarkup(clueChildren).trim()

      const pos = numberPositions[num]
      if (!pos) {
        console.warn(`Could not find position for clue number ${num}`)
        continue
      }

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
        plain: "",
        tiles: [],
      }
      clues[direction].push(clue)
    }
  }

  // Sort clues by number
  clues.across.sort((a, b) => a.number - b.number)
  clues.down.sort((a, b) => a.number - b.number)

  // Create Design section if there are bars
  let design = undefined
  if (hasAnyBars) {
    // Create unique style combinations
    const styleMap = new Map<string, string>()
    const positions: string[][] = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(""))

    // Generate style letters starting from 'A'
    let styleLetterCode = 65 // ASCII for 'A'

    for (const [cellKey, bars] of Object.entries(cellBars)) {
      const [y, x] = cellKey.split(",").map(Number)

      // Create a unique key for this bar combination
      const barKey = `${bars.left ? "L" : ""}${bars.top ? "T" : ""}`

      if (barKey && !styleMap.has(barKey)) {
        const styleLetter = String.fromCharCode(styleLetterCode++)
        const barStyles: string[] = []

        if (bars.left) barStyles.push("bar-left: true")
        if (bars.top) barStyles.push("bar-top: true")

        styleMap.set(barKey, styleLetter)
      }

      if (barKey) {
        positions[y][x] = styleMap.get(barKey) || ""
      }
    }

    // Convert styleMap to the format expected by the Design section
    const styles: { [key: string]: { [prop: string]: string } } = {}
    for (const [barKey, letter] of styleMap) {
      const styleObj: { [prop: string]: string } = {}
      if (barKey.includes("L")) styleObj["bar-left"] = "true"
      if (barKey.includes("T")) styleObj["bar-top"] = "true"
      styles[letter] = styleObj
    }

    design = {
      styles,
      positions,
    }
  }

  const crosswordJSON: CrosswordJSON = {
    meta,
    tiles,
    clues,
    notes: "",
    rebuses: {},
    unknownSections: {},
    report: { success: true, errors: [], warnings: [] },
    ...(design && { design }),
  }

  // For now, log the bars we found
  return JSONToXD(crosswordJSON)
}
