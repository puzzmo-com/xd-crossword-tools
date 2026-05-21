import { readFileSync } from "fs"
import { crossCompilerXMLToXD } from "../src/crossCompilerXMLToXD"
import { xdToJSON } from "xd-crossword-tools-parser"
import { describe, it, expect } from "vitest"

const globeXML = readFileSync(__dirname + "/crosscompiler/globe-2026-february.xml", "utf8")

describe(crossCompilerXMLToXD.name, () => {
  it("converts a small inline crossword-compiler xml fixture", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler xmlns="http://crossword.info/xml/crossword-compiler">
  <rectangular-puzzle xmlns="http://crossword.info/xml/rectangular-puzzle" alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ">
    <metadata>
      <title>Tiny test</title>
      <creator>Ada Lovelace</creator>
      <copyright>2026</copyright>
      <description>A small fixture</description>
    </metadata>
    <crossword>
      <grid width="3" height="3">
        <grid-look numbering-scheme="normal"/>
        <cell x="1" y="1" solution="C" number="1"/>
        <cell x="2" y="1" solution="A" number="2"/>
        <cell x="3" y="1" solution="T" number="3"/>
        <cell x="1" y="2" solution="O" number="4"/>
        <cell x="2" y="2" type="block"/>
        <cell x="3" y="2" solution="O"/>
        <cell x="1" y="3" solution="W" number="5"/>
        <cell x="2" y="3" solution="A"/>
        <cell x="3" y="3" solution="R"/>
      </grid>
      <word id="1" x="1-3" y="1"/>
      <word id="2" x="1-3" y="3"/>
      <word id="3" x="1" y="1-3"/>
      <word id="4" x="3" y="1-3"/>
      <clues ordering="normal">
        <title>Across</title>
        <clue word="1" number="1" format="3">Feline</clue>
        <clue word="2" number="5" format="3">Conflict</clue>
      </clues>
      <clues ordering="normal">
        <title>Down</title>
        <clue word="3" number="1" format="3">Female sheep, with W</clue>
        <clue word="4" number="3" format="3">Foot finger</clue>
      </clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler>`

    const res = crossCompilerXMLToXD(xml)
    expect(res).toMatchInlineSnapshot(`
      "## Metadata

      title: Tiny test
      author: Ada Lovelace
      editor: 
      date: 
      copyright: 2026
      description: A small fixture

      ## Grid

      CAT
      O.O
      WAR

      ## Clues

      A1. Feline ~ CAT
      A5. Conflict ~ WAR

      D1. Female sheep, with W ~ COW
      D3. Foot finger ~ TOR"
    `)
  })

  it("infers across vs down per clue from word geometry", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler>
  <rectangular-puzzle>
    <metadata>
      <title>Direction inference</title>
      <creator>Test</creator>
    </metadata>
    <crossword>
      <grid width="2" height="2">
        <cell x="1" y="1" solution="A" number="1"/>
        <cell x="2" y="1" solution="B"/>
        <cell x="1" y="2" solution="C" number="2"/>
        <cell x="2" y="2" solution="D"/>
      </grid>
      <word id="1" x="1-2" y="1"/>
      <word id="2" x="1-2" y="2"/>
      <word id="3" x="1" y="1-2"/>
      <word id="4" x="2" y="1-2"/>
      <clues ordering="normal">
        <title></title>
        <clue word="1" number="1">First across</clue>
        <clue word="3" number="1">First down</clue>
      </clues>
      <clues ordering="normal">
        <title></title>
        <clue word="2" number="2">Second across</clue>
        <clue word="4" number="2">Second down</clue>
      </clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler>`

    const res = crossCompilerXMLToXD(xml)
    expect(res).toContain("A1. First across ~ AB")
    expect(res).toContain("A2. Second across ~ CD")
    expect(res).toContain("D1. First down ~ AC")
    expect(res).toContain("D2. Second down ~ BD")
  })

  it("converts inline html tags inside clues to xd markup", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler>
  <rectangular-puzzle>
    <metadata>
      <title>Markup</title>
      <creator>Test</creator>
    </metadata>
    <crossword>
      <grid width="2" height="2">
        <cell x="1" y="1" solution="A" number="1"/>
        <cell x="2" y="1" solution="B"/>
        <cell x="1" y="2" solution="C" number="2"/>
        <cell x="2" y="2" solution="D"/>
      </grid>
      <word id="1" x="1-2" y="1"/>
      <word id="2" x="1-2" y="2"/>
      <word id="3" x="1" y="1-2"/>
      <word id="4" x="2" y="1-2"/>
      <clues>
        <title>Across</title>
        <clue word="1" number="1">Writer of the <i>Divina Commedia</i></clue>
        <clue word="2" number="2">H<sub>2</sub>O fact</clue>
      </clues>
      <clues>
        <title>Down</title>
        <clue word="3" number="1"><b>Bold</b> intro</clue>
        <clue word="4" number="2">Visit <a href="https://example.com">our site</a></clue>
      </clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler>`

    const res = crossCompilerXMLToXD(xml)
    expect(res).toContain("A1. Writer of the {/Divina Commedia/} ~ AB")
    expect(res).toContain("A2. H{~2~}O fact ~ CD")
    expect(res).toContain("D1. {*Bold*} intro ~ AC")
    expect(res).toContain("D2. Visit {@our site|https://example.com@} ~ BD")
  })

  it("treats cells marked type=block as blanks", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler>
  <rectangular-puzzle>
    <metadata>
      <title>Blocks</title>
      <creator>Test</creator>
    </metadata>
    <crossword>
      <grid width="3" height="3">
        <cell x="1" y="1" solution="A" number="1"/>
        <cell x="2" y="1" type="block"/>
        <cell x="3" y="1" solution="B" number="2"/>
        <cell x="1" y="2" solution="C" number="3"/>
        <cell x="2" y="2" solution="D"/>
        <cell x="3" y="2" solution="E"/>
        <cell x="1" y="3" solution="F" number="4"/>
        <cell x="2" y="3" type="block"/>
        <cell x="3" y="3" solution="G"/>
      </grid>
      <word id="1" x="1-3" y="2"/>
      <word id="2" x="1" y="1-3"/>
      <word id="3" x="3" y="1-3"/>
      <clues>
        <title>Across</title>
        <clue word="1" number="3">Middle row</clue>
      </clues>
      <clues>
        <title>Down</title>
        <clue word="2" number="1">Left col</clue>
        <clue word="3" number="2">Right col</clue>
      </clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler>`

    const res = crossCompilerXMLToXD(xml)
    expect(res).toContain("A.B\nCDE\nF.G")
    expect(res).toContain("A3. Middle row ~ CDE")
    expect(res).toContain("D1. Left col ~ ACF")
    expect(res).toContain("D2. Right col ~ BEG")
  })

  it("emits a Design section with bar-left and bar-top styles", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler>
  <rectangular-puzzle>
    <metadata>
      <title>Bars</title>
      <creator>Test</creator>
    </metadata>
    <crossword>
      <grid width="2" height="2">
        <cell x="1" y="1" solution="A" number="1"/>
        <cell x="2" y="1" solution="B" left-bar="true"/>
        <cell x="1" y="2" solution="C" number="2" top-bar="true"/>
        <cell x="2" y="2" solution="D" left-bar="true" top-bar="true"/>
      </grid>
      <word id="1" x="1-2" y="1"/>
      <word id="2" x="1-2" y="2"/>
      <word id="3" x="1" y="1-2"/>
      <word id="4" x="2" y="1-2"/>
      <clues>
        <title>Across</title>
        <clue word="1" number="1">Top row</clue>
        <clue word="2" number="2">Bottom row</clue>
      </clues>
      <clues>
        <title>Down</title>
        <clue word="3" number="1">Left col</clue>
        <clue word="4" number="2">Right col</clue>
      </clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler>`

    const res = crossCompilerXMLToXD(xml)
    expect(res).toContain("form: barred")
    expect(res).toContain("A { bar-left: true }")
    expect(res).toContain("B { bar-top: true }")
    expect(res).toContain("C { bar-left: true; bar-top: true }")
  })

  it("converts <instructions> into the Notes section", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler>
  <rectangular-puzzle>
    <metadata>
      <title>Notes test</title>
      <creator>Test</creator>
    </metadata>
    <instructions>Each answer is a word that can precede or follow "fire".</instructions>
    <crossword>
      <grid width="2" height="2">
        <cell x="1" y="1" solution="A" number="1"/>
        <cell x="2" y="1" solution="B"/>
        <cell x="1" y="2" solution="C" number="2"/>
        <cell x="2" y="2" solution="D"/>
      </grid>
      <word id="1" x="1-2" y="1"/>
      <word id="2" x="1-2" y="2"/>
      <word id="3" x="1" y="1-2"/>
      <word id="4" x="2" y="1-2"/>
      <clues>
        <title>Across</title>
        <clue word="1" number="1">Top</clue>
        <clue word="2" number="2">Bottom</clue>
      </clues>
      <clues>
        <title>Down</title>
        <clue word="3" number="1">Left</clue>
        <clue word="4" number="2">Right</clue>
      </clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler>`

    const res = crossCompilerXMLToXD(xml)
    expect(res).toContain("## Notes\n\nEach answer is a word that can precede or follow \"fire\".")
  })

  it("emits a Design section combining bars and circles", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler>
  <rectangular-puzzle>
    <metadata>
      <title>Circles</title>
      <creator>Test</creator>
    </metadata>
    <crossword>
      <grid width="2" height="2">
        <cell x="1" y="1" solution="A" number="1" background-shape="circle"/>
        <cell x="2" y="1" solution="B" left-bar="true"/>
        <cell x="1" y="2" solution="C" number="2"/>
        <cell x="2" y="2" solution="D" background-shape="circle" top-bar="true"/>
      </grid>
      <word id="1" x="1-2" y="1"/>
      <word id="2" x="1-2" y="2"/>
      <word id="3" x="1" y="1-2"/>
      <word id="4" x="2" y="1-2"/>
      <clues>
        <title>Across</title>
        <clue word="1" number="1">Top</clue>
        <clue word="2" number="2">Bottom</clue>
      </clues>
      <clues>
        <title>Down</title>
        <clue word="3" number="1">Left</clue>
        <clue word="4" number="2">Right</clue>
      </clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler>`

    const res = crossCompilerXMLToXD(xml)
    expect(res).toContain("background: circle")
    expect(res).toContain("bar-left: true")
    expect(res).toContain("bar-top: true; background: circle")
  })

  it("converts solve-state and hint cells into a Start section", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler>
  <rectangular-puzzle>
    <metadata>
      <title>Start</title>
      <creator>Test</creator>
    </metadata>
    <crossword>
      <grid width="3" height="2">
        <cell x="1" y="1" solution="C" number="1" solve-state="C"/>
        <cell x="2" y="1" solution="A"/>
        <cell x="3" y="1" solution="T" hint="true"/>
        <cell x="1" y="2" solution="O" number="2"/>
        <cell x="2" y="2" solution="W"/>
        <cell x="3" y="2" solution="L"/>
      </grid>
      <word id="1" x="1-3" y="1"/>
      <word id="2" x="1-3" y="2"/>
      <word id="3" x="1" y="1-2"/>
      <word id="4" x="3" y="1-2"/>
      <clues>
        <title>Across</title>
        <clue word="1" number="1">Feline</clue>
        <clue word="2" number="2">Night bird</clue>
      </clues>
      <clues>
        <title>Down</title>
        <clue word="3" number="1">Bovine</clue>
        <clue word="4" number="2">Past tense of tell</clue>
      </clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler>`

    const res = crossCompilerXMLToXD(xml)
    const start = res.split("## Start\n\n")[1].trim()
    // Row 1: C (solve-state), no fill, T (hint=true) → "C.T"
    // Row 2: no pre-fills → "..."
    expect(start).toBe("C.T\n...")
  })

  it("converts multi-letter cell solutions into rebuses", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler>
  <rectangular-puzzle>
    <metadata>
      <title>Rebus</title>
      <creator>Test</creator>
    </metadata>
    <crossword>
      <grid width="3" height="2">
        <cell x="1" y="1" solution="AB" number="1"/>
        <cell x="2" y="1" solution="C"/>
        <cell x="3" y="1" solution="D"/>
        <cell x="1" y="2" solution="E" number="2"/>
        <cell x="2" y="2" solution="F"/>
        <cell x="3" y="2" solution="G"/>
      </grid>
      <word id="1" x="1-3" y="1"/>
      <word id="2" x="1-3" y="2"/>
      <word id="3" x="1" y="1-2"/>
      <word id="4" x="3" y="1-2"/>
      <clues>
        <title>Across</title>
        <clue word="1" number="1">Letters one through four</clue>
        <clue word="2" number="2">Letters five through seven</clue>
      </clues>
      <clues>
        <title>Down</title>
        <clue word="3" number="1">Left col</clue>
        <clue word="4" number="2">Right col</clue>
      </clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler>`

    const res = crossCompilerXMLToXD(xml)
    expect(res).toContain("rebus: 0=AB")
    // Grid uses the symbol for the rebus cell
    expect(res).toContain("0CD\nEFG")
    // Clue answer contains the full multi-letter word
    expect(res).toContain("A1. Letters one through four ~ ABCD")
    expect(res).toContain("D1. Left col ~ ABE")
  })

  it("derives splits from a clue's format attribute when no word solution is given", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler>
  <rectangular-puzzle>
    <metadata>
      <title>Format splits</title>
      <creator>Test</creator>
    </metadata>
    <crossword>
      <grid width="5" height="2">
        <cell x="1" y="1" solution="N" number="1"/>
        <cell x="2" y="1" solution="E"/>
        <cell x="3" y="1" solution="W"/>
        <cell x="4" y="1" solution="U"/>
        <cell x="5" y="1" solution="P"/>
        <cell x="1" y="2" solution="A" number="2"/>
        <cell x="2" y="2" solution="B"/>
        <cell x="3" y="2" solution="C"/>
        <cell x="4" y="2" solution="D"/>
        <cell x="5" y="2" solution="E"/>
      </grid>
      <word id="1" x="1-5" y="1"/>
      <word id="2" x="1-5" y="2"/>
      <word id="3" x="1" y="1-2"/>
      <word id="4" x="5" y="1-2"/>
      <clues>
        <title>Across</title>
        <clue word="1" number="1" format="3,2">Started fresh</clue>
        <clue word="2" number="2" format="5">Plain word</clue>
      </clues>
      <clues>
        <title>Down</title>
        <clue word="3" number="1">Left</clue>
        <clue word="4" number="2">Right</clue>
      </clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler>`

    const res = crossCompilerXMLToXD(xml)
    expect(res).toContain("splitcharacter: |")
    expect(res).toContain("A1. Started fresh ~ NEW|UP")
    // format="5" matches the cell count exactly with no separators ⇒ no split
    expect(res).toContain("A2. Plain word ~ ABCDE")
  })

  it("attaches clue metadata for citation, hint-url, tags, and is-theme", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler>
  <rectangular-puzzle>
    <metadata>
      <title>Clue metadata</title>
      <creator>Test</creator>
    </metadata>
    <crossword>
      <grid width="2" height="2">
        <cell x="1" y="1" solution="A" number="1"/>
        <cell x="2" y="1" solution="B"/>
        <cell x="1" y="2" solution="C" number="2"/>
        <cell x="2" y="2" solution="D"/>
      </grid>
      <word id="1" x="1-2" y="1" is-theme="true"/>
      <word id="2" x="1-2" y="2"/>
      <word id="3" x="1" y="1-2"/>
      <word id="4" x="2" y="1-2"/>
      <clues>
        <title>Across</title>
        <clue word="1" number="1" citation="OED" hint-url="https://example.com/help" tags="theme,easy">Theme entry</clue>
        <clue word="2" number="2">Plain</clue>
      </clues>
      <clues>
        <title>Down</title>
        <clue word="3" number="1">Left</clue>
        <clue word="4" number="2">Right</clue>
      </clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler>`

    const res = crossCompilerXMLToXD(xml)
    expect(res).toContain("A1 ^citation: OED")
    expect(res).toContain("A1 ^hintURL: https://example.com/help")
    expect(res).toContain("A1 ^tags: theme,easy")
    expect(res).toContain("A1 ^theme: true")
  })

  it("parses the 69x69 Globe puzzle fixture", () => {
    const res = crossCompilerXMLToXD(globeXML)

    // Title is empty in the source, falls back to "Untitled".
    expect(res).toContain("title: Untitled")

    // The grid should be 69 rows of 69 cells.
    const grid = res.split("## Grid\n\n")[1].split("\n\n")[0]
    const rows = grid.split("\n")
    expect(rows.length).toBe(69)
    rows.forEach((row) => expect(row.length).toBe(69))

    // Spot-check known clues from the fixture.
    expect(res).toContain("A1. Go around ~ BYPASS")
    // Words whose <word solution="..."> contains spaces/hyphens are split
    // with `|`, matching the splitcharacter declared in the metadata.
    expect(res).toContain("splitcharacter: |")
    expect(res).toContain("A4. Kind of 14-Down in your car ~ REAR|VIEW")
    expect(res).toContain("A15. Richard Avedon or Sarah Moon, e.g. ~ FASHION|PHOTOGRAPHER")
    expect(res).toContain("D1. Fortitude or spine ~ BACKBONE")

    // It should round-trip through the xd parser without errors.
    const parsed = xdToJSON(res)
    expect(parsed.report.success).toBe(true)
    expect(parsed.tiles.length).toBe(69)
    expect(parsed.tiles[0].length).toBe(69)
    // Splits should be preserved on the parsed clues.
    const a4 = parsed.clues.across.find((c) => c.number === 4)
    expect(a4?.splits).toEqual([3])
  })
})
