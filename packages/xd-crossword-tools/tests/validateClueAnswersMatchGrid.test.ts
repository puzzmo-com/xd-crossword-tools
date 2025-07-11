import { describe, it, expect } from "vitest"
import { xdToJSON } from "xd-crossword-tools-parser"
import { validateClueAnswersMatchGrid } from "../src/validateClueAnswersMatchGrid"

describe("validateClueAnswersMatchGrid", () => {
  it("should return no errors when clues match grid", () => {
    const xd = `## Metadata

Title: Test
Author: Test Author
Date: 2024-01-01

## Grid

CAB
ATE
TED

## Clues

A1. Taxi ~ CAB
A4. Consumed ~ ATE
A5. Abbreviation for technology ~ TED

D1. Feline ~ CAT
D2. Consumed ~ ATE
D3. Place to sleep ~ BED`

    const json = xdToJSON(xd)
    const reports = validateClueAnswersMatchGrid(json)
    expect(reports).toHaveLength(0)
  })

  it("should detect mismatched answers", () => {
    const xd = `## Metadata

Title: Test
Author: Test Author
Date: 2024-01-01

## Grid

CAB
ATE
TED

## Clues

A1. Taxi ~ DOG
A4. Consumed ~ ATE
A5. Abbreviation for technology ~ TED

D1. Feline ~ CAT
D2. Consumed ~ ATE
D3. Place to sleep ~ BED`

    const json = xdToJSON(xd)
    const reports = validateClueAnswersMatchGrid(json)

    expect(reports).toHaveLength(1)
    expect(reports[0]).toMatchObject({
      type: "clue_grid_mismatch",
      clueNumber: 1,
      direction: "across",
      expectedAnswer: "DOG",
      actualAnswer: "CAB",
      message: 'Clue ACROSS1 answer doesn\'t match grid: expected "DOG" but grid has "CAB"',
    })
  })

  it("should detect multiple mismatches", () => {
    const xd = `## Metadata

Title: Test
Author: Test Author
Date: 2024-01-01

## Grid

CAB
ATE
TED

## Clues

A1. Taxi ~ DOG
A4. Consumed ~ WAS
A5. Abbreviation for technology ~ COT

D1. Feline ~ TAX
D2. Consumed ~ EAT  
D3. Place to sleep ~ ABC`

    const json = xdToJSON(xd)
    const reports = validateClueAnswersMatchGrid(json)

    expect(reports).toHaveLength(6) // 3 across + 3 down mismatches

    // Check a few specific ones
    const across1 = reports.find((r) => r.direction === "across" && r.clueNumber === 1)
    expect(across1).toMatchObject({
      expectedAnswer: "DOG",
      actualAnswer: "CAB",
    })

    const down1 = reports.find((r) => r.direction === "down" && r.clueNumber === 1)
    expect(down1).toMatchObject({
      expectedAnswer: "TAX",
      actualAnswer: "CAT",
    })
  })

  it("should handle empty grids gracefully", () => {
    const xd = `## Metadata

Title: Empty Test
Author: Test Author
Date: 2024-01-01

## Grid

###
###
###

## Clues

`

    const json = xdToJSON(xd)
    const reports = validateClueAnswersMatchGrid(json)
    expect(reports).toHaveLength(0)
  })
})
