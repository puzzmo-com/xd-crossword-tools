import { xdToJSON } from "./xdToJSON"
import { parseDesignRules, serializeDesignRules } from "./design"

describe("pre-v4 <style> wrapped rules", () => {

it("Multiline works", () => {
  const xd = wrapStyle(`
<style>
O { background: circle }
</style>
`)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "background": "circle",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("Single line works", () => {
  const xd = wrapStyle(`
  <style>O { background: circle }</style>
  `)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "background": "circle",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("handles multiple rules", () => {
  const xd = wrapStyle(`
    <style>O { background: circle; foreground: hello }</style>
    `)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "background": "circle",
    "foreground": "hello",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("handles same line rules but different style", () => {
  const xd = wrapStyle(`
      <style>O { background: circle; foreground: hello }
      </style>
      `)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "background": "circle",
    "foreground": "hello",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("handles same line rules but different style", () => {
  const xd = wrapStyle(`
        <style>O { background: circle; foreground: hello }
        V { background: circle; foreground: hello }
        </style>
        `)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "background": "circle",
    "foreground": "hello",
  },
  "V": {
    "background": "circle",
    "foreground": "hello",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("handles dashes fine", () => {
  const xd = wrapStyle(`
          <style>O { border-right: circle; border-left: dot; }</style>
          `)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "border-left": "dot",
    "border-right": "circle",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("warns that the <style> tag is pre-v4", () => {
  const { report } = xdToJSON(wrapStyle(`<style>O { background: circle }</style>`), false)
  expect(report.warnings.map((w) => w.message)).toContain("xd v4 design sections do not wrap their style definitions in a <style> tag")
})
})

it("errors when there are no style definitions", () => {
  const { report } = xdToJSON(wrapStyle(``), false)
  expect(report.errors.map((e) => e.message)).toEqual([
    "This design section has no style definitions, it should start with rules like 'O { background: circle }'",
  ])
})

it("errors when you have a 2 char name", () => {
  const { report } = xdToJSON(wrapStyle(`OO { background: circle }`), false)
  expect(report.errors.map((e) => e.message)).toEqual([
    "Cannot have a style rule which is longer than one character: got 'OO' - it needs to fit in a grid cell",
  ])
})

describe("xd v4 design sections", () => {
  it("reads rules without a <style> tag, and the grid starts after the last rule", () => {
    const { design, report } = xdToJSON(
      wrapStyle(`O { background: circle }
S { background: shaded }`),
      false,
    )
    expect(report.errors).toEqual([])
    expect(report.warnings).toEqual([])
    expect(design?.styles).toEqual({ O: { background: "circle" }, S: { background: "shaded" } })
    expect(design?.positions[5][11]).toBe("O")
    expect(design?.positions.length).toBe(15)
  })

  it("does not need a blank line between the rules and the grid", () => {
    const xd = `## Grid

AB
CD

## Design

O { background: circle }
O.
.O
`
    const { design } = xdToJSON(xd, false)
    expect(design?.positions).toEqual([["O"], [undefined, "O"]])
  })

  it("reads rules over many lines", () => {
    const { styles, errors } = parseDesignRules(`A {
  background: circle;
  bar-top: true;
}`)
    expect(errors).toEqual([])
    expect(styles).toEqual({ A: { background: "circle", "bar-top": "true" } })
  })

  it("merges re-opened selectors", () => {
    expect(parseDesignRules(`A { background: circle }\nA { bar-top: true }`).styles).toEqual({
      A: { background: "circle", "bar-top": "true" },
    })
  })

  it("re-opens one selector from a comma rule without changing the others", () => {
    const { styles, errors } = parseDesignRules(`A, B { background: circle }\nA { background: shaded; bar-top: true }`)
    expect(errors).toEqual([])
    expect(styles).toEqual({
      A: { background: "shaded", "bar-top": "true" },
      B: { background: "circle" },
    })
  })

  it("opens many selectors with a comma", () => {
    expect(parseDesignRules(`A, B { background: circle }`).styles).toEqual({ A: { background: "circle" }, B: { background: "circle" } })
  })

  it("allows an optional trailing semicolon", () => {
    expect(parseDesignRules(`A { background: circle; }`).styles).toEqual({ A: { background: "circle" } })
  })

  it("keeps whitespace within a value", () => {
    expect(parseDesignRules(`B { background-size: 2 2 }`).styles).toEqual({ B: { "background-size": "2 2" } })
  })

  it("does not split on delimiters inside quoted values", () => {
    const { styles, errors } = parseDesignRules(
      `A { background-image: url('data:image/png;base64,iVBORw0KGgo='); background-size: 2 2 }\nB { background-image: url('https://example.com/petal.png') }`,
    )
    expect(errors).toEqual([])
    expect(styles).toEqual({
      A: { "background-image": "url('data:image/png;base64,iVBORw0KGgo=')", "background-size": "2 2" },
      B: { "background-image": "url('https://example.com/petal.png')" },
    })
  })

  it("rejects a comma inside a rule body", () => {
    expect(parseDesignRules(`B { background-size: 2, 2 }`).errors).toEqual([
      "Commas are not allowed inside style rules, use semicolons (;) to separate properties: 'background-size: 2, 2'",
    ])
  })

  it("treats selectors as case-sensitive", () => {
    expect(parseDesignRules(`a { background: circle }\nA { background: shaded }`).styles).toEqual({
      a: { background: "circle" },
      A: { background: "shaded" },
    })
  })
})

const wrapStyle = (style: string) => `
## Metadata
## Grid
## Design

${style}

....###...#....
....##....#....
....#.....#....
............###
...#....##....#
......#....O...
##...#....#O...
..O....#...O...
..O.#....#.O.##
..O.....#..O...
#.OO.##....#O..
###O........O..
...O#.....#.O..
...O#....##.O..
...O#...###.O..
`

const throwsWithError = (xd: string, strict = true) => {
  try {
    xdToJSON(xd, strict)
  } catch (error) {
    return JSON.parse(JSON.stringify(error))
  }
  expect("This should have failed")
}

describe("serializeDesignRules", () => {
  it("groups properties shared by the same selectors, keeping the selector characters", () => {
    const styles = {
      A: { background: "circle", "bar-top": "true" },
      B: { background: "circle" },
      C: { background: "circle", "bar-top": "true" },
      Z: { "background-light": "#f00", "background-dark": "#900" },
    }
    const css = serializeDesignRules(styles)
    expect(css).toBe(`A, B, C { background: circle }
A, C { bar-top: true }
Z { background-light: #f00; background-dark: #900 }`)
    expect(parseDesignRules(css).styles).toEqual(styles)
  })

  it("writes the same rules for the same styles, whichever way they were written", () => {
    const grouped = parseDesignRules(`A, B { background: circle }\nA { bar-top: true }`).styles
    const separate = parseDesignRules(`A { background: circle; bar-top: true }\nB { background: circle }`).styles
    expect(serializeDesignRules(grouped)).toBe(serializeDesignRules(separate))
  })

  it("keeps selectors with no properties", () => {
    expect(serializeDesignRules({ A: { background: "circle" }, X: {} })).toBe(`A { background: circle }\nX {}`)
    expect(parseDesignRules(`A { background: circle }\nX {}`).styles).toEqual({ A: { background: "circle" }, X: {} })
  })

  it("quotes values which need it", () => {
    const styles = { P: { "background-image": "url('data:image/png;base64,abc=')", "background-size": "2 2" } }
    expect(parseDesignRules(serializeDesignRules(styles)).styles).toEqual(styles)
  })
})

describe("large design sections", () => {
  it("parses many data URI images quickly", () => {
    const uri = "data:image/png;base64," + "A".repeat(50_000)
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    const rules = [...letters].map((c) => `${c} {\n  background-image: url('${uri}');\n  background-size: 1 1\n}`).join("\n")
    const xd = `## Grid\n\nAB\n\n## Design\n\n${rules}\n\nAB\n`

    const start = performance.now()
    const json = xdToJSON(xd)
    expect(performance.now() - start).toBeLessThan(500)
    expect(Object.keys(json.design!.styles)).toHaveLength(52)
    expect(json.design!.positions).toEqual([["A", "B"]])
  })

  it("does not end a rule at a '}' inside a quoted value", () => {
    const json = xdToJSON(`## Grid\n\nAB\n\n## Design\n\nA {\n  background-image: url('data:x;y}z');\n  bar-top: true\n}\n\nA.\n`)
    expect(json.design?.styles).toEqual({ A: { "background-image": "url('data:x;y}z')", "bar-top": "true" } })
    expect(json.design?.positions).toEqual([["A"]])
  })
})
