import { readdirSync, readFileSync } from "fs"
import { join } from "path"
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
  tiles: json.tiles.map((row) =>
    row.map((t) => {
      if (t.type === "schrodinger") return { type: t.type, validOptions: [...(t.validOptions || [])].sort() }
      if (t.type === "rebus") return { type: t.type, word: t.word }
      if (t.type === "letter") return { type: t.type, letter: t.letter, unfilled: t.unfilled }
      return t
    }),
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

describe("migrating fixtures", () => {
  it.each(fixtures)("%s", async ({ dir, name }) => {
    const original = readFileSync(join(dir, name), "utf8")
    const migrated = migrateXDToV4(original)
    await expect(migrated).toMatchFileSnapshot(join(dir, "migrated", name))

    const before = xdToJSON(original)
    const after = xdToJSON(migrated)

    // It reads as v4, migrating can fix an error (like a comment the parser now reads as a line) but never adds one
    expect(after.report.warnings.filter((w) => w.type === "deprecation").map((w) => w.message)).toEqual([])
    const errorsBefore = before.report.errors.map((e) => e.message)
    expect(after.report.errors.map((e) => e.message).filter((e) => !errorsBefore.includes(e))).toEqual([])
    expect(after.tiles.flat().filter((t) => t.type === "schrodinger" && !t.symbol)).toEqual([])
    for (const clue of [...after.clues.across, ...after.clues.down]) expect(Object.keys(clue.metadata || {}).filter((k) => /^alt\d*$/.test(k))).toEqual([])

    // It's the same puzzle, when the parser can still read the original
    if (!errorsBefore.length) {
      const reread = rereadClues(before, after)
      const keyed = keyedAnswers(before)
      expect(puzzle(after, reread, keyed)).toEqual(puzzle(before, reread, keyed))
    }

    // And migrating it again changes nothing
    expect(migrateXDToV4(migrated)).toEqual(migrated)
  })
})
