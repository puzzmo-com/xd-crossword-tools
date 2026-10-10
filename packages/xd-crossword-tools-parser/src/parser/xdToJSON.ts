import { getCluePositionsForBoard, PositionWithTiles } from "../utils/clueNumbersFromBoard"
import type { Tile, CrosswordJSON, XDownComponent, ClueAnswer } from "../types"
import { addHeadersToImplicitSections, hasImplicitSections } from "./implicitSections"
import { parseXDown, xdownToPlainText } from "./xdown"
import { designHasBars, parseDesignRules } from "./design"

// These are all the sections supported by this parser, xd v4 defines metadata, grid, clues and design
// - the rest are extensions
const knownHeaders = ["grid", "clues", "notes", "metadata", "metapuzzle", "start", "design"] as const
const mustHave = ["grid", "clues", "metadata"] as const

export type ParseMode = (typeof knownHeaders)[number] | "unknown"

type RawClue = {
  num: number
  question: string
  metadata?: CrosswordJSON["clues"]["across"][number]["metadata"]
  /** The first answer, with split characters (once the '// ANS|WER' annotation has been applied) */
  answer: string
  /** Every answer from the clue line, with split characters once the annotation has been applied */
  answers: string[]
  /** The words after the end-of-line ' // ', the answers written with split characters */
  annotation: string[]
  /** Everything after the first ' ~ ', as written */
  answersText: string
  dir: "A" | "D"
  display: XDownComponent[]
  line: number
}

/**
 * Converts an xd file into a JSON representation, the JSON aims to be
 * a bit of an overkill to ensure that less work is needed inside an app.
 *
 * This parses xd v4, and pre-v4 Puzzmo-flavoured xd is still understood with
 * deprecation warnings in `report.warnings`. Use `migrateXDToV4` to upgrade a file.
 *
 * @param xd the xd string
 * @param strict whether extra exceptions should be thrown with are useful for editor support
 */
