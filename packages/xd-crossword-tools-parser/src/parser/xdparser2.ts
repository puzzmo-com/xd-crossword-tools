import { getCluePositionsForBoard, PositionWithTiles } from "../utils/clueNumbersFromBoard"
import type { Tile, CrosswordJSON, ClueComponentMarkup } from "../types"
import { convertImplicitOrderedXDToExplicitHeaders, shouldConvertToExplicitHeaders } from "./xdparser2.compat"

// These are all the sections supported by this parser
const knownHeaders = ["grid", "clues", "notes", "metadata", "metapuzzle", "start", "design", "design-style"] as const
const mustHave = ["grid", "clues", "metadata"] as const

export type ParseMode = (typeof knownHeaders)[number] | "comment" | "unknown"

/**
 * Converts an xd file into a JSON representation, the JSON aims to be
 * a bit of an overkill to ensure that less work is needed inside an app.
 *
 * @param xd the xd string
 * @param strict whether extra exceptions should be thrown with are useful for editor support
 */
export function xdToJSON(xd: string, strict = false, editorInfo = false): CrosswordJSON {
  let seenSections: string[] = []
  let preCommentState: ParseMode = "unknown"
  let styleTagContent: undefined | string = undefined
  let currentUnknownSectionTitle: string | undefined = undefined

  if (xd && shouldConvertToExplicitHeaders(xd)) {
    if (editorInfo) throw new Error("xd-crossword-tools: This file is using v1 implicit headers, you can't use an editor with this file")
    xd = convertImplicitOrderedXDToExplicitHeaders(xd)
  }

  let rawInput: {
    tiles: string[][]
    clues: Map<
      string,
      { num: number; question: string; metadata?: Record<string, string>; answer: string; dir: "A" | "D"; display: ClueComponentMarkup[] }
    >
  } = {
    tiles: [],
    clues: new Map(),
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

  if (!xd) {
    addSyntaxError("xd is an empty file", 0)
    return json
  }

  let mode: ParseMode = "unknown"
  for (let line = 0; line < lines.length; line++) {
    const content = lines[line]
    const trimmed = content.trim()

    // Start looking for comments first
    if (trimmed.startsWith("<!--")) {
      // Fast one-liner comments
      if (trimmed.endsWith("-->")) continue

      // For multi-line we need to re-start the loop
      preCommentState = mode
      mode = "comment"
      continue
    }

    // If we're in a multi-line comment then we need to keep
    // looking through for the end of the comment
    if (mode === "comment") {
      if (trimmed.endsWith("-->")) {
        mode = preCommentState
      }
      continue
    }

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
        json.notes += content
        continue

      // Store it for later parsing once we have rebuses
      case "grid": {
        if (trimmed === "") continue

        rawInput.tiles.push(trimmed.split(""))
        continue
      }

      // Same also, because we'll need to do post-processing at the end
      case "clues": {
        if (trimmed === "") continue

        const clue = clueFromLine(trimmed, line)
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
            const hintVersion = `${clue.dir}${clue.num}~Hint. ${clue.question} ~ ${clue.answer}`
            addSyntaxError(`Duplicate clue detected, if this is for a hint, please convert it to: '${hintVersion}'`, line)
          } else if (existing) {
            // Shim for v4 migration
            if (!existing.metadata) existing.metadata = {}
            existing.metadata["hint"] = clue.question.split(" ~ ")[0]
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
            existing.metadata[clue.metaKey.toLowerCase()] = clue.metaValue
            if (editorInfo) existing.metadata[clue.metaKey.toLowerCase() + ":line"] = line.toString()
          }
        }
        continue
      }

      // Trivial key map
      // @ts-ignore backwards compat
      case "metadata": {
        if (trimmed === "") continue
        if (!trimmed.includes(":")) {
          addSyntaxError(`Could not find a ':' separating the meta item's name from its value`, line)
        }

        const lineParts = trimmed.split(": ")
        const key = lineParts.shift()!
        const value = lineParts.join(": ")
        json.meta[key.toLowerCase()] = value
        if (editorInfo) {
          json.meta[key.toLowerCase() + ":line"] = line.toString()
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
        trimmed.split("").forEach((f, i) => {
          if (f === " ") return
          if (f === ".") return
          if (f === "#") return
          newLine[i] = f
        })
        json.start.push(newLine)
        continue
      }

      // A lil CSS parser for the design section
      case "design": {
        if (trimmed === "") continue
        if (trimmed.startsWith("<style>")) {
          // Single line
          if (trimmed.endsWith("</style>")) {
            styleTagContent = trimmed.split("<style>")[1].split("</style>")[0]
            continue
          }
          // Multiline
          styleTagContent = trimmed.split("<style>")[1] || ""
          mode = "design-style"
          continue
        }

        // Must be the grid, create a sparse array of the locations similar to
        // the start section above
        if (!json.design) json.design = { styles: {}, positions: [] }
        const newLine: string[] = []
        trimmed.split("").forEach((f, i) => {
          if (f === " ") return
          if (f === ".") return
          if (f === "#") return
          newLine[i] = f
        })
        json.design.positions.push(newLine)
        continue
      }

      case "design-style": {
        if (trimmed === "") continue
        if (styleTagContent) {
          styleTagContent += content.split("</style>")[0]
        } else {
          styleTagContent = content
        }

        if (content.includes("</style>")) {
          mode = "design"
        }
        continue
      }
    }
  }

  // Now that we have a mostly fleshed out file parse, do extra work to bring it all together

  // We can't reliably set the tiles until we have the rebus info, but we can't guarantee the order
  json.rebuses = getRebuses(json.meta.rebus || "")
  json.tiles = stringGridToTiles(json.rebuses, rawInput.tiles)

  if (json.design) {
    if (!styleTagContent) {
      const lineOfGrid = getLine(xd.toLowerCase(), "## design") as number
      addSyntaxError(`The style tag is missing from this design section`, lineOfGrid)
    } else {
      json.design.styles = parseStyleCSSLike(styleTagContent, xd, addSyntaxError)
    }
  }

  // The process above will make pretty white-spacey answers.
  if (json.metapuzzle) json.metapuzzle.answer = json.metapuzzle.answer.trim()

  const useBarredLogic = json.meta.form === "barred"

  // Update the clues with position info and the right metadata
  const positions = getCluePositionsForBoard(json.tiles, json.meta, rawInput.clues, json)

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
    const bail = () => {
      const lineOfClue = getLine(xd, clue.question)
      addSyntaxError(`The clue ${dirKey}${clue.num} is malformed`, lineOfClue || -1)
    }

    const positionData = positionsByClueNumber[clue.num]

    if (!positionData) {
      bail()
      continue
    }

    const tiles = positionData.tiles[dirKey]
    if (!tiles) {
      bail()
      continue
    }

    const answerWithRebusSymbols = replaceWordWithSymbol(clue.answer, tiles, json.meta.splitcharacter)
    const splits = parseSplitsFromAnswer(answerWithRebusSymbols, json.meta.splitcharacter)

    if (editorInfo && clue.metadata) clue.metadata["answer:unprocessed"] = clue.answer
    arr.push({
      body: clue.question,
      answer: clue.answer.split(json.meta.splitcharacter).join(""),
      number: clue.num,
      position: positionData.position,
      tiles,
      metadata: clue.metadata,
      display: clue.display,
      direction: dirKey,
      ...(splits ? { splits } : {}),
    })
  }

  // Process Schrödinger squares - find clues with alt metadata and populate validLetters
  const allClues = [...json.clues.across, ...json.clues.down]
  for (const clue of allClues) {
    if (clue.metadata) {
      // Collect all alternative answers (alt, alt1, alt2, etc.)
      const altAnswers: string[] = []
      for (const [key, value] of Object.entries(clue.metadata)) {
        if (key === "alt" || key.startsWith("alt")) {
          altAnswers.push(value)
        }
      }

      if (altAnswers.length > 0) {
        const primaryAnswer = clue.answer
        const allAnswers = [primaryAnswer, ...altAnswers]

        // Process each answer to replace rebus words with their symbols
        const processedAnswers = allAnswers.map((answer) => replaceWordWithSymbol(answer, clue.tiles, json.meta.splitcharacter || "-"))

        // For each tile position
        for (let tileIdx = 0; tileIdx < clue.tiles.length; tileIdx++) {
          const tile = clue.tiles[tileIdx]
          if (tile.type === "schrodinger") {
            const validLettersAtPosition = new Set<string>()
            const validRebusesAtPosition = new Map<string, string>() // symbol -> letters

            // Collect unique letters/rebuses at this position from all processed answers
            for (const processedAnswer of processedAnswers) {
              if (tileIdx < processedAnswer.length) {
                const char = processedAnswer[tileIdx]
                if (json.rebuses[char]) {
                  // For rebus symbols, store both symbol and letters
                  validRebusesAtPosition.set(char, json.rebuses[char])
                } else {
                  // For regular letters, add to validLetters
                  validLettersAtPosition.add(char)
                }
              }
            }

            // Add all valid letters to the tile
            for (const letter of validLettersAtPosition) {
              if (!tile.validLetters.includes(letter)) {
                tile.validLetters.push(letter)
              }
            }

            // Add all valid rebuses to the tile if any exist
            if (validRebusesAtPosition.size > 0) {
              for (const [symbol, letters] of validRebusesAtPosition) {
                const rebusEntry = { letters, symbol }
                const exists = tile.validRebuses.some((r) => r.symbol === symbol && r.letters === letters)
                if (!exists) {
                  tile.validRebuses.push(rebusEntry)
                }
              }
            }
          }
        }
      }
    }
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
    json.unknownSections[key].content = section.content.trimEnd()
  }

  // if (editorInfo) {
  //   json.clues.across.forEach((clue) => {
  //     const warnings = runLinterForClue(clue, "across")
  //     if (warnings.length) json.report.warnings.push(...warnings)
  //   })

  //   json.clues.down.forEach((clue) => {
  //     const warnings = runLinterForClue(clue, "down")
  //     if (warnings.length) json.report.warnings.push(...warnings)
  //   })
  // }

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

