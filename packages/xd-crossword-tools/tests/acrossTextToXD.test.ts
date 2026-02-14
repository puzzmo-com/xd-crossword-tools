import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"
import { acrossTextToXD } from "../src/acrossTextToXD"

describe("acrossTextToXD", () => {
  it("should parse v1 simple puzzle", () => {
    const input = readFileSync(resolve(__dirname, "./across/v1-simple.puz.txt"), "utf8")
    const result = acrossTextToXD(input)

    // Check that it contains expected metadata
    expect(result).toContain("title: Across Test")
    expect(result).toContain("author: madebygare")
    expect(result).toContain("copyright: 2026 Puzzmo")

    // Check that it contains grid section
    expect(result).toContain("## Grid")

    // Check that it contains clues
    expect(result).toContain("## Clues")
    expect(result).toContain("A1. Used to make a square black in Ingrid. ~ DOT")
    expect(result).toContain("D1. Something you don't want on your new car. ~ DENT")

    // Check that it contains notepad
    expect(result).toContain("## Notes")
    expect(result).toContain("This is a simple test puzzle")

    // Snapshot test
    expect(result).toMatchSnapshot()
  })

  it("should parse v2 puzzle with rebus", () => {
    const input = readFileSync(resolve(__dirname, "./across/v2-rebus.puz.txt"), "utf8")
    const result = acrossTextToXD(input)

    // Check for rebus metadata
    expect(result).toContain("rebus:")
    expect(result).toContain("EEE")
    expect(result).toContain("OOO")

    // Check that rebus symbols are in the grid
    expect(result).toContain("❶")
    expect(result).toContain("❷")

    // Snapshot test
    expect(result).toMatchSnapshot()
  })

  it("should parse v2 puzzle with MARK flag (circled cells)", () => {
    const input = readFileSync(resolve(__dirname, "./across/v2-with-mark.puz.txt"), "utf8")
    const result = acrossTextToXD(input)

    // Check for design section with circles
    expect(result).toContain("## Design")
    expect(result).toContain("O { background: circle }")

    // Snapshot test
    expect(result).toMatchSnapshot()
  })

  it("should handle files with carriage return line endings", () => {
    // Create a test string with CR line endings
    const input = readFileSync(resolve(__dirname, "./across/v1-simple.puz.txt"), "utf8").replace(/\n/g, "\r")
    const result = acrossTextToXD(input)

    // Should successfully parse despite CR line endings
    // Check that it contains expected metadata
    expect(result).toContain("title: Across Test")
    expect(result).toContain("author: madebygare")
    expect(result).toContain("copyright: 2026 Puzzmo")

    // Check that it contains grid section
    expect(result).toContain("## Grid")
    expect(result).toContain("## Clues")

    // Snapshot test
    expect(result).toMatchSnapshot()
  })
})
