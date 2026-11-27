import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { createRequire } from "module"
import { dirname, join } from "path"
import { describe, it, expect } from "vitest"
// The parser is only a dev dependency, it checks that the migrated files read as v4
import { xdToJSON, type CrosswordJSON, type Tile, type XDownComponent } from "xd-crossword-tools-parser"
import { migrateXDToV4 } from "./migrateXDToV4"

/**
 * Each fixture migrates to v4 which describes the same puzzle, and its migrated output is in `./migrated`:
 *
 * - `fixtures/pre-v4`: every xd file which used pre-v4 syntax in the test suites of this repo, named after its test
 * - `fixtures/puzzmo`: Puzzmo crosswords which have been in a daily, picked from all of them to cover every unusual
 *   thing which turned up (named by the first daily they were in, and their slug)
 */
const fixtureDirs = ["pre-v4", "puzzmo"].map((d) => join(__dirname, "fixtures", d))
const fixtures = fixtureDirs.flatMap((dir) => readdirSync(dir).filter((f) => f.endsWith(".xd")).map((name) => ({ dir, name, toString: () => `${dir.split("/").pop()}/${name}` })))

/** Pre-v4 answers could spell a rebus with its key, v4 answers spell it out */
const spellOut = (answer: string, tiles: Tile[], rebuses: Record<string, string>) => {
  const chars = [...answer]
  let out = ""
  let i = 0
  for (const tile of tiles) {
    if (i >= chars.length) break
    const rest = chars.slice(i).join("")
    const options = tile.type === "rebus" ? [tile.word] : tile.type === "schrodinger" ? tile.validOptions || [] : []
    const spelled = options.filter(Boolean).sort((a, b) => [...b].length - [...a].length).find((o) => rest.startsWith(o))
    if (spelled) {
      out += spelled
      i += [...spelled].length
    } else {
      // A square's own key is its solution
      const ownKey = tile.type === "schrodinger" && tile.symbol === chars[i] ? tile.validOptions?.[0] : undefined
      out += tile.type === "letter" ? chars[i] : (ownKey ?? rebuses[chars[i]] ?? chars[i])
      i++
    }
  }
  return out + chars.slice(i).join("")
}

/** Spaces around a pre-v4 image's positional parts weren't part of them, and the migrator drops them */
const trimImages = (display: XDownComponent[]): unknown[] =>
  display.map((c) => (c[0] === "img" ? c.map((part) => (typeof part === "string" ? part.trim() : part)) : c))

/**
 * The parser reads a pre-v4 clue line by the v4 rules, so a body with ' ~ ' in it is cut short there.
 * The migrator reads those lines the pre-v4 way, so they are compared by which clue they are.
 */
const rereadClues = (before: CrosswordJSON, after: CrosswordJSON) =>
  [...after.clues.across, ...after.clues.down]
    .filter((c) => c.plain.includes(" ~ "))
    .filter((c) => !before.clues[c.direction].find((b) => b.number === c.number)?.plain.includes(" ~ "))
    .map((c) => `${c.direction}${c.number}`)

/** The answers in the original which spelled a rebus with its key, as `across1:SPELLEDOUT` */
const keyedAnswers = (json: CrosswordJSON) =>
  new Set(
    [...json.clues.across, ...json.clues.down].flatMap((c) =>
      c.answers.map((a) => [a.answer, spellOut(a.answer, c.tiles, json.rebuses)]).filter(([a, s]) => a !== s).map(([_, s]) => `${c.direction}${c.number}:${s}`),
    ),
  )

