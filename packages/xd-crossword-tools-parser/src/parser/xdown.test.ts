import { parseXDown, serializeXDown, xdownToPlainText } from "./xdown"
import { xdToJSON } from "./xdToJSON"
import { readFileSync } from "fs"
import { it, expect, describe } from "vitest"
import type { XDownComponent } from "../types"

/** Helper: wrap plain text content as children for non-nested markup */
const t = (s: string): XDownComponent[] => [["text", s]]

it("handles bolding", () => {
  const xd = readFileSync("./packages/xd-crossword-tools-parser/src/parser/outputs/explicit-alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. {/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here | href: https://mylink.com@} ~ AHAB"

  const json = xdToJSON(xd.replace(originalClue, newMDClue))
  const clue = json.clues.across[0]
  expect(clue.body).toBe("{/Captain/}, {*of*}, {_the_}, ship {-pequod-} {@see here | href: https://mylink.com@}")
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
  const parsed = parseXDown("{/Italic/}, {_bold_}, {_underscore_}, or {-strike-thru-}")
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
  const parsed = parseXDown("I think {@you should read | href: https://github.com@} more")
  expect(parsed).toEqual([
    ["text", "I think "],
    ["link", "you should read", "https://github.com", t("you should read")],
    ["text", " more"],
  ])
})

it("handles inline images", () => {
  const xd = readFileSync("./packages/xd-crossword-tools-parser/src/parser/outputs/explicit-alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"
  const newMDClue = "A1. {!alt text | src: https://emojipedia.org/image/y.png; display: block!} block with alt text ~ AHAB"

  const json = xdToJSON(xd.replace(originalClue, newMDClue))
  const clue = json.clues.across[0]
  expect(clue.body).toBe("{!alt text | src: https://emojipedia.org/image/y.png; display: block!} block with alt text")
  expect(clue.display).toEqual([
    ["img", "https://emojipedia.org/image/y.png", "alt text", true],
    ["text", " block with alt text"],
  ])
  expect(clue.number).toBe(1)
  expect(clue.answer).toBe("AHAB")
  expect(clue.position).toEqual({ col: 0, index: 0 })
})

it("correctly inline images in markup", () => {
  expect(parseXDown("{!alt text | src: https://emojipedia.org/image/y.png!}")).toEqual([
    ["img", "https://emojipedia.org/image/y.png", "alt text", false],
  ])
})

it("correctly handles ~ for subscript", () => {
  expect(parseXDown("H{~2~}O is water")).toEqual([
    ["text", "H"],
    ["subscript", "2", t("2")],
    ["text", "O is water"],
  ])
})

it("correctly handles ^ for superscript", () => {
  expect(parseXDown("E=mc{^2^} is famous")).toEqual([
    ["text", "E=mc"],
    ["superscript", "2", t("2")],
    ["text", " is famous"],
  ])
})

it("correctly handles = for small caps", () => {
  expect(parseXDown("The word {=hello=} in small caps")).toEqual([
    ["text", "The word "],
    ["smallcaps", "hello", t("hello")],
    ["text", " in small caps"],
  ])
})

it("correctly handles - for strike", () => {
  expect(parseXDown("I {-think-}, no.. I know")).toEqual([
    ["text", "I "],
    ["strike", "think", t("think")],
    ["text", ", no.. I know"],
  ])
})

it("correctly handles inline colors", () => {
  expect(parseXDown("This text is {#red | light: #ff0000; dark: #cc0000#} and this is {#blue | light: #0000ff; dark: #0000cc#}")).toEqual([
    ["text", "This text is "],
    ["color", "red", "#ff0000", "#cc0000", t("red")],
    ["text", " and this is "],
    ["color", "blue", "#0000ff", "#0000cc", t("blue")],
  ])
})

it("handles malformed color syntax gracefully", () => {
  expect(parseXDown("This {#malformed#} color will be treated as text")).toEqual([["text", "This {#malformed#} color will be treated as text"]])
})

it("correctly handles inline images with width and height", () => {
  expect(parseXDown("{!alt text | src: https://example.com/image.png; width: 100; height: 200!}")).toEqual([
    ["img", "https://example.com/image.png", "alt text", false, "100", "200"],
  ])
})

it("correctly handles block images with width and height", () => {
  expect(parseXDown("{!alt text | src: https://example.com/image.png; width: 300; height: 400; display: block!}")).toEqual([
    ["img", "https://example.com/image.png", "alt text", true, "300", "400"],
  ])
})

it("correctly handles images with only width", () => {
  expect(parseXDown("{!alt text | src: https://example.com/image.png; width: 150!}")).toEqual([
    ["img", "https://example.com/image.png", "alt text", false, "150"],
  ])
})

it("correctly handles images without width and height", () => {
  expect(parseXDown("{!alt text | src: https://example.com/image.png!}")).toEqual([
    ["img", "https://example.com/image.png", "alt text", false],
  ])
})

// --- Nested markup tests ---

describe("nested markup", () => {
  it("handles bold wrapping italics", () => {
    expect(parseXDown("{*{/bold italic/}*}")).toEqual([["bold", "{/bold italic/}", [["italics", "bold italic", t("bold italic")]]]])
  })

  it("handles mixed nested content", () => {
    expect(parseXDown("{*bold {/and italic/} text*}")).toEqual([
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
    expect(parseXDown("{@{*bold link*} | href: https://example.com@}")).toEqual([
      ["link", "{*bold link*}", "https://example.com", [["bold", "bold link", t("bold link")]]],
    ])
  })

  it("handles nested markup inside color text", () => {
    expect(parseXDown("{#{*bold*} text | light: #fff; dark: #000#}")).toEqual([
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
    expect(parseXDown("{*{/{_deep_}/}*}")).toEqual([
      ["bold", "{/{_deep_}/}", [["italics", "{_deep_}", [["underscore", "deep", t("deep")]]]]],
    ])
  })
})

// --- Serializer tests ---

describe("serializeXDown", () => {
  it("serializes plain text", () => {
    expect(serializeXDown([["text", "hello"]])).toBe("hello")
  })

  it("serializes simple formatting", () => {
    expect(serializeXDown([["bold", "hello", t("hello")]])).toBe("{*hello*}")
    expect(serializeXDown([["italics", "hello", t("hello")]])).toBe("{/hello/}")
    expect(serializeXDown([["strike", "hello", t("hello")]])).toBe("{-hello-}")
    expect(serializeXDown([["underscore", "hello", t("hello")]])).toBe("{_hello_}")
    expect(serializeXDown([["subscript", "2", t("2")]])).toBe("{~2~}")
    expect(serializeXDown([["superscript", "2", t("2")]])).toBe("{^2^}")
  })

  it("serializes links", () => {
    expect(serializeXDown([["link", "click", "https://example.com", t("click")]])).toBe("{@click | href: https://example.com@}")
  })

  it("serializes images", () => {
    expect(serializeXDown([["img", "https://img.png", "alt", false]])).toBe("{!alt | src: https://img.png!}")
    expect(serializeXDown([["img", "https://img.png", "alt", true]])).toBe("{!alt | src: https://img.png; display: block!}")
    expect(serializeXDown([["img", "https://img.png", "alt", false, "100", "200"]])).toBe("{!alt | src: https://img.png; width: 100; height: 200!}")
  })

  it("serializes colors", () => {
    expect(serializeXDown([["color", "red", "#ff0000", "#cc0000", t("red")]])).toBe("{#red | light: #ff0000; dark: #cc0000#}")
  })

  it("serializes nested markup using children", () => {
    expect(serializeXDown([["bold", "{/text/}", [["italics", "text", t("text")]]]])).toBe("{*{/text/}*}")
  })

  it("serializes nested link text", () => {
    expect(serializeXDown([["link", "{*bold*}", "https://example.com", [["bold", "bold", t("bold")]]]])).toBe(
      "{@{*bold*} | href: https://example.com@}",
    )
  })
})

// --- Roundtrip tests ---

describe("roundtrip: parse → serialize → parse", () => {
  const roundtripCases = [
    "plain text",
    "{*bold*}",
    "{/italic/}",
    "I think {@you should read | href: https://github.com@} more",
    "{/Italic/}, {_underscore_}, or {-strike-thru-}",
    "H{~2~}O is water",
    "E=mc{^2^} is famous",
    "{=small caps=}",
    "{#red | light: #ff0000; dark: #cc0000#}",
    "{!alt text | src: https://example.com/image.png!}",
    "{!alt text | src: https://example.com/image.png; width: 300; height: 400; display: block!}",
    // Nested cases
    "{*{/bold italic/}*}",
    "{*bold {/and italic/} text*}",
    "{@{*bold link*} | href: https://example.com@}",
    "{#{*bold*} text | light: #fff; dark: #000#}",
    "{*{/{_deep_}/}*}",
  ]

  for (const input of roundtripCases) {
    it(`roundtrips: ${input}`, () => {
      const parsed = parseXDown(input)
      const serialized = serializeXDown(parsed)
      const reparsed = parseXDown(serialized)
      expect(serialized).toBe(input)
      expect(reparsed).toEqual(parsed)
    })
  }
})

// --- Plain text tests ---

describe("xdownToPlainText", () => {
  it("passes plain text through untouched", () => {
    expect(xdownToPlainText(parseXDown("Captain of the Pequod"))).toBe("Captain of the Pequod")
  })

  it("drops styling and keeps the inner text", () => {
    expect(xdownToPlainText(parseXDown("{/Italic/}, {_underscore_}, or {-strike-thru-}"))).toBe(
      "Italic, underscore, or strike-thru",
    )
    expect(xdownToPlainText(parseXDown("H{~2~}O is water"))).toBe("H2O is water")
    expect(xdownToPlainText(parseXDown("E=mc{^2^} is famous"))).toBe("E=mc2 is famous")
    expect(xdownToPlainText(parseXDown("The word {=hello=} in small caps"))).toBe("The word hello in small caps")
    expect(xdownToPlainText(parseXDown("This is {#red | light: #ff0000; dark: #cc0000#} text"))).toBe("This is red text")
  })

  it("keeps links in markdown form", () => {
    expect(xdownToPlainText(parseXDown("I think {@you should read | href: https://github.com@} more"))).toBe(
      "I think [you should read](https://github.com) more",
    )
  })

  it("drops the parens from a link with no url", () => {
    expect(xdownToPlainText(parseXDown("I think {@you should read@} more"))).toBe("I think you should read more")
  })

  it("represents images by their alt text", () => {
    expect(xdownToPlainText(parseXDown("{!a sleepy cat | src: https://example.com/cat.png!} nap spot"))).toBe("[a sleepy cat] nap spot")
    expect(xdownToPlainText(parseXDown("{!a sleepy cat | src: https://example.com/cat.png; width: 300; height: 400; display: block!} nap spot"))).toBe(
      "[a sleepy cat] nap spot",
    )
  })

  it("falls back to '[image]' when an image has no alt text", () => {
    expect(xdownToPlainText(parseXDown("{! | src: https://example.com/cat.png!} nap spot"))).toBe("[image] nap spot")
  })

  it("flattens nested markup", () => {
    expect(xdownToPlainText(parseXDown("{*{/bold italic/}*}"))).toBe("bold italic")
    expect(xdownToPlainText(parseXDown("{*bold {/and italic/} text*}"))).toBe("bold and italic text")
    expect(xdownToPlainText(parseXDown("{@{*bold link*} | href: https://example.com@}"))).toBe("[bold link](https://example.com)")
    expect(xdownToPlainText(parseXDown("{*{/{_deep_}/}*}"))).toBe("deep")
  })

  it("handles an empty clue", () => {
    expect(xdownToPlainText(parseXDown(""))).toBe("")
  })
})

describe("clue.plain", () => {
  const xd = readFileSync("./packages/xd-crossword-tools-parser/src/parser/outputs/explicit-alpha-bits.xd", "utf8")
  const originalClue = "A1. Captain of the Pequod ~ AHAB"

  it("is set for clues without markup", () => {
    const json = xdToJSON(xd)
    expect(json.clues.across[0].plain).toBe("Captain of the Pequod")
  })

  it("is set for clues with markup", () => {
    const newMDClue = "A1. {/Captain/} of the {*Pequod*}, {@see here | href: https://mylink.com@} ~ AHAB"
    const json = xdToJSON(xd.replace(originalClue, newMDClue))
    const clue = json.clues.across[0]

    expect(clue.body).toBe("{/Captain/} of the {*Pequod*}, {@see here | href: https://mylink.com@}")
    expect(clue.plain).toBe("Captain of the Pequod, [see here](https://mylink.com)")
  })

  it("is set for clues with images", () => {
    const newMDClue = "A1. {!alt text | src: https://emojipedia.org/image/y.png; display: block!} block with alt text ~ AHAB"
    const json = xdToJSON(xd.replace(originalClue, newMDClue))
    expect(json.clues.across[0].plain).toBe("[alt text] block with alt text")
  })

  it("is set on hint and revealer metadata", () => {
    const newMDClue = [
      originalClue,
      "A1 ^hint: A {*whaling*} captain",
      "A1 ^revealer: See {!a whale | src: https://example.com/whale.png!}",
    ].join("\n")
    const json = xdToJSON(xd.replace(originalClue, newMDClue))
    const clue = json.clues.across[0]

    expect(clue.metadata!["hint:plain"]).toBe("A whaling captain")
    expect(clue.metadata!["revealer:plain"]).toBe("See [a whale]")
  })
})

describe("xd v4 spec examples", () => {
  it("nests text spans", () => {
    expect(parseXDown("Captain in {/{*Moby-Dick*}/}")).toEqual([
      ["text", "Captain in "],
      ["italics", "{*Moby-Dick*}", [["bold", "Moby-Dick", t("Moby-Dick")]]],
    ])
  })

  it("reads link attributes, with markup in the link text", () => {
    expect(parseXDown("See {@the notes | href: https://example.com@}")).toEqual([
      ["text", "See "],
      ["link", "the notes", "https://example.com", t("the notes")],
    ])
    expect(parseXDown("See {@{*the notes*} | href: https://example.com@}")).toEqual([
      ["text", "See "],
      ["link", "{*the notes*}", "https://example.com", [["bold", "the notes", t("the notes")]]],
    ])
  })

  it("reads image attributes, including quoted data URIs", () => {
    expect(parseXDown("Pictured: {!A sperm whale | src: https://example.com/whale.png; display: block!}")).toEqual([
      ["text", "Pictured: "],
      ["img", "https://example.com/whale.png", "A sperm whale", true],
    ])
    expect(parseXDown("{!dot | src: 'data:image/png;base64,iVBORw0KGgo='; width: 10!}")).toEqual([
      ["img", "data:image/png;base64,iVBORw0KGgo=", "dot", false, "10"],
    ])
  })

  it("ignores attributes it does not know", () => {
    expect(parseXDown("{@x | href: https://a.com; target: _blank@}")).toEqual([["link", "x", "https://a.com", t("x")]])
  })

  it("passes literals through untouched", () => {
    expect(parseXDown("What {\\~\\} means in π {\\~\\} 3.14")).toEqual([["text", "What ~ means in π ~ 3.14"]])
    expect(parseXDown("Empty set {\\{}\\}")).toEqual([["text", "Empty set {}"]])
    expect(parseXDown("{\\{/not italic/}\\}")).toEqual([["text", "{/not italic/}"]])
  })

  it("reads an empty literal as a line break", () => {
    expect(parseXDown("Line one{\\\\}Line two")).toEqual([["text", "Line one"], ["linebreak"], ["text", "Line two"]])
    expect(xdownToPlainText(parseXDown("Line one{\\\\}Line two"))).toBe("Line one\nLine two")
  })

  it("treats a { followed by a non-punctuation character as text", () => {
    expect(parseXDown("A {set} of {1, 2}")).toEqual([["text", "A {set} of {1, 2}"]])
  })

  it("shows spans using reserved, but undefined, type characters as-is", () => {
    expect(parseXDown("Costs {$5$} today")).toEqual([["text", "Costs {$5$} today"]])
  })

  it("keeps a literal inside a span from closing it", () => {
    expect(parseXDown("{/a {\\/}\\} b/}")).toEqual([["italics", "a {\\/}\\} b", t("a /} b")]])
  })
})

describe("serializeXDown escaping", () => {
  const roundtrips = (components: XDownComponent[]) => {
    const serialized = serializeXDown(components)
    expect(parseXDown(serialized)).toEqual(components)
    return serialized
  }

  it("escapes ' ~ ' so it does not split the clue line", () => {
    expect(roundtrips([["text", "What ~ means"]])).toBe("What {\\~\\} means")
  })

  it("escapes a { which would open a span", () => {
    expect(roundtrips([["text", "Costs {$5$}"]])).toBe("Costs {\\{\\}$5$}")
    expect(roundtrips([["text", "Ends with {"]])).toBe("Ends with {\\{\\}")
  })

  it("leaves a { before ordinary text alone", () => {
    expect(serializeXDown([["text", "A {set}"]])).toBe("A {set}")
  })

  it("escapes the closing delimiter inside a span", () => {
    expect(serializeXDown([["italics", "a/}b", t("a/}b")]])).toBe("{/a{\\/}\\}b/}")
  })

  it("escapes a pipe in link text", () => {
    expect(serializeXDown([["link", "a|b", "https://x.com", t("a|b")]])).toBe("{@a{\\|\\}b | href: https://x.com@}")
  })

  it("quotes attribute values which contain a ;", () => {
    expect(roundtrips([["img", "data:image/png;base64,abc=", "dot", false]])).toBe("{!dot | src: 'data:image/png;base64,abc='!}")
  })

  it("writes line breaks as an empty literal", () => {
    expect(roundtrips([["text", "a"], ["linebreak"], ["text", "b"]])).toBe("a{\\\\}b")
  })
})

describe("pre-v4 syntax", () => {
  it("still reads positional links, images and colors with a deprecation", () => {
    const deprecations: string[] = []
    const onDeprecated = (msg: string) => deprecations.push(msg)

    expect(parseXDown("{@see here|https://mylink.com@}", { onDeprecated })).toEqual([["link", "see here", "https://mylink.com", t("see here")]])
    expect(parseXDown("{!![https://img.png|alt|300|400]!}", { onDeprecated })).toEqual([["img", "https://img.png", "alt", true, "300", "400"]])
    expect(parseXDown("{![https://img.png]!}", { onDeprecated })).toEqual([["img", "https://img.png", "", false]])
    expect(parseXDown("{#red|#f00|#c00#}", { onDeprecated })).toEqual([["color", "red", "#f00", "#c00", t("red")]])

    expect(deprecations).toHaveLength(4)
    expect(deprecations[0]).toContain("{@text | href: url@}")
  })

  it("does not deprecate v4 syntax", () => {
    const deprecations: string[] = []
    parseXDown("{@a | href: https://a.com@} {!b | src: https://b.png!} {#c | light: #fff; dark: #000#} {/d/}", {
      onDeprecated: (msg) => deprecations.push(msg),
    })
    expect(deprecations).toEqual([])
  })

  it("can parse with the pre-v4 rules, where literals and new type characters are text", () => {
    expect(parseXDown("{\\~\\} {$5$}", { legacy: true })).toEqual([["text", "{\\~\\} {$5$}"]])
  })

  it("converts to v4 by parsing legacy and serializing", () => {
    const v4 = (str: string) => serializeXDown(parseXDown(str, { legacy: true }))
    expect(v4("I think {@you should read|https://github.com@} more")).toBe("I think {@you should read | href: https://github.com@} more")
    expect(v4("{!![https://example.com/image.png|alt text|300|400]!}")).toBe(
      "{!alt text | src: https://example.com/image.png; width: 300; height: 400; display: block!}",
    )
    expect(v4("{#{*bold*} text|#fff|#000#}")).toBe("{#{*bold*} text | light: #fff; dark: #000#}")
    expect(v4("A {\\path\\} costs {$5$}")).toBe("A {\\{\\}\\path\\} costs {\\{\\}$5$}")
  })
})

describe("metadata values", () => {
  it("are parsed as xdown into metaDisplay", () => {
    const xd = readFileSync("./packages/xd-crossword-tools-parser/src/parser/outputs/explicit-alpha-bits.xd", "utf8")
    const json = xdToJSON(xd.replace("Title: Alpha-Bits", "Title: {/Alpha/}-Bits"))
    expect(json.meta.title).toBe("{/Alpha/}-Bits")
    expect(json.metaDisplay.title).toEqual([["italics", "Alpha", t("Alpha")], ["text", "-Bits"]])
    expect(json.metaDisplay.author).toEqual([["text", "Drew Hodson"]])
  })
})
