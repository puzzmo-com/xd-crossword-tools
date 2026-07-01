import { readFileSync } from "fs"
import { join } from "path"
import { describe, it, expect } from "vitest"

import { fileToXD } from "../src/fileToXD"
import { jpzToXD } from "../src/jpzToXD"
import { puzToXD } from "../src/puzToXD"
import { acrossTextToXD } from "../src/acrossTextToXD"
import { uclickXMLToXD } from "../src/uclickToXD"
import { crossCompilerXMLToXD } from "../src/crossCompilerXMLToXD"
import { amuseToXD } from "../src/amuseJSONToXD"
import { decodePuzzleMeHTML } from "../src/puzzleMeDecode"
import { schrodingerAmuseExample } from "./amuse/amuseExamples"

const fixture = (...p: string[]) => join(__dirname, ...p)
const readText = (...p: string[]) => readFileSync(fixture(...p), "utf8")
const readBytes = (...p: string[]) => new Uint8Array(readFileSync(fixture(...p)))

const jpzText = readText("jpz", "That's a Bear in a Bee Costume.jpz")
const puzBytes = readBytes("puz", "alpha-bits.puz")
const acrossText = readText("across", "v1-simple.puz.txt")
const crossCompilerText = readText("crosscompiler", "globe-2026-february.xml")
const uclickText = readText("uclick", "simple-uclick.xml")
const puzzleMeHTML = readText("puzzleme", "team_bakery.html")
const amuseJSONText = JSON.stringify(schrodingerAmuseExample)

