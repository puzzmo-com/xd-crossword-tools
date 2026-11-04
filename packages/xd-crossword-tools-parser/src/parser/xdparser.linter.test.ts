import { xdToJSON } from "./xdToJSON"
import { readFileSync } from "fs"

it("lints for words being included in the answer", () => {
  const xd = readFileSync("./packages/xd-crossword-tools/tests/puz/alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. ahab of the Pequod ~ AHAB"

  const json = xdToJSON(xd.replace(originalClue, newMDClue), true, true)

  expect(json.report.success).toBeTruthy()
  expect(json.report.warnings).toMatchInlineSnapshot(`[]`)
})

it("lints to note that you should have a colon in the hint for multi-word answers", () => {
  const xd = readFileSync("./packages/xd-crossword-tools/tests/puz/alpha-bits.xd", "utf8")

  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. Captain of the Pequod ~ AH|AB\nA1 ^Hint: Turned on to illuminate a room."

  const originalMeta = "Description: N/A"
  const newMeta = "Description: N/A\nsplitcharacter: |"

  const json = xdToJSON(xd.replace(originalClue, newMDClue).replace(originalMeta, newMeta), true, true)

  expect(json.report.success).toBeTruthy()
  expect(json.report.warnings).toMatchInlineSnapshot(`[]`)
})

describe("emoji in cells", () => {
  const emojiXD = (grid: string, start = "....", rebus = "") => `## Metadata

title: Emoji
author: Steve
${rebus}

## Grid

${grid}

## Clues

A1. Light ~ BULB

## Start

${start}
`

  const errorsFor = (xd: string) => xdToJSON(xd, true).report.errors.map(({ message, position, length }) => ({ message, position, length }))

  it("errors on a multi-code-point emoji typed straight into the Grid", () => {
    expect(errorsFor(emojiXD("B🏖️LB"))).toMatchInlineSnapshot(`
      [
        {
          "length": 3,
          "message": "'🏖️' is made of more than one character, so the Grid would split it across cells. Declare it as a rebus instead, e.g. 'rebus: 1=🏖️', and use '1' in the Grid and Start",
          "position": {
            "col": 1,
            "index": 8,
          },
        },
      ]
    `)
  })

  it("errors on a multi-code-point emoji typed straight into Start", () => {
    expect(errorsFor(emojiXD("B1LB", ".🏖️..", "rebus: 1=🏖️"))).toMatchInlineSnapshot(`
      [
        {
          "length": 3,
          "message": "'🏖️' is made of more than one character, so the Start would split it across cells. Declare it as a rebus instead, e.g. 'rebus: 1=🏖️', and use '1' in the Grid and Start",
          "position": {
            "col": 1,
            "index": 16,
          },
        },
      ]
    `)
  })

  it("flags skin tones, ZWJ sequences, flags and keycaps", () => {
    const messages = errorsFor(emojiXD("👍🏽👨‍👩‍👧🇺🇸1️⃣")).map((e) => e.message.split("'")[1])
    expect(messages).toEqual(["👍🏽", "👨‍👩‍👧", "🇺🇸", "1️⃣"])
  })

  it("allows single-code-point emoji and emoji declared as a rebus", () => {
    expect(errorsFor(emojiXD("B🔑LB"))).toEqual([])
    expect(errorsFor(emojiXD("B1LB", ".1..", "rebus: 1=🏖️"))).toEqual([])
  })

  it("only lints in strict mode", () => {
    expect(xdToJSON(emojiXD("B🏖️LB")).report.errors).toEqual([])
  })
})