// This came from the original, I think it's pretty OK but maybe it could be a bit looser
const clueRegex = /(^.\d*)\.\s(.*)\s\~\s(.*)/

// This regex is greedy, and multiple :s get captured, so don't trust the matches after the number!
const clueMetaRegex = /(^.\d*)\s\^(.*):\s(.*?)/

type ClueParserResponse =
  | { dir: "D" | "A"; num: number; question: string; answer: string; display: ClueComponentMarkup[] }
  | { dir: "D" | "A"; num: number; metaKey: string; metaValue: string }
  | { dir: "D" | "A" | undefined; num: number | undefined; errorMessage: string }

/** Returns either a clue reference, a clue metadata reference, or throws an editor error */
const clueFromLine = (line: string, num: number): ClueParserResponse => {
  const expectedPrefix = line.slice(0, 1).toUpperCase() as "D" | "A"
  if (!["A", "D"].includes(expectedPrefix)) {
    return { dir: undefined, num: undefined, errorMessage: `This clue doesn't start with A or D: '${line}'` }
  }

  const parts = line.match(clueRegex)
  if (parts) {
    const num = isLegitNumber(parts[1])
    if (num === false) {
      const message = `This clue is not properly formatted, expected ${expectedPrefix}[num]. [clue] ~ [answer] but could not parse the number: ${parts[1]}`
      return { dir: expectedPrefix, num: undefined, errorMessage: message }
    }

    if (parts.length !== 4) {
      const message = `This clue is not properly formatted, expected ${expectedPrefix}[num]. [clue] ~ [answer] but only found ${parts.length} parts: ${parts}`
      return { dir: expectedPrefix, num, errorMessage: message }
    }

    const res: ClueParserResponse = {
      dir: expectedPrefix as "D" | "A",
      num,
      question: parts[2]!,
      answer: parts[3]!,
      display: xdMarkupProcessor(parts[2]!),
    }

    return res
  }

  // The 'clue' regex did not pass, lets check for a clue meta
  const metaParts = line.match(clueMetaRegex)
  if (metaParts) {
    const num = isLegitNumber(metaParts[1])
    if (num === false) {
      const message = `This clue is not properly formatted, expected ${expectedPrefix}[num]. [clue] ~ [answer] but could not parse the number from '${metaParts[1]}'`
      return { dir: expectedPrefix, num: undefined, errorMessage: message }
    }

    if (metaParts.length !== 4) {
      const message = `Could not get the right amount of parts from this clue, expected  ${expectedPrefix}[num] ^[hint]: [clue] but got ${metaParts.length} - ${metaParts}`
      return { dir: expectedPrefix, num, errorMessage: message }
    }

    return {
      dir: expectedPrefix as "D" | "A",
      num,
      metaKey: line.split("^")[1].split(":")[0].toLowerCase(),
      metaValue: line.split(":").slice(1).join(":").trimStart(),
    }
  }

  const message = `This clue does not match either the '${expectedPrefix}[num]. [clue] ~ [answer]' for a clue, or '${expectedPrefix}[num] ^[hint]: [clue]' for a clue's metadata.`
  return { dir: expectedPrefix, num, errorMessage: message }

  function isLegitNumber(str: string) {
    const legitNumber = parseInt(str.slice(1).split("~")[0])
    if (isNaN(legitNumber)) {
      return false
    }
    return legitNumber
  }
}

