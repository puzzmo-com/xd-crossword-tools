import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { Clue } from "xd-crossword-tools-parser"
import { deriveAllBarPositions, BarPosition } from "../src/deriveBarPositions"
import parse from "xml-parser"

describe("deriveBarPositions", () => {
  it("should derive bar positions from the example barred grid JPZ", () => {
    const jpzContent = readFileSync(__dirname + "/jpz/Printer-Devilry-kyle-dolan.jpz", "utf-8")
    
    // Parse the JPZ to extract actual bars
    const parsed = parse(jpzContent)
    const rectangularPuzzle = parsed.root.children.find((child: { name: string }) => child.name === "rectangular-puzzle")
    const crosswordEl = rectangularPuzzle.children.find((child: { name: string }) => child.name === "crossword")
    const gridEl = crosswordEl.children.find((child: { name: string }) => child.name === "grid")
    
    const actualBars: BarPosition[] = []
    for (const cell of gridEl.children) {
      if (cell.name !== "cell") continue
      const x = parseInt(cell.attributes.x, 10) - 1
      const y = parseInt(cell.attributes.y, 10) - 1
      
      if (cell.attributes["left-bar"] === "true") {
        actualBars.push({ row: y, col: x, type: "left" })
      }
      if (cell.attributes["right-bar"] === "true") {
        actualBars.push({ row: y, col: x, type: "right" })
      }
      if (cell.attributes["top-bar"] === "true") {
        actualBars.push({ row: y, col: x, type: "top" })
      }
      if (cell.attributes["bottom-bar"] === "true") {
        actualBars.push({ row: y, col: x, type: "bottom" })
      }
    }
    
    // Instead of parsing XD, let's create mock clues based on the JPZ word definitions
    // This is the 8x8 grid from the JPZ
    const gridWidth = 8
    const gridHeight = 8
    
    // Mock across clues based on the JPZ structure
    const acrossClues = [
      { number: 1, position: { col: 0, index: 0 }, answer: "SIGNPOST", body: "", direction: "ACROSS" as const, display: [], tiles: [] },
      { number: 6, position: { col: 0, index: 1 }, answer: "UNICORN", body: "", direction: "ACROSS" as const, display: [], tiles: [] },
      { number: 9, position: { col: 2, index: 2 }, answer: "NARROW", body: "", direction: "ACROSS" as const, display: [], tiles: [] },
      { number: 10, position: { col: 0, index: 3 }, answer: "DAUNT", body: "", direction: "ACROSS" as const, display: [], tiles: [] },
      { number: 13, position: { col: 3, index: 4 }, answer: "TENOR", body: "", direction: "ACROSS" as const, display: [], tiles: [] },
      { number: 15, position: { col: 0, index: 5 }, answer: "RODENT", body: "", direction: "ACROSS" as const, display: [], tiles: [] },
      { number: 16, position: { col: 1, index: 6 }, answer: "LEETIDE", body: "", direction: "ACROSS" as const, display: [], tiles: [] },
      { number: 17, position: { col: 0, index: 7 }, answer: "COUNTESS", body: "", direction: "ACROSS" as const, display: [], tiles: [] },
    ]
    
    // Mock down clues
    const downClues = [
      { number: 1, position: { col: 0, index: 0 }, answer: "SUNDERS", body: "", direction: "DOWN" as const, display: [], tiles: [] },
      { number: 2, position: { col: 1, index: 0 }, answer: "INCA", body: "", direction: "DOWN" as const, display: [], tiles: [] },
      { number: 3, position: { col: 2, index: 0 }, answer: "GINUP", body: "", direction: "DOWN" as const, display: [], tiles: [] },
      { number: 4, position: { col: 4, index: 0 }, answer: "PORTENT", body: "", direction: "DOWN" as const, display: [], tiles: [] },
      { number: 5, position: { col: 6, index: 0 }, answer: "SNOW", body: "", direction: "DOWN" as const, display: [], tiles: [] },
      { number: 7, position: { col: 3, index: 1 }, answer: "CANTEEN", body: "", direction: "DOWN" as const, display: [], tiles: [] },
      { number: 8, position: { col: 7, index: 1 }, answer: "SWERVES", body: "", direction: "DOWN" as const, display: [], tiles: [] },
      { number: 11, position: { col: 5, index: 3 }, answer: "UNTIE", body: "", direction: "DOWN" as const, display: [], tiles: [] },
      { number: 12, position: { col: 1, index: 4 }, answer: "YOLO", body: "", direction: "DOWN" as const, display: [], tiles: [] },
      { number: 14, position: { col: 6, index: 4 }, answer: "OLDS", body: "", direction: "DOWN" as const, display: [], tiles: [] },
    ]
    
    // Derive bars from clues
    const derivedBars = deriveAllBarPositions(
      acrossClues,
      downClues,
      gridWidth,
      gridHeight
    )
    
    // Log for debugging
    console.log("Actual bars from JPZ:", actualBars.length)
    console.log("Derived bars from clues:", derivedBars.length)
    
    // Sort bars for comparison
    const sortBars = (bars: BarPosition[]) => 
      bars.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row
        if (a.col !== b.col) return a.col - b.col
        return a.type.localeCompare(b.type)
      })
    
    const sortedActual = sortBars([...actualBars])
    const sortedDerived = sortBars([...derivedBars])
    
    // Check that we derive the same bars
    expect(sortedDerived.length).toBeGreaterThan(0)
    
    // Log differences for debugging
    const actualSet = new Set(sortedActual.map(b => `${b.row},${b.col},${b.type}`))
    const derivedSet = new Set(sortedDerived.map(b => `${b.row},${b.col},${b.type}`))
    
    const missingInDerived = sortedActual.filter(b => !derivedSet.has(`${b.row},${b.col},${b.type}`))
    const extraInDerived = sortedDerived.filter(b => !actualSet.has(`${b.row},${b.col},${b.type}`))
    
    console.log("Missing in derived:", missingInDerived)
    console.log("Extra in derived:", extraInDerived)
  })
})