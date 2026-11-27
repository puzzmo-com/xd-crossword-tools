import { describe, it, expect } from "vitest"
import { isGridSolved, parseRebusField, serializeRebusField } from "./rebus"
import { xdToJSON } from "./xdToJSON"

/** The rules as `key=option|option` strings, with linked segments in brackets, to keep the expectations short */
const read = (field: string) => {
  const { rules, errors, deprecations } = parseRebusField(field)
  const rule = rules.map((r) => `${r.keys.join("")}=${r.options.map((o) => (o.length > 1 ? o.map((s) => `[${s}]`).join("") : `[${o[0]}]`)).join("|")}`)
  return { rules: rule, errors, deprecations }
}

describe("parseRebusField", () => {
  it("reads one value per key", () => {
    expect(read("1=ONE 2=TWO 3=THREE")).toEqual({ rules: ["1=[ONE]", "2=[TWO]", "3=[THREE]"], errors: [], deprecations: [] })
  })

  it("reads '|' separated options, the first is the solution", () => {
    expect(read("1=HEART 2=EIGHT|8").rules).toEqual(["1=[HEART]", "2=[EIGHT]|[8]"])
  })

  it("reads '()' as an empty cell, anywhere in the options", () => {
    expect(read("1=() 2=()|H 3=H|()").rules).toEqual(["1=[]", "2=[]|[H]", "3=[H]|[]"])
  })

  it("treats every character apart from the escapes as literal, including '/' and '='", () => {
    expect(read("1=/ 2=\\| 3=\\, 4=\\( 5=\\\\ 6=a=b 7=W/T").rules).toEqual(["1=[/]", "2=[|]", "3=[,]", "4=[(]", "5=[\\]", "6=[a=b]", "7=[W/T]"])
  })

  it("allows text in parentheses, so '(S)' is the same as 'S'", () => {
    expect(read("1=(S)|(EIGHT)").rules).toEqual(["1=[S]|[EIGHT]"])
  })

  it("links the cells of a rule with several keys, one segment per key", () => {
    expect(read("12345=CIGAR|PENIS").rules).toEqual(["12345=[C][I][G][A][R]|[P][E][N][I][S]"])
    expect(read("12=(SC)(EG)|SE|CG").rules).toEqual(["12=[SC][EG]|[S][E]|[C][G]"])
    expect(read("123=()()()|TEN").rules).toEqual(["123=[][][]|[T][E][N]"])
    expect(read("12=NR|SU 34=EA|WE").rules).toEqual(["12=[N][R]|[S][U]", "34=[E][A]|[W][E]"])
  })

  it("reads the converted puzzle example from the spec", () => {
    const { rules, errors } = parseRebusField("1234=WARS|TREK|(W/T)(A/R)(R/E)(S/K)|(T/W)(R/A)(E/R)(K/S)|(WT)(AR)(RE)(SK)|(TW)(RA)(ER)(KS)")
    expect(errors).toEqual([])
    expect(rules[0].options.map((o) => o[0])).toEqual(["W", "T", "W/T", "T/W", "WT", "TW"])
  })

  it("errors on syntax which isn't xd v4", () => {
    const errors = (field: string) => parseRebusField(field).errors
    expect(errors("1=A|")).toEqual(["The rebus rule '1=A|' has an empty option, a cell which is correct when left empty is written '()'"])
    expect(errors("1=A\\B")).toEqual(["The rebus rule '1=A\\B' has '\\B', which isn't an escape: '\\' can only escape '|', ',', '(', ')' and '\\'"])
    expect(errors("1=A(B)")).toEqual(["The rebus rule '1=A(B)' has a '(' which has a meaning in the Rebus field, write a literal '(' as '\\('"])
    expect(errors("12=ABC|DE")).toEqual(["The rebus rule '12=ABC|DE' has 2 keys, so each option needs 2 segments, but 'ABC' has 3"])
    expect(errors("12=AB")[0]).toContain("needs more than one option")
    expect(errors("11=AB|CD")).toEqual(["The rebus rule '11=AB|CD' declares the key '1' twice"])
    expect(errors("1=A 12=BC|DE")).toEqual(["The rebus key '1' is declared more than once, a key can only be in one rule"])
    expect(errors("|=A")).toEqual(["'|' can't be a rebus key, it has a meaning in the Rebus field"])
    expect(errors("1A")).toEqual(["The rebus rule '1A' is missing the '=' between its key and its options"])
  })

  it("leaves out a rule it can't read, rather than guess at it", () => {
    const { rules, errors, unreadable } = parseRebusField("1=| 2=A,B 3=OK")
    expect(errors).toHaveLength(2)
    expect(unreadable).toEqual(["1=|", "2=A,B"])
    expect(rules).toEqual([{ keys: ["3"], options: [["OK"]] }])
  })

  it("reads pre-v4 repeated keys and ',' separated rules by the v4 rules, with deprecations", () => {
    // Only the first rule for a key counts
    expect(read("1=O 1=A 2=XY")).toEqual({
      rules: ["1=[O]", "2=[XY]"],
      errors: [],
      deprecations: ["'1=O 1=A' repeats the rebus key '1', and xd v4 only reads the first. A cell's options go in one rule: '1=O|A'. xd-crossword-migrator can convert this file."],
    })
    // ',' is reserved, so the rules can't be read
    expect(read("1=OIL,2=WATER")).toEqual({
      rules: [],
      errors: [],
      deprecations: ["Rebus rules are separated by spaces in xd v4, ',' is reserved so '1=OIL,2=WATER' can't be read: use '1=OIL 2=WATER'. xd-crossword-migrator can convert this file."],
    })
  })
})