export const stringGridToTiles = (rebuses: CrosswordJSON["rebuses"], strArr: string[][]): CrosswordJSON["tiles"] => {
  const rebusKeys = Object.keys(rebuses)
  const tiles: CrosswordJSON["tiles"] = strArr.map((_) => [])
  strArr.forEach((row, rowI) => {
    row.forEach((char) => {
      if (rebusKeys.includes(char)) {
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
  // Puzz support
  if (letter === ".") return { type: "blank" }
  // Schrödinger square - will be populated with valid letters later
  if (letter === "*") return { type: "schrodinger", validLetters: [], validRebuses: [] }
  return { type: "letter", letter }
}

const getRebuses = (str: string) => {
  if (!str.includes("=")) return {}
  const rebuses = {} as Record<string, string>
  str.split(" ").forEach((substr) => {
    const [start, ...rest] = substr.split("=")
    rebuses[start] = rest.join("=")
  })

  return rebuses
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
  metapuzzle: { clue: string; answer: string } | undefined
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

// A mini character parser that jumps between an inner and outer state to
// produce a lite version of the CSS syntax. Lots of tests in
// xdparser.design.test.ts

function parseStyleCSSLike(str: string, xd: string, errorReporter: (msg: string, line: number) => void) {
  const lineOfGrid = getLine(xd.toLowerCase(), "## design") as number

  const styleSheet: Record<string, Record<string, string>> = {}

  const parseMode = ["outer", "inner"] as const
  let mode: (typeof parseMode)[number] = "outer"

  let token = ""
  let currentRuleName: undefined | string = undefined
  let currentKeyName: undefined | string = undefined

  for (let index = 0; index < str.length; index++) {
    const letter = str.slice(index, index + 1)
    if (mode === "outer") {
      // Keep adding letters to the token until we hit a }
      if (letter === "{") {
        mode = "inner"
        currentRuleName = token.trim()
        token = ""
        currentKeyName = undefined
        if (currentRuleName.length > 1) {
          errorReporter(`Cannot have a style rule which is longer than one character: got '${currentRuleName}'`, lineOfGrid)
        }
        continue
      }
    } else if (mode === "inner") {
      if (letter === "}") {
        mode = "outer"
        if (!styleSheet[currentRuleName!]) styleSheet[currentRuleName!] = {}
        // Handle a missing semi colon at the end of the inner style section
        if (!styleSheet[currentRuleName!][currentKeyName!]) styleSheet[currentRuleName!][currentKeyName!.trim()] = token.trim()

        token = ""
        continue
      } else if (letter === ":") {
        currentKeyName = token.trim()
        token = ""
        continue
      } else if (letter === ";") {
        if (!styleSheet[currentRuleName!]) styleSheet[currentRuleName!] = {}
        styleSheet[currentRuleName!][currentKeyName!.trim()] = token.trim()

        token = ""
        continue
      }
    }
    token += letter
  }

  if (mode === "inner") {
    errorReporter(`A style tag above likely does not have a closing '}'`, lineOfGrid)
  }

  return styleSheet
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
function parseSplitsFromAnswer(answerWithSplits: string, splitCharacter?: string): number[] | undefined {
  if (!splitCharacter) return undefined
  const splits = []
  const characters = [...answerWithSplits] // account for unicode characters like emojis that could take up more than one utf-16 unit
  for (var i = 0; i < characters.length; i++) {
    if (characters[i] === splitCharacter) {
      splits.push(characters.slice(0, i).filter((c) => c !== splitCharacter).length - 1)
    }
  }

  // Only include the splits when it is used
  if (splits.length === 0) return undefined

  return splits
}

/** xd spec compliant parser for markup inside a clue */
export function xdMarkupProcessor(input: string): ClueComponentMarkup[] {
  if (!input) return [["text", ""]]
  if (!input.includes("{")) return [["text", input]]

  const components: ClueComponentMarkup[] = []
  // https://regex101.com/r/JsLIDM/1
  const regex = /\{([\/\*\_\-\@\~!#])(.*?)\1\}/g
  let lastIndex = 0

  let match
  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      components.push(["text", input.slice(lastIndex, match.index)])
    }

    const typeChar = match[1]
    const content = match[2]

    switch (typeChar) {
      case "/":
        components.push(["italics", content])
        break
      case "*":
        components.push(["bold", content])
        break
      case "_":
        components.push(["underscore", content])
        break
      case "-":
      case "~":
        components.push(["strike", content])
        break
      case "@":
        components.push(["link", content.split("|")[0], content.split("|")[1]])
        break
      case "!":
        {
          // {![https://emojipedia.org/image/x.png]!} inline
          // {!![https://emojipedia.org/image/y.png]!} block
          // {!![https://emojipedia.org/image/y.png|alt text]!} block with alt text
          // {!![https://emojipedia.org/image/y.png|alt text|width|height]!} block with alt text, width and height
          const isBlock = content.startsWith("!")
          const contentWithoutBlock = isBlock ? content.slice(1) : content
          const contentWithSquareBrackets = contentWithoutBlock.slice(1, -1)
          const parts = contentWithSquareBrackets.split("|")

          if (parts.length === 1) {
            // Just URL
            components.push(["img", parts[0], "", isBlock])
          } else if (parts.length === 2) {
            // URL and alt text
            components.push(["img", parts[0], parts[1], isBlock])
          } else if (parts.length === 3) {
            // URL, alt text, and width
            components.push(["img", parts[0], parts[1], isBlock, parts[2]])
          } else if (parts.length >= 4) {
            // URL, alt text, width, and height
            components.push(["img", parts[0], parts[1], isBlock, parts[2], parts[3]])
          }
        }
        break
      case "#":
        {
          // {#text|hex colour light|hex colour dark#}
          const parts = content.split("|")
          if (parts.length === 3) {
            const [text, lightColor, darkColor] = parts
            components.push(["color", text, lightColor, darkColor])
          } else {
            // If malformed, treat as text
            components.push(["text", `{#${content}#}`])
          }
        }
        break
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < input.length) {
    components.push(["text", input.slice(lastIndex)])
  }

  return components
}
