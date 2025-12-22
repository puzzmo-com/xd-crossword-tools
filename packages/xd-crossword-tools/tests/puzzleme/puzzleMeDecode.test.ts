import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { decodePuzzleMeHTML, decodePuzzleMeRawc, extractPuzzleMeRawc } from "../../src/puzzleMeDecode"
import { amuseToXD } from "../../src/amuseJSONToXD"

describe("puzzleMeDecode", () => {
  const html = readFileSync(join(__dirname, "team_bakery.html"), "utf-8")

  it("extracts rawc from HTML", () => {
    const rawc = extractPuzzleMeRawc(html)
    expect(rawc).toBeDefined()
    expect(rawc.length).toBeGreaterThan(1000)
  })

  it("decodes rawc to puzzle data", () => {
    const rawc = extractPuzzleMeRawc(html)
    const puzzleData = decodePuzzleMeRawc(rawc)

    console.log("\n=== DECODED PUZZLE DATA ===")
    console.log("Title:", puzzleData.title)
    console.log("Author:", puzzleData.author)
    console.log("Grid size:", puzzleData.w, "x", puzzleData.h)
    console.log("\n=== BOX (grid letters) ===")
    console.log("box dimensions:", puzzleData.box.length, "x", puzzleData.box[0]?.length)
    console.log("First 5 rows of box (raw):")
    for (let i = 0; i < Math.min(5, puzzleData.box.length); i++) {
      console.log(
        `  Row ${i}:`,
        puzzleData.box[i]
          ?.slice(0, 10)
          .map((c) => {
            const val = c as string | null
            if (val === null) return "null"
            if (val === "\u0000") return "\\0"
            if (val === "") return '""'
            if (val === "-") return "-"
            return val
          })
          .join(" ")
      )
    }

    // Check what unique values exist in box
    const allCells = puzzleData.box.flat() as (string | null)[]
    const uniqueNonLetters = [...new Set(allCells.filter((c) => !c || c.length !== 1 || !/[A-Z]/.test(c)))]
    console.log("\nNon-letter cell values:", uniqueNonLetters.map((c) => JSON.stringify(c)))

    console.log("\n=== CLUE NUMS ===")
    console.log("clueNums dimensions:", puzzleData.clueNums.length, "x", puzzleData.clueNums[0]?.length)
    console.log("First 5 rows of clueNums:")
    for (let i = 0; i < Math.min(5, puzzleData.clueNums.length); i++) {
      console.log(
        `  Row ${i}:`,
        puzzleData.clueNums[i]
          ?.slice(0, 10)
          .map((c) => c || ".")
          .join(" ")
      )
    }

    console.log("\n=== FIRST 10 PLACED WORDS ===")
    puzzleData.placedWords.slice(0, 10).forEach((pw, i) => {
      console.log(
        `  ${i + 1}. ${pw.clueNum}${pw.acrossNotDown ? "A" : "D"} @ (${pw.x}, ${pw.y}): ${
          pw.word || pw.originalTerm
        } - "${pw.clue.clue.substring(0, 50)}..."`
      )
    })

    expect(puzzleData.title).toBe("Annie's Crust-Word")
    expect(puzzleData.author).toBe("Gemma Maslen")
    expect(puzzleData.w).toBe(25)
    expect(puzzleData.h).toBe(25)
  })

  it("converts to AmuseTopLevel and then to XD", () => {
    const amuseData = decodePuzzleMeHTML(html)
    const xd = amuseToXD(amuseData)

    console.log("\n=== XD OUTPUT (first 2000 chars) ===")
    console.log(xd.substring(0, 2000))

    expect(xd).toContain("title: Annie's Crust-Word")
    expect(xd).toContain("author: Gemma Maslen")
  })
})