describe("serializeRebusField", () => {
  it("writes back what it reads", () => {
    for (const field of ["1=HEART 2=EIGHT|8", "1=() 2=()|H", "1=/ 2=\\| 3=\\, 4=\\( 5=\\\\", "12=(SC)(EG)|SE|CG", "123=()()()|TEN", "12345=CIGAR|PENIS"]) {
      expect(serializeRebusField(parseRebusField(field).rules)).toEqual(field)
    }
  })

  it("escapes reserved characters, inside parentheses too", () => {
    expect(serializeRebusField([{ keys: ["1", "2"], options: [["A|B", ","], ["C", "D"]] }])).toEqual("12=(A\\|B)\\,|CD")
  })
})

describe("the Rebus field in xdToJSON", () => {
  const puzzle = (rebus: string, grid: string) => `## Metadata\n\nRebus: ${rebus}\n\n## Grid\n\n${grid}\n\n## Clues\n\nA1. Clue ~ ANSWER\n`

  it("reports errors in the field", () => {
    const json = xdToJSON(puzzle("1=A|", "L1G"))
    expect(json.report.errors.map((e) => e.message)).toEqual([
      "The rebus rule '1=A|' has an empty option, a cell which is correct when left empty is written '()'",
    ])
  })

  it("reports pre-v4 syntax as deprecated", () => {
    const json = xdToJSON(puzzle("1=OIL,2=WATER", "12"))
    expect(json.report.errors).toEqual([])
    expect(json.report.warnings.map((w) => w.type)).toEqual(["deprecation"])
    expect(json.rebuses).toEqual({})
  })
})

describe("isGridSolved", () => {
  it("needs the cells of a linked rule to all come from the same option", () => {
    // Cells 1 and 2 accept LAT, LUG and LAG, but not LUT
    const { tiles } = xdToJSON(`## Metadata\n\nRebus: 12=AT|UG|AG\n\n## Grid\n\nL12\n\n## Clues\n\nA1. Hang back ~ LAG`)
    const solved = (row: string[]) => isGridSolved(tiles, [row])

    expect(solved(["L", "A", "T"])).toBe(true)
    expect(solved(["L", "U", "G"])).toBe(true)
    expect(solved(["L", "A", "G"])).toBe(true)
    expect(solved(["L", "U", "T"])).toBe(false)
  })

  it("lets the cells of a rule with one key choose on their own", () => {
    const { tiles } = xdToJSON(`## Metadata\n\nRebus: 1=EIGHT|8\n\n## Grid\n\nH1ANDW1\n\n## Clues\n\nA1. Body measurements ~ HEIGHTANDWEIGHT`)
    expect(isGridSolved(tiles, [["H", "8", "A", "N", "D", "W", "EIGHT"]])).toBe(true)
    expect(isGridSolved(tiles, [["H", "8", "A", "N", "D", "W", "8"]])).toBe(true)
  })

  it("compares case", () => {
    const { tiles } = xdToJSON(`## Metadata\n\nRebus: 1=HEART\n\n## Grid\n\n1S\n\n## Clues\n\nA1. Organs ~ HEARTS`)
    expect(isGridSolved(tiles, [["HEART", "S"]])).toBe(true)
    expect(isGridSolved(tiles, [["heart", "S"]])).toBe(false)
  })
})
