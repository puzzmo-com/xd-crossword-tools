import { getCluePositionsForBoard, PositionWithTiles } from "../utils/clueNumbersFromBoard"
import type { Tile, CrosswordJSON, XDownComponent, ClueAnswer, SchrodingerTile, TileDesignFlags } from "../types"
import { addHeadersToImplicitSections, hasImplicitSections } from "./implicitSections"
import { parseXDown, xdownToPlainText } from "./xdown"
import { parseDesignRules } from "./design"
import { parseRebusField } from "./rebus"
import { UNFILLED_CELL } from "../utils/unfilledCells"

// These are all the sections supported by this parser, xd v4 defines metadata, grid, bars, clues, design and
// notes - the rest are extensions
const knownHeaders = ["grid", "clues", "notes", "metadata", "metapuzzle", "start", "design", "bars"] as const
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
  /** Which of `answers` came from the annotation, and so have split characters */
  annotated?: Set<number>
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
 * This parses xd v4: https://github.com/century-arcade/xdformat/blob/master/doc/xd-format-v4.md
 *
 * Pre-v4 syntax (xd v3, and Puzzmo's xd from before v4) is read by the v4 rules, so it won't mean what it used to,
 * and it adds a `deprecation` warning to `report.warnings`. `migrateXDToV4` from xd-crossword-migrator upgrades a file.
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
    /** The line each grid row came from */
    tileLines: number[]
    /** In file order, a slot can have more than one clue */
    clues: RawClue[]
    /** The '## Bars' section, and the lines its rows came from */
    bars?: { headerLine: number; rows: string[][]; lines: number[] }
  } = {
    tiles: [],
    tileLines: [],
    clues: [],
  }

  // Where each Start row came from, to point warnings at the cell once the grid is known
  const startRows: { line: number; content: string; hasSplitEmoji: boolean }[] = []

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

  const addSplitEmojiErrors = (content: string, line: number, section: "Grid" | "Start") => {
    const found = multiCodePointEmoji(content)
    for (const { emoji, col } of found) {
      json.report.errors.push({
        type: "syntax",
        position: { col, index: line },
        length: emoji.length,
        message: `'${emoji}' is made of more than one character, so the ${section} would split it across cells. Declare it as a rebus instead, e.g. 'rebus: 1=${emoji}', and use '1' in the Grid and Start`,
      })
    }
    return found.length
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
      if (mode === "bars") rawInput.bars = { headerLine: line, rows: [], lines: [] }

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
        rawInput.tileLines.push(line)
        if (strict) addSplitEmojiErrors(content, line, "Grid")
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

        if ("answer" in clue) {
          // A slot can have more than one clue, each is its own line: 'D1. Took a chair ~ SAT' and 'D1. Had dinner ~ EAT'
          // @ts-ignore This is fine, the next type expects this
          if (editorInfo) clue.metadata = { "body:line": line.toString() }
          rawInput.clues.push(clue)
        } else {
          // Clue metadata belongs to the closest clue above it with the same reference
          const existing = [...rawInput.clues].reverse().find((c) => c.dir === clue.dir && c.num === clue.num)
          if (!existing) {
            addSyntaxError(`Could not find the clue which this hint refers to above in the file`, line)
          } else {
            if (!existing.metadata) existing.metadata = {}
            existing.metadata[clue.metaKey] = clue.metaValue
            if (editorInfo) existing.metadata[clue.metaKey + ":line"] = line.toString()
            if (/^alt\d*$/.test(clue.metaKey)) {
              addDeprecation(`'^${clue.metaKey}' answers are from pre-v4 Puzzmo xd, xd v4 lists every answer on the clue line: '${clue.dir}${clue.num}. ... ~ ${existing.answer} ~ ${clue.metaValue}'. xd-crossword-migrator can convert this file.`, line)
            }
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
        const hasSplitEmoji = strict && addSplitEmojiErrors(content, line, "Start") > 0
        startRows.push({ line, content, hasSplitEmoji })
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

      // A grid of '.', '|' (a bar on the cell's left edge), '-' (on its top edge) and '+' (both)
      case "bars": {
        if (trimmed === "") continue
        rawInput.bars!.rows.push([...trimmed])
        rawInput.bars!.lines.push(line)
        continue
      }

      // Style definitions, then a grid of style characters
      case "design": {
        // Once we have hit the grid, everything else is grid
        if (design.grid.length) {
          if (trimmed) design.grid.push(trimmed)
          continue
        }

        const ruleLine = content
        if (/<\/?style>/.test(ruleLine)) {
          addDeprecation(`'<style>' is from pre-v4 Puzzmo xd, xd v4 design sections don't wrap their style rules in a <style> tag. xd-crossword-migrator can convert this file.`, line)
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
      // A sparse array of style characters, '.' and '#' (which echoes a black square) are unstyled cells
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

  // v3 xd used lowercase letters in the grid with a 'Special' field for circled or shaded cells
  const special = json.meta.special?.trim().toLowerCase()
  if ((special === "circle" || special === "shaded") && rawInput.tiles.some((row) => row.some((c) => /^[a-z]$/.test(c)))) {
    addDeprecation(
      `'Special: ${special}' with lowercase grid letters is xd v3 syntax, xd v4 reads those as lowercase letters and puts circles and shading in a '## Design' section. xd-crossword-migrator can convert this file.`,
      getLine(xd.toLowerCase(), "special:") || 0,
    )
  }

  // Every grid row gets a (possibly empty) row of design positions, so 'positions[y][x]' is always safe
  if (json.design) {
    const rows = Math.max(rawInput.tiles.length, json.design.positions.length)
    for (let y = 0; y < rows; y++) if (!json.design.positions[y]) json.design.positions[y] = []
  }

  // We can't reliably set the tiles until we have the rebus info, but we can't guarantee the order
  const { rebuses, schrodingerRebuses, linked, errors: rebusErrors, deprecations: rebusDeprecations } = getRebuses(json.meta.rebus || "")
  json.rebuses = rebuses

  const rebusLine = getLine(xd.toLowerCase(), "rebus:") || 0
  rebusErrors.forEach((msg) => addSyntaxError(msg, rebusLine))
  rebusDeprecations.forEach((msg) => addDeprecation(msg, rebusLine))

  // '?' is an unfilled cell in v4, so it can't be a rebus key
  if (UNFILLED_CELL in rebuses || UNFILLED_CELL in schrodingerRebuses) {
    addDeprecation(`'?' is an unfilled cell in xd v4, so it can't be a rebus key. xd-crossword-migrator can move the key to another character.`, rebusLine)
    delete rebuses[UNFILLED_CELL]
    delete schrodingerRebuses[UNFILLED_CELL]
  }
  json.tiles = stringGridToTiles(json.rebuses, rawInput.tiles, schrodingerRebuses, linked)

  // Pre-v4 Puzzmo files marked a Schrödinger square with '*', in v4 it is a character like any other
  const starRow = rawInput.tiles.findIndex((row) => row.includes("*"))
  if (starRow !== -1 && !("*" in rebuses) && !("*" in schrodingerRebuses)) {
    addDeprecation(
      `'*' is a pre-v4 Puzzmo Schrödinger square, xd v4 gives the square a rebus key with its options instead: 'Rebus: 1=O|A'. xd-crossword-migrator can convert this file.`,
      rawInput.tileLines[starRow],
    )
  }

  applyBars()

  // A Start cell should hold what the solution has there. Rows with a split emoji already have an error
  if (strict && json.start) {
    json.start.forEach((row, y) => {
      const { line, content, hasSplitEmoji } = startRows[y]
      if (hasSplitEmoji) return

      row.forEach((value, x) => {
        const message = startMismatch(value, json.tiles[y]?.[x])
        if (!message) return

        const leadingSpace = content.length - content.trimStart().length
        const col = leadingSpace + [...content.trim()].slice(0, x).join("").length
        json.report.warnings.push({ type: "syntax", position: { col, index: line }, length: value.length, message })
      })
    })
  }

  // The process above will make pretty white-spacey answers.
  if (json.metapuzzle) json.metapuzzle.answer = json.metapuzzle.answer.trim()
  json.notes = json.notes.trimEnd()

  // Pre-v4 Puzzmo barred grids said so with 'form: barred', and put their bars in the design section
  if (json.meta.form?.trim().toLowerCase() === "barred" && !rawInput.bars) {
    addDeprecation(`'form: barred' is from pre-v4 Puzzmo xd, xd v4 puts the bars of a barred grid in a '## Bars' section. xd-crossword-migrator can convert this file.`, getLine(xd.toLowerCase(), "form:") || 0)
  }
  const barStyles = Object.entries(json.design?.styles || {}).filter(([_, rule]) => "bar-top" in rule || "bar-left" in rule)
  if (barStyles.length) {
    addDeprecation(
      `'bar-top' and 'bar-left' are from pre-v4 Puzzmo xd, xd v4 puts the bars which end entries in a '## Bars' section (the design's 'border-top' and 'border-left' are only drawn). xd-crossword-migrator can convert this file.`,
      design.headerLine,
    )
  }

  // Split characters go in an end-of-line annotation: 'A1. Clue ~ OKGO ~ OKAY // OK|GO OK|AY', each word in it
  // is the answer it spells written with splits. Pre-v4 files put them in the answer itself.
  // A file using annotations without declaring a split character gets '|'
  const hasSplitAnnotations = rawInput.clues.some((c) => c.annotation.length)
  const splitChar = json.meta.splitcharacter || (hasSplitAnnotations ? "|" : undefined)
  const removeSplits = (answer: string) => (splitChar ? answer.split(splitChar).join("") : answer)

  for (const clue of rawInput.clues) {
    clue.annotated = new Set()
    for (const word of clue.annotation) {
      const index = clue.answers.indexOf(removeSplits(word))
      if (index === -1) {
        addSyntaxError(`'${word}' after the '//' does not spell any of the answers (${clue.answers.join(", ")}) once its split characters are removed`, clue.line)
      } else {
        clue.answers[index] = word
        clue.annotated.add(index)
      }
    }

    // Pre-v4 answers held their split characters, in v4 those are part of the answer
    const inAnswer = clue.annotation.length ? [] : clue.answers.filter((a) => splitChar && a.includes(splitChar))
    if (inAnswer.length) {
      const line = `~ ${clue.answers.map(removeSplits).join(" ~ ")} // ${inAnswer.join(" ")}`
      addDeprecation(`Split characters inside an answer are pre-v4 Puzzmo xd, in xd v4 they go in an annotation at the end of the line: '${line}'. xd-crossword-migrator can convert this file.`, clue.line)
    }
    clue.answer = clue.answers[0]
  }

  // Update the clues with position info and the right metadata, indexed by clue number
  const positionsByClueNumber: PositionWithTiles[] = getCluePositionsForBoard(json.tiles)

  for (const clue of rawInput.clues) {
    const dirKey = clue.dir === "A" ? "across" : "down"
    const arr = json.clues[dirKey]
    const bail = (reason: string) => {
      const lineOfClue = getLine(xd, clue.question)
      addSyntaxError(`The clue ${dirKey}${clue.num} is malformed: ${reason}`, lineOfClue || -1)
    }

    const positionData = positionsByClueNumber[clue.num]
    if (!positionData) {
      bail("Could not find positioning data")
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

    // A Schrödinger slot lists each of its fills on the clue line. Only an answer from the annotation has splits
    const answers: ClueAnswer[] = []
    clue.answers.forEach((written, i) => {
      const annotated = clue.annotated?.has(i)
      const answer = annotated ? removeSplits(written) : written
      if (answers.some((a) => a.answer === answer)) return
      const { splits, rebusInternalSplits } = annotated ? parseSplitsFromAnswer(written, splitChar, tiles) : {}
      answers.push({ answer, ...(splits ? { splits } : {}), ...(rebusInternalSplits ? { rebusInternalSplits } : {}) })
    })
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

  /** Puts the '## Bars' section's bars on the tiles, as 'bar-left' and 'bar-top' */
  function applyBars() {
    if (!rawInput.bars) return
    const { rows, lines: barLines, headerLine } = rawInput.bars
    rows.forEach((row, y) => {
      const unknown = row.find((c) => !"|-+.#".includes(c))
      if (unknown) addSyntaxError(`'${unknown}' isn't a bar, a Bars section uses '.' for none, '|' for the left edge, '-' for the top edge and '+' for both`, barLines[y])

      row.forEach((char, x) => {
        const tile = json.tiles[y]?.[x]
        if (!tile || tile.type === "blank") return
        const flags: TileDesignFlags[] = char === "|" ? ["bar-left"] : char === "-" ? ["bar-top"] : char === "+" ? ["bar-left", "bar-top"] : []
        if (!flags.length) return
        tile.design = [...new Set([...(tile.design || []), ...flags])]
      })
    })

    const sameShape = rows.length === json.tiles.length && rows.every((row, y) => row.length === json.tiles[y].length)
    if (!sameShape) addSyntaxError(`The Bars section should be the same size as the grid, with a character for every cell`, headerLine)
  }

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
      addDeprecation(`'## Meta' is from pre-v4 Puzzmo xd, xd v4 calls this section '## Metadata'. xd-crossword-migrator can convert this file.`, num)
      return "unknown"
    } else if (title.startsWith("design")) {
      return "design"
    } else if (title.startsWith("bars")) {
      return "bars"
    }

    return "unknown"
  }
}

/** A barred grid uses bars (from its '## Bars' section) to end its entries, instead of, or as well as, blocks */
export const isBarredGrid = (json: Pick<CrosswordJSON, "tiles">) => json.tiles.some((row) => row.some((tile) => tile.type !== "blank" && !!tile.design?.length))

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
 * How many characters of an answer a tile takes up: one for a letter, the whole word for a rebus,
 * and for a Schrödinger square whichever of its values the answer spells here. Answers which use
 * the square's symbol instead of spelling a value out take up a single character.
 */
const lengthOfTileInAnswer = (tile: Tile, restOfAnswer: string) => {
  if (tile.type === "rebus") return [...tile.word].length
  if (tile.type !== "schrodinger") return 1

  const values = tile.validOptions?.length ? tile.validOptions : [...tile.validRebuses.map((r) => r.letters), ...tile.validLetters]
  // An empty value ('()') always matches, so it is only picked when nothing else does
  const spelled = values.filter((value) => restOfAnswer.startsWith(value)).sort((a, b) => [...b].length - [...a].length)[0]
  return spelled !== undefined ? [...spelled].length : 1
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
  const answer = characters.filter((char) => char !== splitCharacter).join("")
  let currentCharIndex = 0
  const charToTileMap = new Map<number, { tileIndex: number; internalIndex: number }>()
  const tileLengths: number[] = []

  for (let tileIndex = 0; tileIndex < tiles.length; tileIndex++) {
    const length = lengthOfTileInAnswer(tiles[tileIndex], answer.slice(currentCharIndex))
    tileLengths.push(length)
    for (let internalIndex = 0; internalIndex < length; internalIndex++) {
      charToTileMap.set(currentCharIndex, { tileIndex, internalIndex })
      currentCharIndex++
    }
  }

  // Categorize splits: tile boundary vs internal rebus splits
  const tileBoundarySplits: number[] = []
  const rebusInternalSplits: Record<number, number[]> = {}

  for (const splitPos of splitPositions) {
    const mapping = charToTileMap.get(splitPos)
    if (!mapping) continue

    const { tileIndex, internalIndex } = mapping
    if (internalIndex < tileLengths[tileIndex] - 1) {
      // A split inside a multi-letter square, e.g. 'NICE|ONE' where [CEO] is one square
      if (!rebusInternalSplits[tileIndex]) rebusInternalSplits[tileIndex] = []
      rebusInternalSplits[tileIndex].push(internalIndex)
      continue
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
  /** For keys in a rule which links several keys, the keys of that rule */
  linked: Record<string, string> = {},
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
        // A linked square can repeat a value, validOptions keeps those so its positions line up with the rule's options
        for (const value of new Set(values)) {
          if (value === "") continue
          if ([...value].length === 1) {
            validLetters.push(value)
          } else {
            validRebuses.push({ letters: value, symbol: char })
          }
        }
        const tile: SchrodingerTile = { type: "schrodinger", validLetters, validRebuses, validOptions: [...values], symbol: char }
        if (linked[char]) tile.linked = linked[char]
        tiles[rowI].push(tile)
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
  // A cell whose letter isn't known yet
  if (letter === UNFILLED_CELL) return { type: "letter", letter: "", unfilled: true }
  return { type: "letter", letter }
}

/**
 * Reads 'Rebus: 1=ONE 2=EIGHT|8 345=CIGAR|PENIS' into the keys with a single value, and the keys with several
 * (Schrödinger squares, and the squares of linked rules). See `parseRebusField` for the syntax.
 */
export const getRebuses = (str: string) => {
  const { rules, errors, deprecations } = parseRebusField(str)

  const rebuses: Record<string, string> = {}
  const schrodingerRebuses: Record<string, string[]> = {}
  /** For each key in a rule with several keys, the keys of that rule */
  const linked: Record<string, string> = {}

  for (const rule of rules) {
    rule.keys.forEach((key, i) => {
      const values = rule.options.map((option) => option[i])
      if (rule.keys.length > 1) {
        schrodingerRebuses[key] = values
        linked[key] = rule.keys.join("")
      } else if (values.length === 1) {
        rebuses[key] = values[0]
      } else {
        schrodingerRebuses[key] = values
      }
    })
  }

  return { rebuses, schrodingerRebuses, linked, rules, errors, deprecations }
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

/** Why a Start value does not match the solution tile under it, or undefined when it does */
function startMismatch(value: string, tile: Tile | undefined) {
  if (!tile) return `Start has '${value}' outside the Grid`
  if (tile.type === "blank") return `Start has '${value}' on a black square`
  if (tile.type === "letter") {
    if (tile.unfilled || value.toUpperCase() === tile.letter.toUpperCase()) return
    return `Start has '${value}' where the Grid has '${tile.letter}'`
  }
  if (tile.type === "rebus") {
    if (value === tile.symbol || value === tile.word) return
    return `Start has '${value}' where the Grid has the rebus '${tile.symbol}' (${tile.word})`
  }
}

/** Emoji in a row made of more than one code point, which a per-code-point split would break across cells */
function multiCodePointEmoji(row: string) {
  return [...row.matchAll(emojiSequence)].filter((match) => [...match[0]].length > 1).map((match) => ({ emoji: match[0], col: match.index! }))
}

const emojiPresentation = String.fromCodePoint(0xfe0f)
const keycap = String.fromCodePoint(0x20e3)
const zeroWidthJoiner = String.fromCodePoint(0x200d)

// Flags, keycaps, or a pictograph with its presentation selector or skin tone, joined into ZWJ sequences
const emojiElement = String.raw`(?:\p{Regional_Indicator}{2}|[#*0-9]${emojiPresentation}?${keycap}|\p{Extended_Pictographic}[${emojiPresentation}\p{Emoji_Modifier}]*)`
const emojiSequence = new RegExp(`${emojiElement}(?:${zeroWidthJoiner}${emojiElement})*`, "gu")