describe("fileToXD", () => {
  describe("routing by file extension", () => {
    it("passes a .xd file straight through", async () => {
      const xd = "## Metadata\n\ntitle: Already XD\n"
      const res = await fileToXD("already.xd", xd)
      expect(res.format).toBe("xd")
      expect(res.xd).toBe(xd)
    })

    it("converts a .jpz file", async () => {
      const res = await fileToXD("puzzle.jpz", jpzText)
      expect(res.format).toBe("jpz")
      expect(res.xd).toBe(jpzToXD(jpzText))
    })

    it("converts a .puz file", async () => {
      const res = await fileToXD("puzzle.puz", puzBytes)
      expect(res.format).toBe("puz")
      expect(res.xd).toBe(puzToXD(puzBytes.buffer.slice(0) as ArrayBuffer))
    })

    it("converts a .puz.txt (Across Lite) file", async () => {
      const res = await fileToXD("puzzle.puz.txt", acrossText)
      expect(res.format).toBe("across-lite")
      expect(res.xd).toBe(acrossTextToXD(acrossText))
    })

    it("converts a plain .txt Across Lite file", async () => {
      const res = await fileToXD("puzzle.txt", acrossText)
      expect(res.format).toBe("across-lite")
      expect(res.xd).toBe(acrossTextToXD(acrossText))
    })

    it("converts an Amuse .json file", async () => {
      const res = await fileToXD("puzzle.json", amuseJSONText)
      expect(res.format).toBe("amuse")
      expect(res.xd).toBe(amuseToXD(JSON.parse(amuseJSONText)))
    })

    it("converts a PuzzleMe .html file", async () => {
      const res = await fileToXD("puzzle.html", puzzleMeHTML)
      expect(res.format).toBe("puzzleme-html")
      expect(res.xd).toBe(amuseToXD(decodePuzzleMeHTML(puzzleMeHTML)))
    })

    it("converts a PuzzleMe .htm file", async () => {
      const res = await fileToXD("puzzle.htm", puzzleMeHTML)
      expect(res.format).toBe("puzzleme-html")
    })

    it("is case-insensitive about the extension", async () => {
      const res = await fileToXD("PUZZLE.JPZ", jpzText)
      expect(res.format).toBe("jpz")
    })
  })

  describe(".xml routing (every outcome)", () => {
    it("routes Crossword Compiler XML (rectangular-puzzle schema)", async () => {
      const res = await fileToXD("puzzle.xml", crossCompilerText)
      expect(res.format).toBe("crossword-compiler-xml")
      expect(res.xd).toBe(crossCompilerXMLToXD(crossCompilerText))
    })

    it("routes UClick XML (no rectangular-puzzle schema)", async () => {
      const res = await fileToXD("puzzle.xml", uclickText)
      expect(res.format).toBe("uclick-xml")
      expect(res.xd).toBe(uclickXMLToXD(uclickText))
    })

    it("throws for XML that is neither Crossword Compiler nor a valid UClick file", async () => {
      const xml = `<some-root><not-a-crossword/></some-root>`
      await expect(fileToXD("puzzle.xml", xml)).rejects.toThrow(/Could not find crossword element/)
    })
  })

  describe(".json routing (every outcome)", () => {
    it("converts a valid Amuse JSON", async () => {
      const res = await fileToXD("puzzle.json", amuseJSONText)
      expect(res.format).toBe("amuse")
    })

    it("throws for valid JSON that is not an Amuse export", async () => {
      const json = JSON.stringify({ hello: "world" })
      await expect(fileToXD("puzzle.json", json)).rejects.toThrow(/Expected an Amuse JSON file/)
    })

    it("throws for malformed JSON", async () => {
      await expect(fileToXD("puzzle.json", "{ not json")).rejects.toThrow(/not valid JSON/)
    })
  })

  describe("content sniffing when the extension is unknown or missing", () => {
    it("detects a .puz file from its magic bytes", async () => {
      const res = await fileToXD("mystery.dat", puzBytes)
      expect(res.format).toBe("puz")
      expect(res.xd).toBe(puzToXD(puzBytes.buffer.slice(0) as ArrayBuffer))
    })

    it("detects an Across Lite file from its banner", async () => {
      const res = await fileToXD("", acrossText)
      expect(res.format).toBe("across-lite")
    })

    it("detects an Amuse JSON from a leading brace", async () => {
      const res = await fileToXD("no-extension", amuseJSONText)
      expect(res.format).toBe("amuse")
    })

    it("detects PuzzleMe HTML from the embedded rawc field", async () => {
      const res = await fileToXD("download", puzzleMeHTML)
      expect(res.format).toBe("puzzleme-html")
    })

    it("detects Crossword Compiler XML from the rectangular-puzzle marker", async () => {
      const res = await fileToXD("mystery", crossCompilerText)
      expect(res.format).toBe("crossword-compiler-xml")
    })

    it("detects UClick XML from a generic crossword element", async () => {
      const res = await fileToXD("mystery", uclickText)
      expect(res.format).toBe("uclick-xml")
    })

    it("throws when the contents match no known format", async () => {
      await expect(fileToXD("mystery", "just some plain text, not a crossword")).rejects.toThrow(
        /Could not detect the crossword format/,
      )
    })
  })

  describe("flexible content inputs", () => {
    it("accepts a string", async () => {
      const res = await fileToXD("puzzle.jpz", jpzText)
      expect(res.xd).toBe(jpzToXD(jpzText))
    })

    it("accepts a Uint8Array", async () => {
      const res = await fileToXD("puzzle.puz", puzBytes)
      expect(res.format).toBe("puz")
    })

    it("accepts an ArrayBuffer", async () => {
      const buffer = puzBytes.buffer.slice(0) as ArrayBuffer
      const res = await fileToXD("puzzle.puz", buffer)
      expect(res.format).toBe("puz")
      expect(res.xd).toBe(puzToXD(buffer))
    })

    it("accepts a Blob", async () => {
      const blob = new Blob([puzBytes])
      const res = await fileToXD("puzzle.puz", blob)
      expect(res.format).toBe("puz")
      expect(res.xd).toBe(puzToXD(puzBytes.buffer.slice(0) as ArrayBuffer))
    })

    it("accepts a text file as a Uint8Array", async () => {
      const bytes = new TextEncoder().encode(jpzText)
      const res = await fileToXD("puzzle.jpz", bytes)
      expect(res.xd).toBe(jpzToXD(jpzText))
    })

    it("accepts a Blob for a text format", async () => {
      const blob = new Blob([jpzText])
      const res = await fileToXD("puzzle.jpz", blob)
      expect(res.xd).toBe(jpzToXD(jpzText))
    })

    it("throws for an unsupported content type", async () => {
      await expect(fileToXD("puzzle.jpz", 42 as any)).rejects.toThrow(/Unsupported content/)
    })
  })
})
