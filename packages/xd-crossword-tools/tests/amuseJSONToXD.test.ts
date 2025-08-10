import { existsSync, readFileSync } from "fs"
import { amuseToXD, convertAmuseToCrosswordJSON } from "../src/amuseJSONToXD"
import type { AmuseTopLevel } from "../src/amuseJSONToXD.types"
import { beforeAll, describe, expect, it } from "vitest"

const exampleJSONPath = "/Users/orta/dev/workshop/packages/amuse-to-xd/examples/2024_03_17-barred_cryptic.json"
const fullExamplePath = exampleJSONPath

const hasCirclesPath = "/Users/orta/dev/workshop/packages/amuse-to-xd/examples/2025_04_01-themed.json"

// Only run tests if the example JSON files exist
const shouldRunTests = existsSync(fullExamplePath) && existsSync(hasCirclesPath)

const describeConditional = shouldRunTests ? describe : describe.skip

describeConditional("amuseJSONToXD", () => {
  let amuseJSON: AmuseTopLevel
  let themedAmuseJSON: AmuseTopLevel

  beforeAll(() => {
    const jsonContent = readFileSync(fullExamplePath, "utf-8")
    amuseJSON = JSON.parse(jsonContent)

    const themedJsonContent = readFileSync(hasCirclesPath, "utf-8")
    themedAmuseJSON = JSON.parse(themedJsonContent)
  })

  describe("convertTopLevelToCrosswordJSON", () => {
    it("converts amuse JSON to CrosswordJSON format", () => {
      const result = convertAmuseToCrosswordJSON(amuseJSON)

      expect(result).toHaveProperty("meta")
      expect(result).toHaveProperty("tiles")
      expect(result).toHaveProperty("clues")
      expect(result).toHaveProperty("rebuses")
      expect(result).toHaveProperty("report")
      expect(result.report.success).toBe(true)
    })

    it("properly extracts metadata", () => {
      const result = convertAmuseToCrosswordJSON(amuseJSON)

      expect(result.meta).toHaveProperty("title")
      expect(result.meta).toHaveProperty("author")
      expect(result.meta).toHaveProperty("date")
      expect(result.meta).toHaveProperty("width")
      expect(result.meta).toHaveProperty("height")
      expect(result.meta).toHaveProperty("id")

      expect(typeof result.meta.title).toBe("string")
      expect(typeof result.meta.author).toBe("string")
      expect(typeof result.meta.width).toBe("string")
      expect(typeof result.meta.height).toBe("string")
    })

    it("creates proper grid dimensions", () => {
      const result = convertAmuseToCrosswordJSON(amuseJSON)
      const expectedWidth = parseInt(result.meta.width!)
      const expectedHeight = parseInt(result.meta.height!)

      expect(result.tiles).toHaveLength(expectedHeight)
      expect(result.tiles[0]).toHaveLength(expectedWidth)
    })

    it("converts tiles correctly", () => {
      const result = convertAmuseToCrosswordJSON(amuseJSON)

      // Check that tiles have proper structure
      for (const row of result.tiles) {
        for (const tile of row) {
          expect(tile).toHaveProperty("type")
          expect(["letter", "blank", "rebus", "schrodinger"]).toContain(tile.type)

          if (tile.type === "letter") {
            expect(tile).toHaveProperty("letter")
            expect(typeof tile.letter).toBe("string")
          }
        }
      }
    })

    it("converts clues with proper structure", () => {
      const result = convertAmuseToCrosswordJSON(amuseJSON)

      expect(result.clues).toHaveProperty("across")
      expect(result.clues).toHaveProperty("down")
      expect(Array.isArray(result.clues.across)).toBe(true)
      expect(Array.isArray(result.clues.down)).toBe(true)

      const allClues = [...result.clues.across, ...result.clues.down]

      for (const clue of allClues) {
        expect(clue).toHaveProperty("number")
        expect(clue).toHaveProperty("body")
        expect(clue).toHaveProperty("answer")
        expect(clue).toHaveProperty("direction")
        expect(clue).toHaveProperty("position")
        expect(clue).toHaveProperty("tiles")
        expect(clue).toHaveProperty("display")

        expect(typeof clue.number).toBe("number")
        expect(typeof clue.body).toBe("string")
        expect(typeof clue.answer).toBe("string")
        expect(["across", "down"]).toContain(clue.direction)
        expect(Array.isArray(clue.display)).toBe(true)
        expect(Array.isArray(clue.tiles)).toBe(true)
      }
    })

    it("strips HTML from clue text", () => {
      const result = convertAmuseToCrosswordJSON(amuseJSON)
      const allClues = [...result.clues.across, ...result.clues.down]

      for (const clue of allClues) {
        // Check that no HTML tags remain in clue body
        expect(clue.body).not.toMatch(/<[^>]*>/g)
      }
    })

    it("formats dates correctly", () => {
      const result = convertAmuseToCrosswordJSON(amuseJSON)

      if (result.meta.date) {
        // Check YYYY-MM-DD format
        expect(result.meta.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    })

    it("handles different puzzle types with warning", () => {
      // Create a mock Amuse JSON with non-crossword type
      const mockAmuseJSON: AmuseTopLevel = {
        ...amuseJSON,
        data: {
          ...amuseJSON.data,
          attributes: {
            ...amuseJSON.data.attributes,
            amuse_data: {
              ...amuseJSON.data.attributes.amuse_data,
              puzzleType: "WORD_SEARCH" as any,
            },
          },
        },
      }

      const consoleSpy = { warn: console.warn }
      console.warn = () => {}

      const result = convertAmuseToCrosswordJSON(mockAmuseJSON)
      expect(result).toHaveProperty("meta")

      console.warn = consoleSpy.warn
    })
  })

  describe("amuseToXD", () => {
    it("converts amuse JSON to XD string format", () => {
      const result = amuseToXD(amuseJSON)

      expect(typeof result).toBe("string")
      expect(result).toContain("title:")
      expect(result).toContain("author:")
      expect(result).toContain("## Grid")
      expect(result).toContain("## Clues")
      expect(result).toContain("## Metadata")
    })

    it("produces valid XD format with required sections", () => {
      const result = amuseToXD(amuseJSON)
      const lines = result.split("\n")

      // Check for required XD sections
      const hasGrid = lines.some((line) => line.trim() === "## Grid")
      const hasClues = lines.some((line) => line.trim() === "## Clues")
      const hasMetadata = lines.some((line) => line.trim() === "## Metadata")

      expect(hasGrid).toBe(true)
      expect(hasClues).toBe(true)
      expect(hasMetadata).toBe(true)
    })

    it("includes clues in proper XD format", () => {
      const result = amuseToXD(amuseJSON)

      // Should contain clue format: A1. Clue text ~ ANSWER
      expect(result).toMatch(/A\d+\.\s.+\s~\s[A-Z]+/m)
      // Should contain down clues: D1. Clue text ~ ANSWER
      expect(result).toMatch(/D\d+\.\s.+\s~\s[A-Z]+/m)
    })

    it("includes design section with bars from real data", () => {
      const result = amuseToXD(amuseJSON)

      // Check that design section exists
      expect(result).toContain("## Design")
      expect(result).toContain("<style>")
      expect(result).toContain("</style>")

      // Check for bar styles
      expect(result).toMatch(/bar-left.*true/m)
      expect(result).toMatch(/bar-top.*true/m)

      // The design grid should have letter markers for barred cells
      const designSection = result.split("## Design")[1]
      expect(designSection).toBeDefined()

      // Should have style definitions
      expect(designSection).toContain("{ bar-")
    })
  })

  describe("edge cases and error handling", () => {
    it("handles missing optional fields gracefully", () => {
      // Create a modified version of the real JSON with some optional fields removed
      const minimalAmuseJSON: AmuseTopLevel = {
        ...amuseJSON,
        data: {
          ...amuseJSON.data,
          attributes: {
            ...amuseJSON.data.attributes,
            amuse_data: {
              ...amuseJSON.data.attributes.amuse_data,
              // Remove optional fields
              cellInfos: undefined, // Remove cell info (bars and circles)
              subtitle: "",
              authorURL: "",
              authorEmail: "",
              description: "",
              attributions: "",
              pauseMessage: "",
              endMessage: "",
              help: "",
            },
          },
        },
      }

      expect(() => convertAmuseToCrosswordJSON(minimalAmuseJSON)).not.toThrow()
      const result = convertAmuseToCrosswordJSON(minimalAmuseJSON)

      // Should still have basic metadata
      expect(result.meta.title).toBeTruthy()
      expect(result.meta.author).toBeTruthy()

      // Should not have design section since cellInfos is removed
      expect(result.design).toBeUndefined()

      // Date should still exist from the original data
      expect(result.meta.date).toBeTruthy()

      // Should still convert successfully
      expect(result.report.success).toBe(true)
      expect(result.tiles.length).toBeGreaterThan(0)
      expect(result.clues.across.length).toBeGreaterThan(0)
    })

    it("handles empty clue text", () => {
      const amuseWithEmptyClue = {
        ...amuseJSON,
        data: {
          ...amuseJSON.data,
          attributes: {
            ...amuseJSON.data.attributes,
            amuse_data: {
              ...amuseJSON.data.attributes.amuse_data,
              placedWords: [
                {
                  ...amuseJSON.data.attributes.amuse_data.placedWords[0],
                  clue: {
                    clue: "",
                  },
                },
              ],
            },
          },
        },
      }

      const result = convertAmuseToCrosswordJSON(amuseWithEmptyClue)
      expect(result.clues.across[0]?.body).toBe("")
    })

    it("converts circled cells to design section", () => {
      // Use the real themed JSON file that has circled cells
      const result = convertAmuseToCrosswordJSON(themedAmuseJSON)

      // Check that design section exists
      expect(result.design).toBeDefined()
      expect(result.design?.styles).toBeDefined()

      // Should have circle style
      expect(result.design?.styles["O"]).toEqual({ background: "circle" })

      // Check that we have circled positions marked with "O"
      const positions = result.design?.positions || []
      expect(positions.length).toBe(15) // Height is 15 in the themed data
      expect(positions[0].length).toBe(15) // Width is 15 in the themed data

      // Find cells with circles (positions marked as "O")
      let circledCellCount = 0
      for (const row of positions) {
        for (const cell of row) {
          if (cell === "O") {
            circledCellCount++
          }
        }
      }

      // The themed puzzle should have multiple circled cells
      expect(circledCellCount).toBeGreaterThan(0)
    })

    it("converts refText to revealer metadata", () => {
      // Use the barred cryptic JSON file which has refText entries
      const result = convertAmuseToCrosswordJSON(amuseJSON)

      // Find clues that should have revealer metadata
      const allClues = [...result.clues.across, ...result.clues.down]
      const cluesWithRevealers = allClues.filter(clue => clue.metadata?.revealer)

      // The barred cryptic puzzle should have some clues with refText
      expect(cluesWithRevealers.length).toBeGreaterThan(0)

      // Check that revealer metadata is properly set
      for (const clue of cluesWithRevealers) {
        expect(clue.metadata?.revealer).toBeDefined()
        expect(typeof clue.metadata.revealer).toBe("string")
        expect(clue.metadata.revealer.length).toBeGreaterThan(0)
      }

      // Check a specific example (first clue with revealer)
      const firstClueWithRevealer = cluesWithRevealers[0]
      expect(firstClueWithRevealer.metadata?.revealer).toContain("SCAB")
    })

    it("includes revealer metadata in XD output", () => {
      // Use the barred cryptic JSON file which has refText entries
      const xdOutput = amuseToXD(amuseJSON)

      // Check that XD output contains revealer metadata
      expect(xdOutput).toContain("revealer:")
      
      // Should contain the specific revealer content from refText
      expect(xdOutput).toContain("SCAB + BARD")
    })

    it("converts barred grids correctly", () => {
      // The real JSON file has bars, so we can use it directly
      const result = convertAmuseToCrosswordJSON(amuseJSON)

      // Check that design section exists (since the real data has bars)
      expect(result.design).toBeDefined()

      // Check that we have bar styles
      const styles = result.design?.styles || {}
      const hasBarLeft = Object.values(styles).some((style) => style["bar-left"] === "true")
      const hasBarTop = Object.values(styles).some((style) => style["bar-top"] === "true")

      expect(hasBarLeft).toBe(true)
      expect(hasBarTop).toBe(true)

      // The real data should have multiple bar combinations
      const styleCount = Object.keys(styles).length
      expect(styleCount).toBeGreaterThan(1) // Should have at least 2 different styles

      // Check that positions are filled with style letters
      const positions = result.design?.positions || []
      expect(positions.length).toBe(10) // Height is 10 in the real data
      expect(positions[0].length).toBe(8) // Width is 8 in the real data

      // Find cells with bars (non-null, non-undefined positions)
      let cellsWithBars = 0
      for (const row of positions) {
        for (const cell of row) {
          if (cell && styles[cell]) {
            cellsWithBars++
          }
        }
      }

      // The real barred grid should have many cells with bars
      expect(cellsWithBars).toBeGreaterThan(10)

      // Verify that all used letters in positions have corresponding styles
      const usedLetters = new Set<string>()
      for (const row of positions) {
        for (const cell of row) {
          if (cell) usedLetters.add(cell)
        }
      }

      for (const letter of usedLetters) {
        expect(styles[letter]).toBeDefined()
      }
    })

    it("generates a valid xd file from barred cells", () => {
      const xdOutput = amuseToXD(amuseJSON)

      // Check that XD output contains design section
      expect("## Design" + xdOutput.split("## Design")[1]).toMatchInlineSnapshot(`
            "## Design

            <style>
            A { bar-top: true }
            B { bar-left: true; bar-top: true }
            C { bar-left: true }
            </style>

            ........
            ..A.B.A.
            ..A...A.
            .CBCCCBC
            ........
            A......A
            .CCCCCCC
            .A...A..
            .A..CA..
            .A.A.A..
            "
          `)
    })

    it("generates correct XD output with circled cells", () => {
      // Use the real themed JSON file
      const xdOutput = amuseToXD(themedAmuseJSON)

      // Check that XD output contains design section
      expect(xdOutput).toContain("## Design")
      expect(xdOutput).toContain("<style>")
      expect(xdOutput).toContain("O { background: circle }")
      expect(xdOutput).toContain("</style>")

      // The design grid should have O characters for circled cells
      const designSection = xdOutput.split("## Design")[1]
      expect(designSection).toBeDefined()
      expect(designSection).toContain("O")
    })
  })
})

// If the test files don't exist, provide a helpful message
if (!shouldRunTests) {
  describe("amuseJSONToXD (skipped)", () => {
    it(`skips tests because required files don't exist at: ${exampleJSONPath} or ${hasCirclesPath}`, () => {
      expect(true).toBe(true) // Placeholder test to avoid empty describe block
    })
  })
}
