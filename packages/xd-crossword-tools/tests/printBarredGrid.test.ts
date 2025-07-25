import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import parse from "xml-parser"
import { BarPosition } from "../src/deriveBarPositions"
import { printBarredGrid, addBarsToTiles } from "../src/printBarredGrid"
import { Tile } from "xd-crossword-tools-parser"

describe("printBarredGrid", () => {
  it("should print the example barred grid with box drawing characters", () => {
    const jpzContent = readFileSync(__dirname + "/jpz/Printer-Devilry-kyle-dolan.jpz", "utf-8")
    
    // Parse the JPZ to extract grid and bars
    const parsed = parse(jpzContent)
    const rectangularPuzzle = parsed.root.children.find((child: { name: string }) => child.name === "rectangular-puzzle")
    const crosswordEl = rectangularPuzzle.children.find((child: { name: string }) => child.name === "crossword")
    const gridEl = crosswordEl.children.find((child: { name: string }) => child.name === "grid")
    
    const gridWidth = parseInt(gridEl.attributes.width, 10)
    const gridHeight = parseInt(gridEl.attributes.height, 10)
    const tiles: Tile[][] = Array.from({ length: gridHeight }, () => Array(gridWidth).fill({ type: "blank" }))
    const bars: BarPosition[] = []
    
    for (const cell of gridEl.children) {
      if (cell.name !== "cell") continue
      const x = parseInt(cell.attributes.x, 10) - 1
      const y = parseInt(cell.attributes.y, 10) - 1
      
      tiles[y][x] = {
        type: "letter",
        letter: cell.attributes.solution || "?"
      }
      
      if (cell.attributes["left-bar"] === "true") {
        bars.push({ row: y, col: x, type: "left" })
      }
      if (cell.attributes["right-bar"] === "true") {
        bars.push({ row: y, col: x, type: "right" })
      }
      if (cell.attributes["top-bar"] === "true") {
        bars.push({ row: y, col: x, type: "top" })
      }
      if (cell.attributes["bottom-bar"] === "true") {
        bars.push({ row: y, col: x, type: "bottom" })
      }
    }
    
    // Add bars to tiles
    const tilesWithBars = addBarsToTiles(tiles, bars)
    
    // Print the grid
    const output = printBarredGrid(tilesWithBars)
    console.log("\nBarred grid visualization:")
    console.log(output)
    
    // Check that output contains expected characters
    expect(output).toContain("│")
    expect(output).toContain("─")
    expect(output).toContain("S  I  G  N  P  O  S  T")
  })
  
  it("should handle a simple example grid", () => {
    // Create a simple 4x4 grid
    const tiles: Tile[][] = [
      [{ type: "letter", letter: "A" }, { type: "letter", letter: "B" }, { type: "letter", letter: "C" }, { type: "letter", letter: "D" }],
      [{ type: "letter", letter: "E" }, { type: "letter", letter: "F" }, { type: "letter", letter: "G" }, { type: "letter", letter: "H" }],
      [{ type: "letter", letter: "I" }, { type: "letter", letter: "J" }, { type: "letter", letter: "K" }, { type: "letter", letter: "L" }],
      [{ type: "letter", letter: "M" }, { type: "letter", letter: "N" }, { type: "letter", letter: "O" }, { type: "letter", letter: "P" }],
    ]
    
    // Add some bars
    const bars: BarPosition[] = [
      { row: 0, col: 1, type: "right" },
      { row: 1, col: 1, type: "right" },
      { row: 1, col: 1, type: "bottom" },
      { row: 2, col: 1, type: "top" },
      { row: 2, col: 2, type: "left" },
    ]
    
    const tilesWithBars = addBarsToTiles(tiles, bars)
    const output = printBarredGrid(tilesWithBars)
    
    console.log("\nSimple example:")
    console.log(output)
    
    // Should show vertical bar after B and horizontal bar under F
    expect(output).toContain("B│")
    expect(output).toContain("F│")
    expect(output).toContain("─")
  })
})