export function xdToJSON(xd: string, strict = false, editorInfo = false): CrosswordJSON {
  let seenSections: string[] = []
  let currentUnknownSectionTitle: string | undefined = undefined

  if (xd && hasImplicitSections(xd)) {
    if (editorInfo) throw new Error("xd-crossword-tools: This file is using implicit sections, you can't use an editor with this file")
    xd = addHeadersToImplicitSections(xd)
  }

  let rawInput: {
    tiles: string[][]
    clues: Map<string, RawClue>
  } = {
    tiles: [],
    clues: new Map(),
  }

  // The design section is style rules, then a grid
  const design = {
    headerLine: -1,
    rules: "",
    /** Where the rule text so far ends: inside a `{ ... }`, and inside a quoted value */
    scan: { insideRule: false, quote: undefined as string | undefined },
    grid: [] as string[],
  }

  let lines = xd.split("\n")

  // This object gets filled out by the parser, and is eventually returned
  const json: CrosswordJSON = {
    meta: {
      title: "Not set",
      author: "Not set",
      date: "Not set",
      editor: "Not set",
    },
    metaDisplay: {},
    tiles: [],
    clues: {
      across: [],
      down: [],
    },
    rebuses: {},
    notes: "",
    unknownSections: {},
    report: {
      success: false,
      errors: [],
      warnings: [],
    },
    editorInfo: editorInfo ? { sections: [], lines } : undefined,
  }

  const addSyntaxError = (msg: string, line: number) => {
    json.report.errors.push({
      type: "syntax",
      position: { col: 0, index: line },
      length: -1,
      message: msg,
    })
  }

  const addDeprecation = (msg: string, line: number) => {
    // One warning per kind of problem per line is plenty
    if (json.report.warnings.some((w) => w.message === msg && w.position.index === line)) return
    json.report.warnings.push({
      type: "deprecation",
      position: { col: 0, index: line },
      length: -1,
      message: msg,
    })
  }

  if (!xd) {
    addSyntaxError("xd is an empty file", 0)
    return json
  }

  const seenMetaKeys = new Set<string>()

  let mode: ParseMode = "unknown"
  for (let line = 0; line < lines.length; line++) {
    const content = lines[line]
    const trimmed = content.trim()

    if (content.startsWith("## ")) {
      mode = parseModeForString(content, line)

      // If this is an unknown section, capture the title
      if (mode === "unknown") {
        const sectionTitle = content.split("## ").pop()
        if (sectionTitle) {
          currentUnknownSectionTitle = sectionTitle.trim()
          // Initialize the unknown section with empty content
          const slugifiedTitle = slugify(currentUnknownSectionTitle)
          json.unknownSections[slugifiedTitle] = {
            title: currentUnknownSectionTitle,
            content: "",
          }
        }
      } else {
        currentUnknownSectionTitle = undefined
      }

      if (mode === "design") design.headerLine = line

      // Provide enough info for another tool to not need to parse the file
      if (json.editorInfo) {
        const sections = json.editorInfo.sections
        if (sections.length) sections[sections.length - 1].endLine = line - 1

        json.editorInfo.sections.push({
          startLine: line,
          // Start with it as the last index, then refine when we know it is not
          endLine: lines.length,
          type: mode,
        })
      }

      seenSections.push(mode)
      continue
    }

    if (strict && trimmed.startsWith("## "))
      addSyntaxError("This header has spaces before it, this is likely an accidental indentation", line)

    // Allow for prefix whitespaces, mainly to make the tests more readable but it can't hurt the parser
    if (mode === "unknown") {
      // If we're in an unknown section and have a title, collect the content
      if (currentUnknownSectionTitle) {
        const slugifiedTitle = slugify(currentUnknownSectionTitle)
        if (json.unknownSections[slugifiedTitle]) {
          json.unknownSections[slugifiedTitle].content += content + "\n"
        }
      }
      continue
    }

    switch (mode) {
      // NOOP
      case "notes":
        // Keep the line breaks, but skip any blank lines before the notes start
        json.notes = json.notes ? json.notes + "\n" + content : content
        continue

      // Store it for later parsing once we have rebuses
      case "grid": {
        if (trimmed === "") continue

        // One unicode codepoint per cell
        rawInput.tiles.push([...trimmed])
        continue
      }

      // Same also, because we'll need to do post-processing at the end
      case "clues": {
        if (trimmed === "") continue

        const clue = clueFromLine(trimmed, line, (msg) => addDeprecation(msg, line))
        if ("errorMessage" in clue) {
          json.report.errors.push({
            type: "clue_msg",
            clueType: clue.dir,
            clueNum: clue.num,
            position: { col: 0, index: line },
            length: -1, // lineText.length,
            message: clue.errorMessage,
          })
          continue
        }

        const key = `${clue.dir}${clue.num}`
        const existing = rawInput.clues.get(key)

        if ("answer" in clue) {
          if (existing && strict) {
            const hintVersion = `${clue.dir}${clue.num} ^Hint: ${clue.question}`
            addSyntaxError(`Duplicate clue detected, if this is for a hint, please convert it to: '${hintVersion}'`, line)
          } else if (existing) {
            // Pre-v4 Puzzmo files used a duplicate clue as the hint
            if (!existing.metadata) existing.metadata = {}
            existing.metadata["hint"] = clue.question
            addDeprecation(`A duplicate clue is treated as a hint, use '${clue.dir}${clue.num} ^Hint: ${clue.question}' instead`, line)
          } else {
            // @ts-ignore This is fine, the next type expects this
            if (editorInfo) clue.metadata = { "body:line": line.toString() }
            rawInput.clues.set(key, clue)
          }
        } else {
          if (!existing) {
            addSyntaxError(`Could not find the clue which this hint refers to above in the file`, line)
          } else {
            if (!existing.metadata) existing.metadata = {}
            existing.metadata[clue.metaKey] = clue.metaValue
            if (editorInfo) existing.metadata[clue.metaKey + ":line"] = line.toString()
          }
        }
        continue
      }

      // Trivial key map
      case "metadata": {
        if (trimmed === "") continue
        const colon = trimmed.indexOf(":")
        if (colon === -1) {
          addSyntaxError(`Could not find a ':' separating the meta item's name from its value`, line)
          continue
        }

        // Keys are case-insensitive
        const key = trimmed.slice(0, colon).trim().toLowerCase()
        const value = trimmed.slice(colon + 1).trimStart()
        if (seenMetaKeys.has(key) && strict) addSyntaxError(`The metadata field '${key}' has already been set, a key can only be used once`, line)
        seenMetaKeys.add(key)

        json.meta[key] = value
        json.metaDisplay[key] = parseXDown(value, { onDeprecated: (msg) => addDeprecation(msg, line) })
        if (editorInfo) {
          json.meta[key + ":line"] = line.toString()
        }
        continue
      }

      // This will keep mutating that metapuzzle object as each line comes though,
      // note that it does not have the trimmed and return check, because whitespace
      // could be kinda important here
      case "metapuzzle": {
        json.metapuzzle = updateMetaPuzzleForLine(trimmed, json.metapuzzle)
        continue
      }

      // Create a sparse array of letters to add by default to the crossword
      case "start": {
        if (trimmed === "") continue
        if (!json.start) json.start = []
        const newLine: string[] = []
        ;[...trimmed].forEach((f, i) => {
          if (f === " ") return
          if (f === ".") return
          if (f === "#") return
          newLine[i] = f
        })
        json.start.push(newLine)
        continue
      }

      // Style definitions, then a grid of style characters
      case "design": {
        // Once we have hit the grid, everything else is grid
        if (design.grid.length) {
          if (trimmed) design.grid.push(trimmed)
          continue
        }

        let ruleLine = content
        if (/<\/?style>/.test(ruleLine)) {
          addDeprecation(`xd v4 design sections do not wrap their style definitions in a <style> tag`, line)
          ruleLine = ruleLine.replace(/<\/?style>/g, "")
        }

        // The design grid starts at the first non-blank line after the last rule's closing '}'
        const ruleTrimmed = ruleLine.trim()
        if (!design.scan.insideRule && ruleTrimmed && !ruleTrimmed.includes("{")) {
          design.grid.push(trimmed)
          continue
        }

        design.rules += ruleLine + "\n"
        // Only scan the new line, re-scanning all of the rules each time is slow with large data URIs
        scanDesignRuleText(ruleLine + "\n", design.scan)
        continue
      }
    }
  }

  // Now that we have a mostly fleshed out file parse, do extra work to bring it all together

  if (design.rules.trim() || design.grid.length) {
    const { styles, errors } = parseDesignRules(design.rules)
    errors.forEach((e) => addSyntaxError(e, design.headerLine))
    if (!Object.keys(styles).length) {
      addSyntaxError(`This design section has no style definitions, it should start with rules like 'O { background: circle }'`, design.headerLine)
    }

    json.design = {
      styles,
      // A sparse array of style characters, '.' (and the pre-v4 '#') mark unstyled cells
      positions: design.grid.map((row) => {
        const newLine: string[] = []
        ;[...row].forEach((f, i) => {
          if (!styles[f] && (f === " " || f === "." || f === "#")) return
          newLine[i] = f
        })
        return newLine
      }),
    }
  }

  // v3 xd used lowercase letters in the grid with a 'Special' field for circled or shaded cells,
  // this turns those into a design section
  applyV3SpecialCells(json, rawInput.tiles, (msg) => addDeprecation(msg, getLine(xd.toLowerCase(), "special:") || 0))

  // Every grid row gets a (possibly empty) row of design positions, so 'positions[y][x]' is always safe
  if (json.design) {
    const rows = Math.max(rawInput.tiles.length, json.design.positions.length)
    for (let y = 0; y < rows; y++) if (!json.design.positions[y]) json.design.positions[y] = []
  }

  // We can't reliably set the tiles until we have the rebus info, but we can't guarantee the order
  const { rebuses, schrodingerRebuses } = getRebuses(json.meta.rebus || "")
  json.rebuses = rebuses
  json.tiles = stringGridToTiles(json.rebuses, rawInput.tiles, schrodingerRebuses)

  // The process above will make pretty white-spacey answers.
  if (json.metapuzzle) json.metapuzzle.answer = json.metapuzzle.answer.trim()
  json.notes = json.notes.trimEnd()

  const useBarredLogic = isBarredGrid(json)

  // Validate barred crosswords don't use unsupported features
  if (useBarredLogic) {
    const hasUnsupportedTiles = json.tiles.some((row) => row.some((tile) => tile.type === "rebus" || tile.type === "schrodinger"))

    if (hasUnsupportedTiles) {
      const rebusLine = getLine(xd.toLowerCase(), "rebus:")
      addSyntaxError(
        `Barred crosswords do not support rebuses or Schrödinger squares. Please remove the 'rebus:' metadata and use only letters and blank tiles in your grid.`,
        rebusLine || 0,
      )
      // Skip clue processing since it will fail anyway
      return json
    }

    // Also check if design section is missing
    if (!json.design) {
      const formLine = getLine(xd.toLowerCase(), "form:")
      addSyntaxError(
        `Barred crosswords require a '## Design' section with bar positions. Add a design section with styles defining bar-left and bar-top properties.`,
        formLine || 0,
      )
      // Skip clue processing since we need the design section
      return json
    }
  }

  // Split characters go in an end-of-line annotation: 'A1. Clue ~ OKGO ~ OKAY // OK|GO OK|AY', each word in it
  // is the answer it spells written with splits. Pre-v4 files put them in the answer itself.
  // A file using annotations without declaring a split character gets '|'
  const hasSplitAnnotations = [...rawInput.clues.values()].some((c) => c.annotation.length)
  const splitChar = json.meta.splitcharacter || (hasSplitAnnotations ? "|" : undefined)
  const removeSplits = (answer: string) => (splitChar ? answer.split(splitChar).join("") : answer)

  for (const clue of rawInput.clues.values()) {
    for (const word of clue.annotation) {
      const index = clue.answers.indexOf(removeSplits(word))
      if (index === -1) {
        addSyntaxError(`'${word}' after the '//' does not spell any of the answers (${clue.answers.join(", ")}) once its split characters are removed`, clue.line)
      } else {
        clue.answers[index] = word
      }
    }

    const inAnswer = clue.annotation.length ? [] : clue.answers.filter((a) => splitChar && a.includes(splitChar))
    if (inAnswer.length) {
      const line = `~ ${clue.answers.map(removeSplits).join(" ~ ")} // ${inAnswer.join(" ")}`
      addDeprecation(`Split characters inside the answer are deprecated, use '${line}' instead`, clue.line)
    }
    clue.answer = clue.answers[0]
  }

  // Update the clues with position info and the right metadata
  let positions: PositionWithTiles[] | Record<number, PositionWithTiles>
  try {
    positions = getCluePositionsForBoard(json.tiles, json.meta, rawInput.clues, json)
  } catch (error) {
    // If getCluePositionsForBoard throws an error, add it to the report and return early
    const errorMessage = error instanceof Error ? error.message : String(error)
    addSyntaxError(`Error processing barred crossword: ${errorMessage}`, 0)
    return json
  }

  // For barred grids, create a proper mapping from clue numbers to positions
  let positionsByClueNumber: Record<number, PositionWithTiles> = {}
  if (useBarredLogic && Array.isArray(positions)) {
    // Build a mapping by matching answer strings exactly
    const usedPositions = new Set<number>()

    for (const keyClue of rawInput.clues) {
      const [_, clue] = keyClue
      const dirKey = clue.dir === "A" ? "across" : "down"

      // Find the position that matches this clue's answer exactly
      const matchingPositionIndex = (positions as PositionWithTiles[]).findIndex((p, index) => {
        if (usedPositions.has(index)) return false

        const relevantTiles = dirKey === "across" ? p.tiles.across : p.tiles.down
        if (!relevantTiles) return false

        const posAnswer = relevantTiles
          .map((t) => (t.type === "letter" ? t.letter : ""))
          .join("")
          .toUpperCase()
        return posAnswer === clue.answer.toUpperCase()
      })

      if (matchingPositionIndex !== -1) {
        positionsByClueNumber[clue.num] = (positions as PositionWithTiles[])[matchingPositionIndex]
        usedPositions.add(matchingPositionIndex)
      }
    }
  } else {
    // For normal grids, positions is already indexed by clue number
    positionsByClueNumber = positions as Record<number, PositionWithTiles>
  }

  for (const keyClue of rawInput.clues) {
    const [_, clue] = keyClue

    const dirKey = clue.dir === "A" ? "across" : "down"
    const arr = json.clues[dirKey]
    const bail = (reason: string) => {
      const lineOfClue = getLine(xd, clue.question)
      addSyntaxError(`The clue ${dirKey}${clue.num} is malformed: ${reason}`, lineOfClue || -1)
    }

    const positionData = positionsByClueNumber[clue.num]

    if (!positionData) {
      if (useBarredLogic) {
        bail(
          `Could not find positioning data. In barred crosswords, clue answers must exactly match letter sequences in the grid separated by bars. Check that: (1) your answer "${clue.answer}" appears in the grid, (2) bars correctly separate this word from adjacent letters, and (3) the grid doesn't contain rebuses.`,
        )
      } else {
        bail("Could not find positioning data")
      }
      continue
    }

    const tiles = positionData.tiles[dirKey]
    if (!tiles) {
      bail("Could not find tiles")
      continue
    }


    if (editorInfo && clue.metadata) {
      // The first answer with its split characters (as in 14.x), and everything after the ' ~ ' as written
      clue.metadata["answer:unprocessed"] = clue.answer
      clue.metadata["answers:unprocessed"] = clue.answersText
    }

    // Process hint and revealer metadata through xdown
    const processedMetadata: typeof clue.metadata = clue.metadata ? { ...clue.metadata } : {}
    if (clue.metadata) {
      for (const key of ["hint", "revealer"] as const) {
        if (!clue.metadata[key]) continue
        const display = parseXDown(clue.metadata[key])
        processedMetadata[`${key}:display`] = display
        processedMetadata[`${key}:plain`] = xdownToPlainText(display)
      }
    }

    const hasFields = Object.keys(processedMetadata).length > 0

    // Schrödinger slots can list each valid fill on the clue line, or with '^alt' metadata
    const legacyAlts = Object.entries(clue.metadata || {})
      .filter(([key, value]) => /^alt\d*$/.test(key) && typeof value === "string")
      .map(([_, value]) => value as string)

    const answers: ClueAnswer[] = []
    for (const withSplits of [...clue.answers, ...legacyAlts]) {
      const answer = removeSplits(withSplits)
      if (answers.some((a) => a.answer === answer)) continue
      const { splits, rebusInternalSplits } = parseSplitsFromAnswer(withSplits, splitChar, tiles)
      answers.push({ answer, ...(splits ? { splits } : {}), ...(rebusInternalSplits ? { rebusInternalSplits } : {}) })
    }
    const [primary] = answers

    arr.push({
      body: clue.question,
      answer: primary.answer,
      answers,
      number: clue.num,
      position: positionData.position,
      tiles,
      metadata: hasFields ? processedMetadata : undefined,
      display: clue.display,
      plain: xdownToPlainText(clue.display),
      direction: dirKey,
      ...(primary.splits ? { splits: primary.splits } : {}),
      ...(primary.rebusInternalSplits ? { rebusInternalSplits: primary.rebusInternalSplits } : {}),
    })

    // Fill in the valid values for any Schrödinger squares in this slot from the alternative answers.
    // Rebus-declared squares already know their values, so the v4 answer list only fills '*' squares
    // - the pre-v4 '^alt' metadata could add values to either.
    const newTiles = arr[arr.length - 1].tiles
    addSchrodingerValuesFromAnswers(newTiles, [clue.answer, ...legacyAlts].map(removeSplits), json.rebuses, splitChar, () => true)
    addSchrodingerValuesFromAnswers(newTiles, [clue.answer, ...clue.answers.slice(1)].map(removeSplits), json.rebuses, splitChar, (tile) => !tile.symbol)
  }

  // Checks that all of the essential data has been set in a useful way
  if (strict) {
    const needed = mustHave.filter((needs) => !seenSections.includes(needs))
    if (xd && needed.length) {
      const seen = seenSections.length === 0 ? "no section" : toTitleSentence(seenSections)
      addSyntaxError(`This crossword has missing sections: '${toTitleSentence(needed)}' - saw ${seen}`, lines.length)
    }

    if (json.tiles.length === 0) {
      const lineOfGrid = getLine(xd.toLowerCase(), "## grid")
      if (lineOfGrid === false) {
        true // addSyntaxError(`This crossword has a missing grid section`, lines.length)
      } else addSyntaxError(`This crossword does not have a working grid`, lineOfGrid)
    }
  }

  // Clean up trailing newlines from unknown sections content
  for (const [key, section] of Object.entries(json.unknownSections)) {
    json.unknownSections[key].content = section.content.trim()
  }

  json.report.success = json.report.errors.length === 0
  return json

  function parseModeForString(lineText: string, num: number): ParseMode {
    const content = lineText.split("## ").pop()
    if (!content) {
      addSyntaxError("This header needs a title", num)
      return "unknown"
    }

    const title = content.toLowerCase()
    if (title.startsWith("grid")) {
      return "grid"
    } else if (title.startsWith("clues")) {
      return "clues"
    } else if (title.startsWith("notes")) {
      return "notes"
    } else if (title.startsWith("start")) {
      return "start"
    } else if (title.startsWith("metapuzzle")) {
      return "metapuzzle"
    } else if (title.startsWith("metadata")) {
      return "metadata"
    } else if (title.trim() === "meta") {
      if (!("vitest" in globalThis))
        console.log("xd-crossword-tools: Shimmed '### meta' to '### metadata' - this will be removed in the future")
      return "metadata"
    } else if (title.startsWith("design")) {
      return "design"
    }

    return "unknown"
  }
}