/** The parts of a parse which describe the puzzle, rather than how the file was written */
const puzzle = (json: CrosswordJSON, reread: string[], keyed: Set<string>) => ({
  // A row of tiles as one string: a letter, '?' unfilled, '#' a block, '_' a spacer, [WORD] a rebus, {A|B} a Schrödinger square
  tiles: json.tiles.map((row) =>
    row
      .map((t) => {
        if (t.type === "schrodinger") return `{${[...(t.validOptions || [])].sort().join("|")}}`
        if (t.type === "rebus") return `[${t.word}]`
        if (t.type === "letter") return t.unfilled ? "?" : t.letter
        return t.spacer ? "_" : "#"
      })
      .join(" "),
  ),
  clues: [...json.clues.across, ...json.clues.down].map((c) => {
    const hint = c.metadata?.["hint:display"]
    if (reread.includes(`${c.direction}${c.number}`)) return { direction: c.direction, number: c.number, hint }

    // An answer which spelled a rebus with its key can be another answer once it is spelled out. The
    // parser places the splits of an answer like that as if it were spelled out, so those aren't compared
    const answers = new Map<string, number[] | undefined>()
    for (const a of c.answers) {
      const spelled = spellOut(a.answer, c.tiles, json.rebuses)
      if (!answers.has(spelled)) answers.set(spelled, keyed.has(`${c.direction}${c.number}:${spelled}`) ? undefined : a.splits)
    }
    return {
      direction: c.direction,
      number: c.number,
      answers: [...answers].sort(([a], [b]) => a.localeCompare(b)),
      display: trimImages(c.display),
      hint,
    }
  }),
  design: json.design && Object.fromEntries(
    json.design.positions.flatMap((row, y) => row.map((char, x) => [`${y},${x}`, char && json.design!.styles[char]])).filter(([_, s]) => s),
  ),
  notes: json.notes,
})

/**
 * Test inputs whose bars don't match their clues: the pre-v4 parser found a barred grid's entries by their answers,
 * v4 numbers the grid, and these grids don't have the entries their clues are for. They still have to migrate cleanly
 */
const inconsistentBars = [
  "crossCompilerXMLToXD--emits-a-design-section-with-bar-left-and-bar-top-styles.xd",
  "xdparser.barred--supports-comma-separated-selectors-in-the-design-section.xd",
]

type Shape = ReturnType<typeof puzzle>

/**
 * Pre-v4 Puzzmo xd read a slot's second clue as its hint. In v4 a slot can have a clue per fill, so the migrator only
 * makes a hint of a second clue which repeats the answer, these keep their own answers and stay clues
 */
const secondClues: Record<string, string[]> = {
  "xdparser--handles-automatically-converting-double-clues-to-hint-syntax-when-not-.xd": ["across1", "across5"],
}

/** Compares only the first clue for those slots, without a hint */
const withoutSecondClues = (shape: Shape, refs: string[] = []) => ({
  ...shape,
  clues: shape.clues
    .filter((c, i) => !refs.includes(`${c.direction}${c.number}`) || shape.clues.findIndex((o) => o.direction === c.direction && o.number === c.number) === i)
    .map((c) => (refs.includes(`${c.direction}${c.number}`) ? { ...c, hint: undefined } : c)),
})

/** The bars on a v4 parse's tiles, from its Bars section */
const barsOnTiles = (json: CrosswordJSON) =>
  Object.fromEntries(
    json.tiles.flatMap((row, y) =>
      row.flatMap((t, x) => (t.type !== "blank" && t.design?.length ? [[`${y},${x}`, [...t.design].sort().join(" ")]] : [])),
    ),
  )

/**
 * Pre-v4 barred grids had their bars in the design (`bar-left` and `bar-top`), v4 ones in a Bars section. This
 * compares bars on their own, and the design without them. Bars on a black square don't do anything, so they go.
 */
const withBarsApart = (shape: Shape, bars?: Record<string, string>) => {
  const design: Record<string, Record<string, string>> = {}
  const designBars: Record<string, string> = {}
  for (const [cell, style] of Object.entries((shape.design || {}) as Record<string, Record<string, string>>)) {
    const { "bar-left": left, "bar-top": top, ...rest } = style
    const [y, x] = cell.split(",").map(Number)
    const blank = ["#", "_"].includes(shape.tiles[y]?.split(" ")[x])
    const flags = [left === "true" && "bar-left", top === "true" && "bar-top"].filter(Boolean).sort().join(" ")
    if (flags && !blank) designBars[cell] = flags
    if (Object.keys(rest).length) design[cell] = rest
  }
  return { ...shape, design: Object.keys(design).length ? design : undefined, bars: bars ?? designBars }
}

