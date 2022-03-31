import { getCluePositionsForBoard } from "./clueNumbersFromBoard"
import { EditorError } from "./EditorError"
import type { Tile, CrosswordJSON } from "./types"
import { convertImplicitOrderedXDToExplicitHeaders, shouldConvertToExplicitHeaders } from "./xdparser2.compat"

// These are all the sections supported by this parser
const knownHeaders = ["grid", "clues", "notes", "metadata", "metapuzzle", "start", "design", "design-style"] as const
const mustHave = ["grid", "clues", "metadata"] as const
type ParseMode = typeof knownHeaders[number] | "comment" | "unknown"

/**
 * Converts an xd file into a JSON representation, the JSON aims to be
 * a bit of an overkill to ensure that less work is needed inside an app.
 *
 * @param xd the xd string
 * @param strict whether extra exceptions should be thrown with are useful for editor support
 */
export function xdParser(xd: string, strict = true): CrosswordJSON {
  let seenSections: string[] = []
  let preCommentState: ParseMode = "unknown"
  let styleTagContent: undefined | string = undefined

  if (!xd) throw new EditorError("Not got anything to work with yet", 0)
  if (shouldConvertToExplicitHeaders(xd)) {
    xd = convertImplicitOrderedXDToExplicitHeaders(xd)
  }

  let rawInput: {
    tiles: string[][]
    clues: Map<string, { num: number; question: string; question2?: string; answer: string; dir: "A" | "D" }>
  } = {
    tiles: [],
    clues: new Map(),
  }

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
  }

  let mode: ParseMode = "unknown"
  let lines = xd.split("\n")
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
      seenSections.push(mode)
      continue
    }

    if (strict && trimmed.startsWith("## ")) {
      throw new EditorError(`This header has spaces before it, this is likely an accidental indentation`, line)
    }

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
        const key = `${clue.dir}${clue.num}`
        const existing = rawInput.clues.get(key)
        if (existing) {
          existing.question2 = clue.question
        } else {
          rawInput.clues.set(key, clue)
        }
        continue
      }

      // Trivial key map
      // @ts-ignore backwards compat
      case "metadata": {
        if (trimmed === "") continue
        if (!trimmed.includes(":")) throw new EditorError(`Could not find a ':' separating the meta item's name from its value`, line)

        const lineParts = trimmed.split(": ")
        const key = lineParts.shift()!
        json.meta[key.toLowerCase()] = lineParts.join(": ")
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
      throw new EditorError(`The style tag is missing from this design section`, lineOfGrid)
    }

    json.design.styles = parseStyleCSSLike(styleTagContent, xd)
  }

  if (json.metapuzzle)
    // The process above will make pretty white-spacey answers.
    json.metapuzzle.answer = json.metapuzzle.answer.trim()

  // Update the clues with position info and the right meta
  const positions = getCluePositionsForBoard(json.tiles)
  for (const keyClue of rawInput.clues) {
    const [_, clue] = keyClue
    const arr = clue.dir === "A" ? json.clues.across : json.clues.down
    arr.push({
      main: clue.question,
      second: clue.question2,
      answer: clue.answer,
      number: clue.num,
      position: positions[clue.num],
    })
  }

  // Checks that all of the essential data has been set in a useful way
  if (strict) {
    const needed = mustHave.filter((needs) => !seenSections.includes(needs))
    if (needed.length) {
      throw new EditorError(`This crossword has missing sections: '${toTitleSentence(needed)}' - saw ${toTitleSentence(seenSections)}`, 0)
    }

    if (json.tiles.length === 0) {
      const lineOfGrid = getLine(xd.toLowerCase(), "## grid")
      if (lineOfGrid === false) throw new EditorError(`This crossword has a missing grid content`, 0)
      else throw new EditorError(`This grid section does not have a working grid`, lineOfGrid)
    }
  }

  return json
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

const clueFromLine = (line: string, num: number) => {
  const expectedPrefix = line.slice(0, 1).toUpperCase()
  if (!["A", "D"].includes(expectedPrefix)) {
    throw new EditorError(`This clue doesn't start with A or D: '${line}'`, num)
  }

  const parts = line.match(clueRegex)
  if (!parts)
    throw new EditorError(`The clue '${line.trim()}' does not match the format of '${expectedPrefix}[num]. [clue] ~ [answer]'`, num)

  if (parts.length !== 4)
    throw new EditorError(
      `Could not get the right amount of parts from this clue, expected 4 items here but got ${parts.length} - ${parts}`,
      num
    )

  const legitNumber = parseInt(parts[1].slice(1))
  if (isNaN(legitNumber)) {
    throw new EditorError(`This clue number isn't an integer: got '${parts[1]}'`, num)
  }

  return {
    dir: expectedPrefix as "D" | "A",
    num: legitNumber,
    question: parts[2],
    answer: parts[3],
  }
}

const parseModeForString = (lineText: string, num: number, strict: boolean): ParseMode => {
  const content = lineText.split("## ").pop()
  if (!content) throw new EditorError("This header needs a title", num)

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
    console.log("xd-crossword-tools: Shimmed '### meta' to '### metadata' - this will be removed in the future")
    return "metadata"
  } else if (title.startsWith("design")) {
    return "design"
  }

  if (strict && !knownHeaders.includes(content.trim() as any)) {
    const headers = toTitleSentence(knownHeaders as any)
    throw new EditorError(
      `Two # headers are reserved for the system, they can only be: ${headers}. Got '${content.trim()}'. You can use ### headers for inside notes.`,
      num
    )
  }

  return "unknown"
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

function parseStyleCSSLike(str: string, xd: string) {
  const lineOfGrid = getLine(xd.toLowerCase(), "## design") as number

  const styleSheet: Record<string, Record<string, string>> = {}

  const parseMode = ["outer", "inner"] as const
  let mode: typeof parseMode[number] = "outer"

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
          throw new EditorError(`Cannot have a style rule which is longer than one character: got '${currentRuleName}'`, lineOfGrid)
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
    throw new EditorError(`The style content likely does not have a closing '}'`, lineOfGrid)
  }

  return styleSheet
}
