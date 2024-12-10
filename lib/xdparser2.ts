import { getCluePositionsForBoard } from "./clueNumbersFromBoard"
import type { Tile, CrosswordJSON, MDClueComponent } from "./types"
import { runLinterForClue } from "./xdLints"
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
export function xdParser(xd: string, strict = false, editorInfo = false): CrosswordJSON {
  let seenSections: string[] = []
  let preCommentState: ParseMode = "unknown"
  let styleTagContent: undefined | string = undefined

  if (xd && shouldConvertToExplicitHeaders(xd)) {
    if (editorInfo) throw new Error("xd-crossword-tools: This file is using v1 implicit headers, you can't use an editor with this file")
    xd = convertImplicitOrderedXDToExplicitHeaders(xd)
  }

  let rawInput: {
    tiles: string[][]
    clues: Map<
      string,
      { num: number; question: string; metadata?: Record<string, string>; answer: string; dir: "A" | "D"; bodyMD?: MDClueComponent[] }
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
      mode = parseModeForString(content, line, strict)

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
    if (mode === "unknown") continue

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

      // Create a spare array of letters to add by default to the crossword
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

  // Update the clues with position info and the right meta

  const positions = getCluePositionsForBoard(json.tiles)
  for (const keyClue of rawInput.clues) {
    const [_, clue] = keyClue
    const dirKey = clue.dir === "A" ? "across" : "down"
    const arr = json.clues[dirKey]
    const positionData = positions[clue.num]
    const tiles = positionData.tiles[dirKey]!

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
      ...(splits ? { splits } : {}),
      ...(clue.bodyMD ? { bodyMD: clue.bodyMD } : {}),
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

  if (editorInfo) {
    json.clues.across.forEach((clue) => {
      const warnings = runLinterForClue(clue, "across")
      if (warnings.length) json.report.warnings.push(...warnings)
    })

    json.clues.down.forEach((clue) => {
      const warnings = runLinterForClue(clue, "down")
      if (warnings.length) json.report.warnings.push(...warnings)
    })
  }

  json.report.success = json.report.errors.length === 0
  return json

  function parseModeForString(lineText: string, num: number, strict: boolean): ParseMode {
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
      if (typeof jest === "undefined")
        console.log("xd-crossword-tools: Shimmed '### meta' to '### metadata' - this will be removed in the future")
      return "metadata"
    } else if (title.startsWith("design")) {
      return "design"
    }

    if (strict && !knownHeaders.includes(content.trim() as any)) {
      const headers = toTitleSentence(knownHeaders as any)

      addSyntaxError(
        `Two # headers are reserved for the system, we accept: ${headers}. Got '${content.trim()}'. You can use ### headers for inside notes.`,
        num,
      )
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
  | { dir: "D" | "A"; num: number; question: string; answer: string; bodyMD?: MDClueComponent[] }
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
    }

    if (
      res.question.includes("[") ||
      res.question.includes("*") ||
      // res.question.includes("_") ||
      res.question.includes("/") ||
      res.question.includes("~")
    ) {
      const components = inlineBBCodeParser(res.question)
      // Don't set if it's just one text (because it had something like `___` in the clue)
      if (!(components.length === 1 && components[0][0] === "text")) {
        res.bodyMD = components
      }
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

function isFirstCharAlphabetic(str: string): boolean {
  return str.charCodeAt(0) >= 97 && str.charCodeAt(0) <= 122
}

function parseBBTagType(str: string): string {
  let index = 0
  let tagType = ""
  while (index < str.length && isFirstCharAlphabetic(str[index])) {
    tagType += str[index]
    ++index
  }
  return tagType
}

// parses the inner url starting tags
function parseURL(str: string): string {
  let index = 0
  // whitespace is allowed between [url and =
  while (index < str.length && str[index] === " ") {
    ++index
  }
  // checks to see if the token is '='
  if (str[index] !== "=") {
    return ""
  }
  ++index

  // whitespace is allowed between '=' and the actual url
  while (index < str.length && str[index] === " ") {
    ++index
  }

  let url = ""
  while (index < str.length && str[index] !== "]") {
    url += str[index]
    ++index
  }
  return url
}

function parseBBInnerContents(str: string) {
  let index = 0;
  while (index < str.length && str[index] !== "[") {
    ++index
  }
  return str.slice(0, index)
}

function parseBB(str: string): { mdComponent: MDClueComponent; str: string } | undefined {
  let index = 1 // starting at one because [ is the start
  let starting = 0 // used for keeping the start of the entire bb tag/group
  let tagType = parseBBTagType(str.slice(index))
  if (tagType === "b" || tagType === "url" || tagType === "i" || tagType === "s") {
    index += tagType.length
    let url;
    if (tagType === "url") {
      url = parseURL(str.slice(index))
      if (url.length === 0) {
        // no url so invalid tag
        return
      }
      index += url.length + 1 // adds 1 because of the '='
    }
    // whitespace is allowed before the ']'
    while (index < str.length && str[index] === " ") {
      ++index
    }
    if (str[index] === "]") {
      ++index
    } else {
      return
    }

    let contents = parseBBInnerContents(str.slice(index))

    index += contents.length

    if (str[index] === "[") {
      ++index
      let ending = str.slice(index, index + 1 + tagType.length + 1)
      if (ending === `/${tagType}]`) {
        index += `/${tagType}]`.length
        let mdComponent: MDClueComponent = (() => {
          switch (tagType) {
            case "b": return ["bold", contents]
            case "url": {
              if (url) {
                return ["link", contents, url]
              }
            }
            case "i": return ["italics", contents]
            case "s": return ["strike", contents]
          }
        })()
        return { mdComponent, str: str.slice(starting, index) }
      }
    }
  }
}

export function inlineBBCodeParser(str: string): MDClueComponent[] {
  const components: MDClueComponent[] = []
  let index = 0
  let bareText = ''
  while (index < str.length) {
    // BB tags have to be contiguous like [b or [i or [url, [s
    if (str[index] === "[" && isFirstCharAlphabetic(str[index + 1])) {
      let { mdComponent, str: text } = parseBB(str.slice(index)) ?? {}
      if (mdComponent && text) {
        if (bareText.length > 0) {
          components.push(["text", bareText])
        }
        components.push(mdComponent)
        bareText = ''
        index += text.length
        continue
      }
    }
    bareText += str[index]
    ++index
  }
  if (bareText.length > 0) {
    components.push(["text", bareText])
  }
  return components
}