/**
 * What each original file described, as read by the parser at b179f90, the last which read pre-v4 syntax. These are
 * in `reference/` next to each fixture because the parser now only reads v4. A new fixture gets one from that parser,
 * which scripts/build-pre-v4-parser.sh builds, by running this with WRITE_REFERENCES set to where it was built.
 */
type Reference = {
  /** The errors the original had, migrating can fix those but not add any */
  errors: string[]
  /** Clues the migrator reads the pre-v4 way, see rereadClues */
  reread: string[]
  /** Answers which spelled a rebus with its key, see keyedAnswers */
  keyed: string[]
  /** The puzzle, when the original could be read without errors */
  puzzle: ReturnType<typeof puzzle> | null
}

/** Reads the original with the pre-v4 parser, and writes what it describes */
function writeReference(path: string, original: string, after: CrosswordJSON) {
  const parserPath = process.env.WRITE_REFERENCES
  if (!parserPath) throw new Error(`${path} is missing, make it with scripts/build-pre-v4-parser.sh and WRITE_REFERENCES=<the parser it built>`)

  const legacy: typeof import("xd-crossword-tools-parser") = createRequire(import.meta.url)(parserPath)
  const before = legacy.xdToJSON(original)
  const reread = rereadClues(before, after)
  const keyed = keyedAnswers(before)
  const errors = before.report.errors.map((e) => e.message)
  const reference: Reference = { errors, reread, keyed: [...keyed], puzzle: errors.length ? null : puzzle(before, reread, keyed) }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, formatReference(reference))
}

/** JSON with a line per grid row and per clue, so a reference stays small and diffs well */
const formatReference = (reference: Reference) => {
  const list = (items: unknown[], indent: string) => (items.length ? `[\n${items.map((i) => indent + "  " + JSON.stringify(i)).join(",\n")}\n${indent}]` : "[]")
  const { puzzle: p, ...rest } = reference
  const head = Object.entries(rest).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
  const body = p
    ? `{\n    "tiles": ${list(p.tiles, "    ")},\n    "clues": ${list(p.clues, "    ")},\n${p.design ? `    "design": ${JSON.stringify(p.design)},\n` : ""}    "notes": ${JSON.stringify(p.notes)}\n  }`
    : "null"
  return `{\n${head.join(",\n")},\n  "puzzle": ${body}\n}\n`
}

describe("migrating fixtures", () => {
  it.each(fixtures)("%s", async ({ dir, name }) => {
    const original = readFileSync(join(dir, name), "utf8")
    const migrated = migrateXDToV4(original)
    await expect(migrated).toMatchFileSnapshot(join(dir, "migrated", name))

    const after = xdToJSON(migrated)
    const referencePath = join(dir, "reference", name.replace(/\.xd$/, ".json"))
    if (!existsSync(referencePath)) writeReference(referencePath, original, after)
    const reference: Reference = JSON.parse(readFileSync(referencePath, "utf8"))

    // It reads as v4, migrating can fix an error (like a comment the parser now reads as a line) but never adds one
    expect(after.report.warnings.filter((w) => w.type === "deprecation").map((w) => w.message)).toEqual([])
    if (!inconsistentBars.includes(name)) {
      expect(after.report.errors.map((e) => e.message).filter((e) => !reference.errors.includes(e))).toEqual([])
    }
    expect(after.tiles.flat().filter((t) => t.type === "schrodinger" && !t.symbol)).toEqual([])
    for (const clue of [...after.clues.across, ...after.clues.down]) expect(Object.keys(clue.metadata || {}).filter((k) => /^alt\d*$/.test(k))).toEqual([])

    // It's the same puzzle as the original was, when it could be read
    if (reference.puzzle && !inconsistentBars.includes(name)) {
      const now = JSON.parse(JSON.stringify(puzzle(after, reference.reread, new Set(reference.keyed))))
      const refs = secondClues[name]
      expect(withoutSecondClues(withBarsApart(now, barsOnTiles(after)), refs)).toEqual(withoutSecondClues(withBarsApart(reference.puzzle), refs))
    }

    // And migrating it again changes nothing
    expect(migrateXDToV4(migrated)).toEqual(migrated)
  })
})
