import { xdMarkupProcessor, xdMarkupSerializer, xdToJSON } from "./xdparser2"
import { readFileSync } from "fs"
import { it, expect, describe } from "vitest"
import type { ClueComponentMarkup } from "../types"

/** Helper: wrap plain text content as children for non-nested markup */
const t = (s: string): ClueComponentMarkup[] => [["text", s]]

it("handles bolding", () => {
  const xd = readFileSync("./packages/xd-crossword-tools-parser/src/parser/outputs/explicit-alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. {/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here|https://mylink.com@} ~ AHAB"

  const json = xdToJSON(xd.replace(originalClue, newMDClue))
  const clue = json.clues.across[0]
  expect(clue.body).toBe("{/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here|https://mylink.com@}")
  expect(clue.display).toEqual([
    ["italics", "Captain", t("Captain")],
    ["text", ", "],
    ["bold", "of", t("of")],
    ["text", ", "],
    ["underscore", "the", t("the")],
    ["text", ", ship "],
    ["strike", "pequod", t("pequod")],
    ["text", " "],
    ["link", "see here", "https://mylink.com", t("see here")],
  ])

  expect(clue.number).toBe(1)
  expect(clue.answer).toBe("AHAB")
  expect(clue.position).toEqual({ col: 0, index: 0 })
})

it("correctly handles xd-spec syntax", () => {
  const parsed = xdMarkupProcessor("{/Italic/}, {_bold_}, {_underscore_}, or {-strike-thru-}")
  expect(parsed).toEqual([
    ["italics", "Italic", t("Italic")],
    ["text", ", "],
    ["underscore", "bold", t("bold")],
    ["text", ", "],
    ["underscore", "underscore", t("underscore")],
    ["text", ", or "],
    ["strike", "strike-thru", t("strike-thru")],
  ])
})

it("correctly handles a URL", () => {
  const parsed = xdMarkupProcessor("I think {@you should read|https://github.com@} more")
  expect(parsed).toEqual([
    ["text", "I think "],
    ["link", "you should read", "https://github.com", t("you should read")],
    ["text", " more"],
  ])
})

it("handles inline images", () => {
  const xd = readFileSync("./packages/xd-crossword-tools-parser/src/parser/outputs/explicit-alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. {!![https://emojipedia.org/image/y.png|alt text]!} block with alt text ~ AHAB"

  const json = xdToJSON(xd.replace(originalClue, newMDClue))
  const clue = json.clues.across[0]
  expect(clue.body).toBe("{!![https://emojipedia.org/image/y.png|alt text]!} block with alt text")
  expect(clue.display).toEqual([
    ["img", "https://emojipedia.org/image/y.png", "alt text", true],
    ["text", " block with alt text"],
  ])
  expect(clue.number).toBe(1)
  expect(clue.answer).toBe("AHAB")
  expect(clue.position).toEqual({ col: 0, index: 0 })
})

it("correctly inline images in markup", () => {
  expect(xdMarkupProcessor("{![https://emojipedia.org/image/y.png|alt text]!}")).toEqual([
    ["img", "https://emojipedia.org/image/y.png", "alt text", false],
  ])
})

it("correctly handles ~ for subscript", () => {
  expect(xdMarkupProcessor("H{~2~}O is water")).toEqual([
    ["text", "H"],
    ["subscript", "2", t("2")],
    ["text", "O is water"],
  ])
})

it("correctly handles ^ for superscript", () => {
  expect(xdMarkupProcessor("E=mc{^2^} is famous")).toEqual([
    ["text", "E=mc"],
    ["superscript", "2", t("2")],
    ["text", " is famous"],
  ])
})

it("correctly handles = for small caps", () => {
  expect(xdMarkupProcessor("The word {=hello=} in small caps")).toEqual([
    ["text", "The word "],
    ["smallcaps", "hello", t("hello")],
    ["text", " in small caps"],
  ])
})

it("correctly handles - for strike", () => {
  expect(xdMarkupProcessor("I {-think-}, no.. I know")).toEqual([
    ["text", "I "],
    ["strike", "think", t("think")],
    ["text", ", no.. I know"],
  ])
})

it("correctly handles inline colors", () => {
  expect(xdMarkupProcessor("This text is {#red|#ff0000|#cc0000#} and this is {#blue|#0000ff|#0000cc#}")).toEqual([
    ["text", "This text is "],
    ["color", "red", "#ff0000", "#cc0000", t("red")],
    ["text", " and this is "],
    ["color", "blue", "#0000ff", "#0000cc", t("blue")],
  ])
})

it("handles malformed color syntax gracefully", () => {
  expect(xdMarkupProcessor("This {#malformed#} color will be treated as text")).toEqual([
    ["text", "This "],
    ["text", "{#malformed#}"],
    ["text", " color will be treated as text"],
  ])
})

it("correctly handles inline images with width and height", () => {
  expect(xdMarkupProcessor("{![https://example.com/image.png|alt text|100|200]!}")).toEqual([
    ["img", "https://example.com/image.png", "alt text", false, "100", "200"],
  ])
})

it("correctly handles block images with width and height", () => {
  expect(xdMarkupProcessor("{!![https://example.com/image.png|alt text|300|400]!}")).toEqual([
    ["img", "https://example.com/image.png", "alt text", true, "300", "400"],
  ])
})

it("correctly handles images with only width", () => {
  expect(xdMarkupProcessor("{![https://example.com/image.png|alt text|150]!}")).toEqual([
    ["img", "https://example.com/image.png", "alt text", false, "150"],
  ])
})

it("correctly handles images without width and height", () => {
  expect(xdMarkupProcessor("{![https://example.com/image.png|alt text]!}")).toEqual([
    ["img", "https://example.com/image.png", "alt text", false],
  ])
})

// --- Nested markup tests ---

describe("nested markup", () => {
  it("handles bold wrapping italics", () => {
    expect(xdMarkupProcessor("{*{/bold italic/}*}")).toEqual([["bold", "{/bold italic/}", [["italics", "bold italic", t("bold italic")]]]])
  })

  it("handles mixed nested content", () => {
    expect(xdMarkupProcessor("{*bold {/and italic/} text*}")).toEqual([
      [
        "bold",
        "bold {/and italic/} text",
        [
          ["text", "bold "],
          ["italics", "and italic", t("and italic")],
          ["text", " text"],
        ],
      ],
    ])
  })

  it("handles nested markup inside link text", () => {
    expect(xdMarkupProcessor("{@{*bold link*}|https://example.com@}")).toEqual([
      ["link", "{*bold link*}", "https://example.com", [["bold", "bold link", t("bold link")]]],
    ])
  })

  it("handles nested markup inside color text", () => {
    expect(xdMarkupProcessor("{#{*bold*} text|#fff|#000#}")).toEqual([
      [
        "color",
        "{*bold*} text",
        "#fff",
        "#000",
        [
          ["bold", "bold", t("bold")],
          ["text", " text"],
        ],
      ],
    ])
  })

  it("handles three levels of nesting", () => {
    expect(xdMarkupProcessor("{*{/{_deep_}/}*}")).toEqual([
      ["bold", "{/{_deep_}/}", [["italics", "{_deep_}", [["underscore", "deep", t("deep")]]]]],
    ])
  })
})

// --- Serializer tests ---

describe("xdMarkupSerializer", () => {
  it("serializes plain text", () => {
    expect(xdMarkupSerializer([["text", "hello"]])).toBe("hello")
  })

  it("serializes simple formatting", () => {
    expect(xdMarkupSerializer([["bold", "hello", t("hello")]])).toBe("{*hello*}")
    expect(xdMarkupSerializer([["italics", "hello", t("hello")]])).toBe("{/hello/}")
    expect(xdMarkupSerializer([["strike", "hello", t("hello")]])).toBe("{-hello-}")
    expect(xdMarkupSerializer([["underscore", "hello", t("hello")]])).toBe("{_hello_}")
    expect(xdMarkupSerializer([["subscript", "2", t("2")]])).toBe("{~2~}")
    expect(xdMarkupSerializer([["superscript", "2", t("2")]])).toBe("{^2^}")
  })

  it("serializes links", () => {
    expect(xdMarkupSerializer([["link", "click", "https://example.com", t("click")]])).toBe("{@click|https://example.com@}")
  })

  it("serializes images", () => {
    expect(xdMarkupSerializer([["img", "https://img.png", "alt", false]])).toBe("{![https://img.png|alt]!}")
    expect(xdMarkupSerializer([["img", "https://img.png", "alt", true]])).toBe("{!![https://img.png|alt]!}")
    expect(xdMarkupSerializer([["img", "https://img.png", "alt", false, "100", "200"]])).toBe("{![https://img.png|alt|100|200]!}")
  })

  it("serializes colors", () => {
    expect(xdMarkupSerializer([["color", "red", "#ff0000", "#cc0000", t("red")]])).toBe("{#red|#ff0000|#cc0000#}")
  })

  it("serializes nested markup using children", () => {
    expect(xdMarkupSerializer([["bold", "{/text/}", [["italics", "text", t("text")]]]])).toBe("{*{/text/}*}")
  })

  it("serializes nested link text", () => {
    expect(xdMarkupSerializer([["link", "{*bold*}", "https://example.com", [["bold", "bold", t("bold")]]]])).toBe(
      "{@{*bold*}|https://example.com@}",
    )
  })
})

// --- Roundtrip tests ---

describe("roundtrip: parse → serialize → parse", () => {
  const roundtripCases = [
    "plain text",
    "{*bold*}",
    "{/italic/}",
    "I think {@you should read|https://github.com@} more",
    "{/Italic/}, {_underscore_}, or {-strike-thru-}",
    "H{~2~}O is water",
    "E=mc{^2^} is famous",
    "{=small caps=}",
    "{#red|#ff0000|#cc0000#}",
    "{![https://example.com/image.png|alt text]!}",
    "{!![https://example.com/image.png|alt text|300|400]!}",
    // Nested cases
    "{*{/bold italic/}*}",
    "{*bold {/and italic/} text*}",
    "{@{*bold link*}|https://example.com@}",
    "{#{*bold*} text|#fff|#000#}",
    "{*{/{_deep_}/}*}",
  ]

  for (const input of roundtripCases) {
    it(`roundtrips: ${input}`, () => {
      const parsed = xdMarkupProcessor(input)
      const serialized = xdMarkupSerializer(parsed)
      const reparsed = xdMarkupProcessor(serialized)
      expect(serialized).toBe(input)
      expect(reparsed).toEqual(parsed)
    })
  }
})