/**
 * A barred grid uses bars instead of blocks to separate its answers. Pre-v4 Puzzmo files
 * declared these with 'form: barred', in v4 the bars in the design section are enough.
 */
export const isBarredGrid = (json: Pick<CrosswordJSON, "meta" | "design">) => json.meta?.form === "barred" || designHasBars(json.design)

/** Moves the design rule scanning state along a chunk of text: is it inside a `{ ... }`, and inside quotes */
function scanDesignRuleText(text: string, state: { insideRule: boolean; quote: string | undefined }) {
  for (const char of text) {
    if (state.quote) {
      if (char === state.quote) state.quote = undefined
    } else if (!state.insideRule) {
      if (char === "{") state.insideRule = true
    } else if (char === "'" || char === '"') {
      state.quote = char
    } else if (char === "}") {
      state.insideRule = false
    }
  }
}

function applyV3SpecialCells(json: CrosswordJSON, grid: string[][], onDeprecated: (msg: string) => void) {
  const special = json.meta.special?.trim().toLowerCase()
  if (special !== "circle" && special !== "shaded") return

  const cells: [number, number][] = []
  grid.forEach((row, y) =>
    row.forEach((char, x) => {
      if (/^[a-z]$/.test(char)) cells.push([y, x])
    }),
  )
  if (!cells.length) return

  onDeprecated(`'Special: ${special}' with lowercase grid letters is xd v3 syntax, xd v4 uses a '## Design' section`)

  if (!json.design) json.design = { styles: {}, positions: [] }
  const styles = json.design.styles
  const preferred = special === "circle" ? "O" : "S"
  const existing = Object.entries(styles).find(([_, rule]) => rule.background === special && Object.keys(rule).length === 1)
  const char =
    existing?.[0] ?? [preferred, ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"].find((c) => !styles[c])!
  styles[char] = { background: special }

  for (const [y, x] of cells) {
    grid[y][x] = grid[y][x].toUpperCase()
    if (!json.design.positions[y]) json.design.positions[y] = []
    if (!json.design.positions[y][x]) json.design.positions[y][x] = char
  }
}

function addSchrodingerValuesFromAnswers(
  tiles: Tile[],
  answers: string[],
  rebuses: Record<string, string>,
  splitChar: string | undefined,
  shouldUpdate: (tile: Extract<Tile, { type: "schrodinger" }>) => boolean,
) {
  if (answers.length < 2) return

  // Process each answer to replace rebus words with their symbols
  const processedAnswers = answers.map((answer) => [...replaceWordWithSymbol(answer, tiles, splitChar || "-")])

  for (let tileIdx = 0; tileIdx < tiles.length; tileIdx++) {
    const tile = tiles[tileIdx]
    if (tile.type !== "schrodinger" || !shouldUpdate(tile)) continue
    if (!tile.validOptions) tile.validOptions = []

    // The answers are ordered [primary, alt, alt2, ...] so pushing in this order
    // keeps validOptions' position-as-variant-index semantics.
    for (const processedAnswer of processedAnswers) {
      if (tileIdx >= processedAnswer.length) continue
      const char = processedAnswer[tileIdx]
      if (rebuses[char]) {
        const exists = tile.validRebuses.some((r) => r.symbol === char && r.letters === rebuses[char])
        if (!exists) tile.validRebuses.push({ letters: rebuses[char], symbol: char })
      } else if (!tile.validLetters.includes(char)) {
        tile.validLetters.push(char)
      }

      const value = rebuses[char] || char
      if (!tile.validOptions.includes(value)) tile.validOptions.push(value)
    }
  }
}

export function replaceWordWithSymbol(word: string, tiles: Tile[], splitChar: string) {
  let newWord = ""

  let tileIdx = 0
  let i = 0
  while (i < word.length && tileIdx < tiles.length) {
    const cur = word[i]

    const tile = tiles[tileIdx]
    const rebusAndNotSplitChar = tile.type === "rebus" && cur !== splitChar

    if (rebusAndNotSplitChar) {
      newWord += tile.symbol
    } else {
      newWord += cur
    }

    if (cur !== splitChar) {
      tileIdx++
    }

    if (rebusAndNotSplitChar) {
      // adding in the number of split characters to `i` as well because those don't count as tile characters
      // and tile.word.length is a length not including splitChars
      const numSplitChars = word
        .slice(i, i + tile.word.length)
        .split("")
        .filter((c) => c === splitChar).length
      i += tile.word.length + numSplitChars
    } else {
      i++
    }
  }

  return newWord
}


/**
 * Given an answer that might contain splits, and a split character, return
 * an array of all the split locations
 *
 * Split location/index starts right after the first letter/character
 * Example:
 *  answerWithSplits: "abc"
 *  The first split index would be between "a" and "b".
 *  The index there would be 0
 *
 * @param answerWithSplits unparsed answer string
 * @param splitCharacter character to split on
 * @returns an array of split locations
 */
function parseSplitsFromAnswer(
  answerWithSplits: string,
  splitCharacter?: string,
  tiles?: Tile[],
): {
  splits?: number[]
  rebusInternalSplits?: Record<number, number[]>
} {
  if (!splitCharacter) return {}

  // Extract split positions from the answer, counting by code points
  const characters = [...answerWithSplits]
  const splitPositions: number[] = []

  let charIndex = 0
  for (let i = 0; i < characters.length; i++) {
    if (characters[i] === splitCharacter) {
      splitPositions.push(charIndex - 1)
    } else {
      charIndex++
    }
  }

  if (splitPositions.length === 0) return {}

  // If no tiles provided, return simple splits (backward compatibility)
  if (!tiles) {
    // Deduplicate and sort in case of repeated split chars
    const dedup = Array.from(new Set(splitPositions)).sort((a, b) => a - b)
    return { splits: dedup }
  }

  // Map code-point character positions to tile positions and internal indices
  let currentCharIndex = 0
  let currentTileIndex = 0
  const charToTileMap = new Map<number, { tileIndex: number; internalIndex: number }>()

  for (const tile of tiles) {
    if (tile.type === "rebus") {
      let internal = 0
      for (const _ch of [...tile.word]) {
        charToTileMap.set(currentCharIndex, { tileIndex: currentTileIndex, internalIndex: internal })
        currentCharIndex++
        internal++
      }
    } else {
      charToTileMap.set(currentCharIndex, { tileIndex: currentTileIndex, internalIndex: 0 })
      currentCharIndex++
    }
    currentTileIndex++
  }

  // Categorize splits: tile boundary vs internal rebus splits
  const tileBoundarySplits: number[] = []
  const rebusInternalSplits: Record<number, number[]> = {}

  for (const splitPos of splitPositions) {
    const mapping = charToTileMap.get(splitPos)
    if (!mapping) continue

    const { tileIndex, internalIndex } = mapping
    const tile = tiles[tileIndex]

    if (tile.type === "rebus") {
      const cpLen = [...tile.word].length
      if (internalIndex < cpLen - 1) {
        // Internal split within a rebus (by code-point index)
        if (!rebusInternalSplits[tileIndex]) rebusInternalSplits[tileIndex] = []
        rebusInternalSplits[tileIndex].push(internalIndex)
        continue
      }
    }
    // Otherwise, a split at a tile boundary
    tileBoundarySplits.push(tileIndex)
  }

  const result: { splits?: number[]; rebusInternalSplits?: Record<number, number[]> } = {}

  if (tileBoundarySplits.length > 0) {
    result.splits = Array.from(new Set(tileBoundarySplits)).sort((a, b) => a - b)
  }

  if (Object.keys(rebusInternalSplits).length > 0) {
    // Dedupe and sort internal splits for each rebus
    for (const tileIndex in rebusInternalSplits) {
      const dedup = Array.from(new Set(rebusInternalSplits[tileIndex]))
      dedup.sort((a, b) => a - b)
      rebusInternalSplits[tileIndex] = dedup
    }
    result.rebusInternalSplits = rebusInternalSplits
  }

  return result
}

function getLine(body: string, substr: string) {
  if (!body) return false
  if (!substr) return false
  const char = typeof substr === "string" ? body.indexOf(substr) : substr
  const subBody = body.substring(0, char)
  if (subBody === "") return false
  const match = subBody.match(/\n/gi)
  if (match) return match.length
  return 1
}

type ClueParserResponse =
  | (Omit<RawClue, "metadata"> & { metadata?: RawClue["metadata"] })
  | { dir: "D" | "A"; num: number; metaKey: string; metaValue: string }
  | { dir: "D" | "A" | undefined; num: number | undefined; errorMessage: string }

/**
 * Returns either a clue, a clue metadata line, or an error. In xd v4:
 *
 *     A1. Big name in bricks? ~ LEGO
 *     A1 ^Refs: A2 D4
 *
 * The reference runs to the first '.', the clue body from there to the first ' ~ ', and
 * then each ' ~ ' separated segment is an answer - of which only the first word counts.
 * The rest of a segment is free-form, and an end-of-line ' // ' annotation carries the answers written with
 * split characters: 'A1. Clue ~ OKGO ~ OKAY // OK|GO OK|AY'
 */
const clueFromLine = (line: string, lineNumber: number, onDeprecated: (msg: string) => void): ClueParserResponse => {
  const ref = line.match(/^([A-Za-z]?)(\d+)/)
  const dir = ref?.[1].toUpperCase() as "A" | "D" | ""
  if (!ref || (dir !== "A" && dir !== "D")) {
    const message =
      ref && dir === ""
        ? `Uniclue clues (a clue number without an A or D) are not supported yet: '${line}'`
        : `This clue doesn't start with A or D: '${line}'`
    return { dir: undefined, num: undefined, errorMessage: message }
  }

  const num = parseInt(ref[2])
  const rest = line.slice(ref[0].length)

  // Clue metadata: `A1 ^Key: value`, the key is case-insensitive
  const meta = rest.match(/^\s+\^([^:]*):(.*)$/)
  if (meta) {
    return { dir, num, metaKey: meta[1].trim().toLowerCase(), metaValue: meta[2].trimStart() }
  }

  const answerSeparator = rest.indexOf(" ~ ")
  if (!rest.startsWith(".") || answerSeparator === -1) {
    const message = `This clue does not match either the '${dir}${num}. [clue] ~ [answer]' for a clue, or '${dir}${num} ^[key]: [value]' for a clue's metadata.`
    return { dir, num, errorMessage: message }
  }

  const question = rest.slice(1, answerSeparator).trim()
  const answersText = rest.slice(answerSeparator + 3).trim()

  // An end-of-line ' // ' annotation comes after all of the answers
  const annotationStart = answersText.indexOf(" // ")
  const answerPart = annotationStart === -1 ? answersText : answersText.slice(0, annotationStart)
  const annotationText = annotationStart === -1 ? "" : answersText.slice(annotationStart + 4).trim()
  if (annotationText.includes(" ~ ") || annotationText.startsWith("~ ")) {
    return { dir, num, errorMessage: `The ' // ' annotation goes at the end of the line, after all of the answers` }
  }

  const answers = answerPart
    .split(" ~ ")
    .map((segment) => segment.trim().split(/\s+/)[0])
    .filter(Boolean)
  const annotation = annotationText ? annotationText.split(/\s+/) : []

  if (!answers.length) {
    return { dir, num, errorMessage: `This clue is missing an answer after the ' ~ '` }
  }

  return {
    dir,
    num,
    question,
    answer: answers[0],
    answers,
    annotation,
    answersText,
    display: parseXDown(question, { onDeprecated }),
    line: lineNumber,
  }
}

export const stringGridToTiles = (
  rebuses: CrosswordJSON["rebuses"],
  strArr: string[][],
  schrodingerRebuses: Record<string, string[]> = {},
): CrosswordJSON["tiles"] => {
  const rebusKeys = Object.keys(rebuses)
  const schrodingerKeys = Object.keys(schrodingerRebuses)
  const tiles: CrosswordJSON["tiles"] = strArr.map((_) => [])
  strArr.forEach((row, rowI) => {
    row.forEach((char) => {
      if (schrodingerKeys.includes(char)) {
        const values = schrodingerRebuses[char]
        const validLetters: string[] = []
        const validRebuses: { letters: string; symbol: string }[] = []
        for (const value of values) {
          if ([...value].length === 1) {
            validLetters.push(value)
          } else {
            validRebuses.push({ letters: value, symbol: char })
          }
        }
        tiles[rowI].push({ type: "schrodinger", validLetters, validRebuses, validOptions: [...values], symbol: char })
      } else if (rebusKeys.includes(char)) {
        tiles[rowI].push({ type: "rebus", symbol: char, word: rebuses[char] })
      } else {
        tiles[rowI].push(letterToTile(char))
      }
    })
  })

  return tiles
}

export const letterToTile = (letter: string): Tile => {
  if (letter === "#") return { type: "blank" }
  if (letter === ".") return { type: "blank" }
  // A spacer, or a square which does not exist
  if (letter === "_") return { type: "blank", spacer: true }
  // Pre-v4 Schrödinger square - will be populated with valid letters later
  if (letter === "*") return { type: "schrodinger", validLetters: [], validRebuses: [], validOptions: [] }
  return { type: "letter", letter }
}

/** Reads 'Rebus: 1=ONE 2=TWO', a key with many values ('1=O 1=A') is a Schrödinger square */
export const getRebuses = (str: string): { rebuses: Record<string, string>; schrodingerRebuses: Record<string, string[]> } => {
  if (!str.includes("=")) return { rebuses: {}, schrodingerRebuses: {} }

  const allValues = new Map<string, string[]>()

  str.split(" ").forEach((substr) => {
    if (!substr.includes("=")) return
    const [start, ...rest] = substr.split("=")
    const value = rest.join("=")
    if (!allValues.has(start)) allValues.set(start, [])
    allValues.get(start)!.push(value)
  })

  const rebuses: Record<string, string> = {}
  const schrodingerRebuses: Record<string, string[]> = {}

  for (const [key, values] of allValues) {
    if (values.length === 1) {
      rebuses[key] = values[0]
    } else {
      schrodingerRebuses[key] = values
    }
  }

  return { rebuses, schrodingerRebuses }
}

const toTitleSentence = (strs: string[]) => {
  if (strs.length === 0) throw new Error("Somehow showing an empty sentence")
  if (strs.length == 1) return strs[0][0].toUpperCase() + strs[0].slice(1)

  const capNeeded = strs.map((h) => h[0].toUpperCase() + h.slice(1))
  return capNeeded.slice(0, -1).join(", ") + " & " + capNeeded[capNeeded.length - 1]
}

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
}

function updateMetaPuzzleForLine(
  input: string,
  metapuzzle: { clue: string; answer: string } | undefined,
): { clue: string; answer: string } {
  if (!metapuzzle) {
    metapuzzle = { clue: "", answer: "" }
  }

  if (input.startsWith(">")) {
    metapuzzle.clue = input.slice(1).trim()
  } else {
    metapuzzle.answer += input.trim() + "\n"
  }

  return metapuzzle
}

