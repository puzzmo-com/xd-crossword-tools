import { getCluePositionsForBoard } from "./clueNumbersFromBoard"
import { EditorError } from "./EditorError"
import type { Tile, CrosswordJSON } from "./types"
import { implicitOrderedXDToExplicitHeaders, shouldConvertToExplicitHeaders } from "./xdparser2.compat"

// These are all the sections supported by this parser
const knownHeaders = ["grid", "clues", "notes", "meta", "design", "metapuzzle"] as const
const mustHave = ["grid", "clues", "meta"] as const
type ParseMode = "start" | typeof knownHeaders[number] | "unknown"

export function xdParser(xd: string): CrosswordJSON {
  let seenSections: string[] = []

  if (!xd) throw new EditorError("Not got anything to work with yet", 0)
  if (shouldConvertToExplicitHeaders(xd)) {
    xd = implicitOrderedXDToExplicitHeaders(xd)
  }

  let rawInput: {
    tiles: string[][]
    clues: Map<string, { num: number; question: string; question2?: string; answer: string; dir: "A" | "D" }>
  } = {
    tiles: [],
    clues: new Map(),
  }

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

  let mode: ParseMode = "start"
  let lines = xd.split("\n")
  for (let line = 0; line < lines.length; line++) {
    const content = lines[line]
    if (content.startsWith("## ")) {
      mode = parseModeForString(content, line)
      seenSections.push(mode)
      continue
    }

    // Allow for prefix whitespaces, no _real_ reason but it can't hurt the parser
    if (mode === "start") continue

    // We have no multiline things
    const trimmed = content.trim()
    if (trimmed === "") continue

    switch (mode) {
      // NOOP
      case "notes":
        continue

      // Store it for later parsing once we have rebuses
      case "grid": {
        rawInput.tiles.push(trimmed.split(""))
        continue
      }

      // Same also, because we'll need to do post-processing at the end
      case "clues": {
        const clue = clueFromLine(trimmed, line)
        const key = `${clue.dir}${clue.num}`
        const existing = rawInput.clues.get(key)
        if (existing) {
          existing.question2 = clue.answer
        } else {
          rawInput.clues.set(key, clue)
        }
        continue
      }

      // Trivial key map
      case "meta": {
        if (!trimmed.includes(":")) throw new EditorError(`Could not find a ':' separating the meta item's name from its value`, line)
        const lineParts = trimmed.split(": ")
        const key = lineParts.shift()!
        json.meta[key.toLowerCase()] = lineParts.join(": ")
        continue
      }
    }
  }

  // We can't reliably set the tiles until we have the rebus info, but we can't guarantee the order
  json.rebuses = getRebuses(json.meta.rebus || "")
  json.tiles = stringGridToTiles(json.rebuses, rawInput.tiles)

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

  // A check that all of the essential data has been set
  const needed = mustHave.filter((needs) => !seenSections.includes(needs))
  if (needed.length) {
    throw new EditorError(`This crossword has missing sections: '${toTitleSentence(needed)}`, 0)
  }

  return json
}

// This came from the original, I think it's pretty OK but maybe it could be a bit looser
const clueRegex = /(^.\d*)\.\s(.*)\s\~\s(.*)/

const clueFromLine = (line: string, num: number) => {
  const expectedPrefix = line.slice(0, 1).toUpperCase()
  if (!["A", "D"].includes(expectedPrefix)) {
    throw new EditorError(`This clue doesn't start with A or D`, num)
  }

  const parts = line.match(clueRegex)
  if (!parts) throw new EditorError(`This clue does not match the format of '${expectedPrefix}[num]. [clue] ~ [answer]'`, num)

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

const parseModeForString = (lineText: string, num: number): ParseMode => {
  const content = lineText.split("## ").pop()
  if (!content) throw new EditorError("This header needs some content", num)

  const title = content.toLowerCase()
  if (title.startsWith("grid")) {
    return "grid"
  } else if (title.startsWith("clues")) {
    return "clues"
  } else if (title.startsWith("notes")) {
    return "notes"
  } else if (title.startsWith("meta")) {
    return "meta"
  }

  if (!knownHeaders.includes(content.trim() as any)) {
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
  if (strs.length == 1) return strs[0]

  const capNeeded = strs.map((h) => h[0].toUpperCase() + h.slice(1))
  return capNeeded.slice(0, -1).join(", ") + " & " + capNeeded[capNeeded.length - 1]
}
