import { readFileSync } from "fs"
import { migrateXDToV4, xdToJSON, type CrosswordJSON } from "xd-crossword-tools-parser"
import { it, expect, describe } from "vitest"
import { JSONToPuz, xdToPuz } from "../src/JSONToPuz"
import { puzToXD } from "../src/puzToXD"
import { decode as puzDecode, encode as puzEncode } from "../src/vendor/puzjs"

const u16 = (bytes: Uint8Array, offset: number) => bytes[offset] | (bytes[offset + 1] << 8)
const toArrayBuffer = (bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer

describe(JSONToPuz.name, () => {
  it("writes the same checksums as a .puz exported by real tooling", () => {
    // Goes straight through the decoder rather than via .xd, because .xd trims the padded author in this file
    const original = new Uint8Array(readFileSync(`${__dirname}/puz/alpha-bits.puz`))
    const puz = puzEncode(puzDecode(toArrayBuffer(original)))

    expect(Buffer.from(puz.subarray(2, 14)).toString("latin1")).toEqual("ACROSS&DOWN\0")
    expect(Buffer.from(puz.subarray(24, 28)).toString("latin1")).toEqual("1.3\0")
    // Width, height, clue count and bitmask, plus the CIB checksum over them
    expect(puz.subarray(44, 52)).toEqual(original.subarray(44, 52))
    expect(u16(puz, 14)).toEqual(u16(original, 14))

    // The masked checksums are [CIB, solution, progress, text]. The original was saved mid-solve
    // so its progress checksum differs, but the CIB, solution and all the strings should match.
    for (const i of [0, 1, 3]) {
      expect(puz[16 + i]).toEqual(original[16 + i])
      expect(puz[20 + i]).toEqual(original[20 + i])
    }
  })

  it("handles non-square grids", () => {
    const json = xdToJSON(readFileSync(`${__dirname}/amuse/the-minion-puzzle.xd`, "utf8"))
    const puz = JSONToPuz(json)

    expect(puz[44]).toEqual(19)
    expect(puz[45]).toEqual(21)
    expect(u16(puz, 46)).toEqual(json.clues.across.length + json.clues.down.length)

    const decoded = puzDecode(toArrayBuffer(puz))
    expect(decoded.grid.map((row) => row.join(""))).toEqual(
      json.tiles.map((row) => row.map((t) => (t.type === "letter" ? t.letter : ".")).join("")),
    )
  })

  it("round-trips xd -> puz -> xd", () => {
    const json = xdToJSON(readFileSync(`${__dirname}/puz/alpha-bits.xd`, "utf8"))
    const roundTripped = xdToJSON(puzToXD(Buffer.from(JSONToPuz(json))))

    expect(roundTripped.meta.title).toEqual(json.meta.title)
    expect(roundTripped.meta.author).toEqual(json.meta.author)
    expect(roundTripped.meta.copyright).toEqual(json.meta.copyright)
    expect(roundTripped.tiles).toEqual(json.tiles)
    const clueSummary = (c: { number: number; plain: string; answer: string }) => [c.number, c.plain, c.answer]
    expect(roundTripped.clues.across.map(clueSummary)).toEqual(json.clues.across.map(clueSummary))
    expect(roundTripped.clues.down.map(clueSummary)).toEqual(json.clues.down.map(clueSummary))
  })

  it("encodes clues as plain Windows-1252 text", () => {
    const json = xdToJSON(readFileSync(`${__dirname}/puz/alpha-bits.xd`, "utf8"))
    json.clues.across[0].plain = "It’s a café — “quoted” Ő"
    const puz = JSONToPuz(json)

    const decoded = puzDecode(toArrayBuffer(puz))
    const clue = decoded.clues.across[json.clues.across[0].number]
    // The decoder reads bytes as char codes, so these are the raw Windows-1252 bytes
    expect(clue).toEqual("It\x92s a caf\xe9 \x97 \x93quoted\x94 O")
  })

  describe("pre-filled squares", () => {
    const xd = readFileSync(`${__dirname}/puz/alpha-bits.xd`, "utf8") + "\n## Start\n\nA.........S....\n...........B...\n"

    it("puts Start letters in the player's grid, flagged as given", () => {
      const decoded = puzDecode(toArrayBuffer(JSONToPuz(xdToJSON(xd))))

      expect(decoded.progress[0].join("")).toEqual("A---..---.S----")
      expect(decoded.progress[1].join("")).toEqual("-----.---.-B---")
      expect(decoded.given).toEqual([0, 10, 15 + 11])
    })

    it("round-trips xd -> puz -> xd", () => {
      const original = xdToJSON(xd)
      const roundTripped = xdToJSON(puzToXD(Buffer.from(JSONToPuz(original))))
      // The import writes out every row of the Start section, so compare the letters which were set
      const letters = (start: CrosswordJSON["start"]) => start?.flatMap((row, r) => row.map((l, c) => l && `${r},${c}:${l}`).filter(Boolean))
      expect(letters(roundTripped.start)).toEqual(letters(original.start))
    })
  })

  describe("notes", () => {
    it("round-trips multi-line notes through their own section", () => {
      const xd = readFileSync(`${__dirname}/puz/alpha-bits.xd`, "utf8") + "\n## Notes\n\nLine one of the notes\nLine two: has a colon\n"
      const roundTripped = xdToJSON(puzToXD(Buffer.from(JSONToPuz(xdToJSON(xd)))))

      expect(roundTripped.notes).toEqual("Line one of the notes\nLine two: has a colon")
      expect(roundTripped.meta).not.toHaveProperty("line two")
      expect(roundTripped.meta).not.toHaveProperty("description")
    })

    it("falls back to the description metadata from older .puz imports", () => {
      const xd = readFileSync(`${__dirname}/puz/alpha-bits.xd`, "utf8").replace("description: N/A", "description: Some notes")
      expect(puzDecode(toArrayBuffer(JSONToPuz(xdToJSON(xd)))).meta.description).toEqual("Some notes")
    })
  })

  describe("embedded xd", () => {
    // Uses features which .puz can't represent on its own: markup, hints and non Windows-1252 characters
    const xd = readFileSync(`${__dirname}/puz/alpha-bits.xd`, "utf8")
      .replace("A1. Captain of the Pequod ~ AHAB", "A1. Captain of the {/Pequod/} 🐋 ~ AHAB\nA1 ^hint: Moby-Dick’s nemesis")
      .concat("\n## Start\n\nA..............\n")

    it("round-trips the exact document", () => {
      const v4 = migrateXDToV4(xd)
      expect(puzToXD(Buffer.from(xdToPuz(v4)))).toEqual(v4)
    })

    it("round-trips unfilled cells", () => {
      const draft = migrateXDToV4(xd).replace("AHAB..CUD.SERIF", "A?AB..CUD.SERIF").replace("~ AHAB\n", "~ A?AB\n")
      const puz = xdToPuz(draft)
      expect(puzDecode(toArrayBuffer(puz)).grid[0].slice(0, 4)).toEqual(["A", "?", "A", "B"])
      expect(puzToXD(Buffer.from(puz))).toEqual(draft)
    })

    it("migrates a pre-v4 document embedded by an older version", () => {
      const preV4 = xd.replace("A5. Food for second chance chewing ~ CUD", "A5. Food for {@second chance|https://example.com@} chewing ~ CUD")
      const imported = puzToXD(Buffer.from(xdToPuz(preV4)))
      expect(imported).toEqual(migrateXDToV4(preV4))
      expect(imported).toContain("A5. Food for {@second chance | href: https://example.com@} chewing ~ CUD")
    })

    it("still writes a normal .puz around it", () => {
      const decoded = puzDecode(toArrayBuffer(xdToPuz(xd)))
      expect(decoded.clues.across[1]).toEqual("Captain of the Pequod ?")
      expect(decoded.given).toEqual([0])
    })

    it("is ignored when the .puz grid was changed after export", () => {
      const puz = xdToPuz(xd)
      puz[52] = "B".charCodeAt(0)
      const imported = puzToXD(Buffer.from(puz))

      expect(imported).not.toEqual(xd)
      expect(imported).toContain("BHAB..CUD.SERIF")
    })

    it("is ignored when its data is corrupted", () => {
      const puz = xdToPuz(xd)
      const sectionStart = Buffer.from(puz).indexOf("XDOC")
      puz[sectionStart + 20] ^= 0xff

      expect(puzDecode(toArrayBuffer(puz)).xd).toBeUndefined()
      expect(puzToXD(Buffer.from(puz))).not.toEqual(xd)
    })

    it("is not confused by clue text that looks like a section", () => {
      const json = xdToJSON(readFileSync(`${__dirname}/puz/alpha-bits.xd`, "utf8"))
      json.clues.across[0].plain = "XDOC\u0004\u0000\u0000\u0000test"
      expect(puzDecode(toArrayBuffer(JSONToPuz(json))).xd).toBeUndefined()
    })
  })
})
