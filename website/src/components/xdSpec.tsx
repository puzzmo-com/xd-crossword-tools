import React from "react"

const SPEC_URL = "https://github.com/century-arcade/xdformat/blob/master/doc/xd-format-v4.md"

export const XDSpec = () => {
  return (
    <div className="xd-format-docs">
      <div className="docs-header">
        <a href={SPEC_URL} target="_blank" rel="noopener noreferrer" className="source-link">
          View on GitHub →
        </a>
      </div>

      <h1>.xd futureproof crossword format 4.0</h1>

      <p>
        .xd is a corpus-oriented format, modeled after the simplicity and intuitiveness of the markdown format. It supports 99.99% of
        published crosswords, and is intended to be convenient for bulk analysis of crosswords by both humans and machines, from the present
        and into the future.
      </p>

      <p>
        This site follows xd v4. Older files still parse, but deprecated syntax shows up as warnings: use the <strong>Migrate to v4</strong>{" "}
        button above the editor (or <code>migrateXDToV4(xd)</code> from <code>xd-crossword-tools</code>) to rewrite a file into v4 syntax.
        The migration adds section headings, converts legacy xdown links/images/colors to the attribute form, drops the{" "}
        <code>&lt;style&gt;</code> wrapper from designs, moves v3 <code>Special:</code> cells into a Design section, and escapes{" "}
        <code> ~ </code> inside clue bodies. Rebuses and Schrödinger squares are left untouched.
      </p>

      <h2>Tools</h2>

      <ul>
        <li>
          The{" "}
          <a href="https://github.com/century-arcade/xdformat" target="_blank" rel="noopener noreferrer">
            <code>xdformat</code>
          </a>{" "}
          Python package has the reference parser and serializer, and converters from Across-Lite .puz (<code>puz2xd</code>) and .ipuz (
          <code>ipuz2xd</code>).
        </li>
        <li>
          The full download/convert/analyze pipeline, including the <code>xdlint.py</code> validator, lives at{" "}
          <a href="https://github.com/century-arcade/xd" target="_blank" rel="noopener noreferrer">
            century-arcade/xd
          </a>
          .
        </li>
        <li>
          <code>xd-crossword-tools</code> (this site) parses xd into JSON, and converts between xd and .puz, .jpz, .ipuz, UClick XML and
          Amuse JSON.
        </li>
      </ul>

      <h2>Full Example</h2>

      <p>
        This is the oldest rebus crossword from the New York Times (found by <code>grep -r Rebus crosswords/nytimes | sort</code>),
        available thanks to the huge effort of the{" "}
        <a href="http://www.preshortzianpuzzleproject.com/" target="_blank" rel="noopener noreferrer">
          Pre-Shortzian Puzzle Project
        </a>
        :
      </p>

      <pre className="code-example">
        {`## Metadata

Title: New York Times, Saturday, January 1, 1955
Author: Anthony Morse
Editor: Margaret Farrar
Rebus: 1=HEART 2=DIAMOND 3=SPADE 4=CLUB
Date: 1955-01-01

## Grid

1ACHE#ADAM#2LIL
BLUER#GULL#MATA
EATIN#APEX#ICER
ATAR#TILE#SNEAK
TEN#MANI#ITE###
##DRUB#CANASTAS
FADED#BAGGY#OIL
ONES#KATES#TUNA
ETA#JOKER#JORUM
SILLABUB#SOON##
###ACE#RUIN#ARK
3WORK#JINX#4MAN
BIRD#WADS#SCENE
ISLE#EDGE#PANEL
DEER#BEET#ARTEL

## Clues

A1. Sadness. ~ HEARTACHE
A6. Progenitor. ~ ADAM
A10. Mae West stand-by. ~ DIAMONDLIL
[...]

D1. Vital throb. ~ HEARTBEAT
D2. Having wings. ~ ALATE
D3. Start the card game. ~ CUTANDDEAL
[...]`}
      </pre>

      <h2>Format specification</h2>

      <p>The .xd format is a simple UTF-8 text file, and can often be 7-bit ASCII clean.</p>

      <p>
        A file is divided into sections. A section should start with a <code>## [Section Name]</code> heading, which declares the lines after
        it as that section. Headings are case-insensitive, and a section whose heading is not <code>"metadata"</code>, <code>"grid"</code>,{" "}
        <code>"clues"</code> or <code>"design"</code> is ignored (Puzzmo adds a few more, see below). Order is unimportant.
      </p>

      <h3>Implicit sections</h3>

      <p>
        Headings are not required. In a file with no headings at all, sections are delineated by two or more blank lines (3 consecutive
        newlines) and are read in a fixed order: metadata, grid, clues, and then notes for anything following. A design section has no place
        in that order, so a file using one needs headings. New files should use headings.
      </p>

      <details className="example-details">
        <summary>The full example above, written without headings.</summary>
        <div className="example-block">
          <pre>
            {`Title: New York Times, Saturday, January 1, 1955
Author: Anthony Morse
Editor: Margaret Farrar
Rebus: 1=HEART 2=DIAMOND 3=SPADE 4=CLUB
Date: 1955-01-01


1ACHE#ADAM#2LIL
BLUER#GULL#MATA
[...]


A1. Sadness. ~ HEARTACHE
A6. Progenitor. ~ ADAM
[...]`}
          </pre>
        </div>
      </details>

      <h3>Metadata</h3>

      <p>
        The metadata section is a set of <code>Key: value</code> fields, one per line. Title, Author, Editor, Copyright, and Date are the
        standard fields. Other fields describing the puzzle semantics are given below. Additional fields are allowed but will be ignored.
        Multiple fields with the same key are not allowed.
      </p>

      <p>
        Field keys are case-insensitive: <code>Title:</code>, <code>title:</code> and <code>TITLE:</code> are equivalent. Writers should
        emit them in titlecase (xd-crossword-tools writes them lowercase). Metadata values may contain <a href="#xdown">xdown</a> markup, e.g. <code>{`Title: {/Moby-Dick/} Mini`}</code>
        .
      </p>

      <h3>Grid</h3>

      <p>Optional leading whitespace and trailing whitespace on each line. Never any whitespace between characters in a grid line.</p>

      <p>
        One line per row. One Unicode codepoint per cell. Cell contents of more than one codepoint (including multi-codepoint graphemes like
        emoji with modifiers) are represented as rebuses.
      </p>

      <ul>
        <li>Uppercase A-Z refer to that letter in the solution</li>
        <li>
          Either <code>#</code> or <code>.</code> is a block
        </li>
        <li>
          <code>_</code> means a spacer or non-existing square (usually on the edges), which is not drawn
        </li>
        <li>
          <code>?</code> is an unfilled cell: it takes a letter, but its solution isn't known yet (an unsolved puzzle, or a grid still
          being constructed). Answers write an unfilled cell as <code>?</code> too, e.g. <code>~ C?NE</code>
        </li>
        <li>Any other character is assumed to be a rebus lookup</li>
      </ul>

      <p>
        Digits, most symbols other than <code>#</code>, <code>.</code>, <code>_</code> and <code>?</code>, and printable unicode
        characters (if needed) can be used to indicate rebus cells. The <code>Rebus</code> field
        provides the translation:
      </p>

      <div className="example-block">
        <pre>Rebus: 1=ONE 2=TWO 3=THREE</pre>
      </div>

      <p>The same key may be assigned more than one value; such a cell accepts any one of its values (a Schrödinger cell):</p>

      <div className="example-block">
        <pre>Rebus: 1=O 1=A</pre>
      </div>

      <h3>Clues</h3>

      <p>
        A leading <code>A</code> or <code>D</code> indicates whether the clue is Across or Down. For{" "}
        <a href="https://www.xwordinfo.com/Uniclue" target="_blank" rel="noopener noreferrer">
          uniclue
        </a>{" "}
        puzzles, where each number carries a single clue covering both entries starting at that square, the letter is omitted:
      </p>

      <div className="example-block">
        <pre>
          {`1. Reposition an icon, maybe ~ DRAGANDDROP
2. Crowd's sound ~ ROAR`}
        </pre>
      </div>

      <p>The clues should be sorted, with a single newline separating clue groups (Across and then Down).</p>

      <h4>Clue lines</h4>

      <div className="example-block">
        <pre>
          {`A1. Big name in bricks? ~ LEGO
^^  ^^^^^^^^^^^^^^^^^^^   ^^^^
|   |                     answer
|   clue body
clue reference`}
        </pre>
      </div>

      <p>
        The reference runs to the first <code>.</code> on the line, and the clue body from there to the first <code> ~ </code> (a tilde with
        spaces on both sides). After each <code> ~ </code> the answer is the first word; anything else in that segment is ignored:
      </p>

      <div className="example-block">
        <pre>A6. Book look-up ~ INDEX (5 letters)</pre>
      </div>

      <p>
        is the clue 'Book look-up' with the single answer <code>INDEX</code>. The full answer should be given with any rebuses expanded;
        rebus keys never appear in answers. [This makes clue/answer lines independently useful.]
      </p>

      <p>
        A clue is followed by one or more answers, all separated by <code> ~ </code>. Most clues have exactly one, but a slot with multiple
        valid fills (a Schrödinger slot) lists each of them:
      </p>

      <div className="example-block">
        <pre>
          {`Rebus: 1=O 1=A

C1NE

A1. Sugar ___ ~ CONE ~ CANE`}
        </pre>
      </div>

      <p>
        A clue body which needs a literal <code> ~ </code> writes the tilde as an xdown literal: <code>{`{\\~\\}`}</code>.
      </p>

      <h4>Clue metadata</h4>

      <p>
        To attach metadata to a clue, on a new line after the clue replace the <code>". "</code> with a <code>" ^"</code> - the key for the
        metadata is everything between the hat and the colon:
      </p>

      <div className="example-block">
        <pre>
          {`A1. Gardener's concerns with A2 and D4. ~ BULB
A1 ^Refs: A2 D4`}
        </pre>
      </div>

      <p>
        Clue metadata keys are case-insensitive: <code>^Refs:</code>, <code>^refs:</code> and <code>^REFS:</code> are the same key. Writers
        should emit them in titlecase (xd-crossword-tools writes them lowercase). The xd spec does not reserve any keys (Puzzmo uses <code>^Hint:</code> and <code>^Refs:</code>).
      </p>

      <h3>Design (optional section)</h3>

      <p>
        A <code>## Design</code> section describes per-cell visual attributes: circles, shading, bars, and images. It replaces the v3{" "}
        <code>Special:</code> field which marked lowercase grid cells as "shaded" or "circle".
      </p>

      <p>
        The section starts with one or more CSS-like style rules, each assigning properties to a single (case-sensitive) character, followed
        by a design grid the same size as the puzzle grid. Styled cells use their style character, and unstyled cells use <code>.</code>.
        There is no <code>&lt;style&gt;</code> wrapper: the design grid starts at the first non-blank line after the last rule's closing{" "}
        <code>{`}`}</code>.
      </p>

      <div className="example-block">
        <pre>
          {`## Design

O { background: circle }
S { background: shaded }

...O...
..OSO..
...O...`}
        </pre>
      </div>

      <p>Defined properties:</p>

      <ul>
        <li>
          <code>background: circle</code> - a circle in the cell
        </li>
        <li>
          <code>background: shaded</code> - the cell is shaded; the renderer chooses the color
        </li>
        <li>
          <code>background-image: url('...')</code> - an image drawn in the cell, either a data URI (preferred, it keeps the file
          self-contained) or a link. The quotes are required
        </li>
        <li>
          <code>background-size: N M</code> - the image spans N cells to the right and M cells downward, defaults to <code>1 1</code>. A
          multi-cell image is only marked at its top-left cell
        </li>
        <li>
          <code>bar-top: true</code> - a bar on the top edge of the cell
        </li>
        <li>
          <code>bar-left: true</code> - a bar on the left edge of the cell
        </li>
      </ul>

      <p>
        A grid whose design uses <code>bar-top</code> or <code>bar-left</code> is a barred grid; no extra metadata is needed.
        Barred grids don't support rebuses or Schrödinger squares yet.
      </p>

      <p>The rule parser handles:</p>

      <ul>
        <li>
          Whitespace around selectors, keys and values being trimmed, while whitespace inside a value is kept (
          <code>background-size: 2 2</code>). Rules may span several lines
        </li>
        <li>
          Re-opening a character: <code>{`A { background: circle }`}</code> then <code>{`A { bar-top: true }`}</code>
        </li>
        <li>
          Many characters at once with a comma: <code>{`A, B { background: circle }`}</code>
        </li>
        <li>
          Many properties separated by semicolons, with an optional trailing semicolon: <code>{`A { background: circle; bar-top: true; }`}</code>
        </li>
        <li>
          Quoted values, inside which <code>{`}`}</code>, <code>:</code>, <code>;</code> and <code>,</code> are not delimiters
        </li>
        <li>
          Commas are never separators inside a rule body: <code>background-size: 2 2</code>, never <code>background-size: 2, 2</code>
        </li>
      </ul>

      <div className="example-block">
        <pre>
          {`## Design

A, B {
  background: circle;
  bar-top: true;
}
I { background-image: url('https://example.com/petal.png'); background-size: 2 2 }

I....
...A.
.B...`}
        </pre>
      </div>

      <h3 id="xdown">xdown formatting</h3>

      <p>
        Clue bodies and metadata values may contain inline markup, known as xdown. A span is an opening <code>{`{`}</code>, a type
        character, the content, the same type character again, and a closing <code>{`}`}</code>. Metadata keys, answers and the grid are
        plain text.
      </p>

      <p>Text styles, which nest (a renderer applies every enclosing style):</p>

      <ul>
        <li>
          <code>{`{/italic/}`}</code>
        </li>
        <li>
          <code>{`{*bold*}`}</code>
        </li>
        <li>
          <code>{`{_underscore_}`}</code>
        </li>
        <li>
          <code>{`{-strike-through-}`}</code>
        </li>
        <li>
          <code>{`{~subscript~}`}</code>
        </li>
        <li>
          <code>{`{^superscript^}`}</code>
        </li>
        <li>
          <code>{`{=small caps=}`}</code>
        </li>
      </ul>

      <div className="example-block">
        <pre>
          {`A51. {/Italic/}, {*bold*}, {_underscore_}, or {-strike-thru-} ~ MARKUP
A15. Captain in {/{*Moby-Dick*}/} ~ AHAB`}
        </pre>
      </div>

      <p>
        Links and images take attributes: the content, then a <code>|</code>, then <code>key: value</code> pairs separated by{" "}
        <code>;</code>, written like a Design rule body. A value containing <code>;</code> (like a data URI) must be quoted. The attributes
        start at the first <code>|</code> outside of any nested span, so the content can contain markup. Unknown attributes are ignored.
      </p>

      <ul>
        <li>
          Link: <code>{`{@text | href: https://example.com@}`}</code>
        </li>
        <li>
          Image: <code>{`{!alt text | src: https://example.com/whale.png!}`}</code>, with optional <code>width</code>,{" "}
          <code>height</code> and <code>display</code> (<code>inline</code>, the default, or <code>block</code> for its own line)
        </li>
      </ul>

      <div className="example-block">
        <pre>
          {`A16. See {@{*the notes*} | href: https://example.com@} ~ AHAB
A17. Pictured: {!A sperm whale | src: https://example.com/whale.png; width: 100; height: 50; display: block!} ~ AHAB
A18. Tiny: {!A dot | src: 'data:image/png;base64,iVBORw0KGgo='!} ~ DOT`}
        </pre>
      </div>

      <p>
        Literals turn markup off: nothing inside <code>{`{\\literal\\}`}</code> is interpreted. This is how a clue body writes{" "}
        <code> ~ </code> (keeping the spaces outside the literal), or a <code>{`{`}</code> followed by a type character. An empty literal,{" "}
        <code>{`{\\\\}`}</code>, is a line break. The backslash has no meaning outside a literal.
      </p>

      <div className="example-block">
        <pre>
          {`A1. What {\\~\\} means in π {\\~\\} 3.14 ~ ROUGHLY
A2. Empty set {\\{}\\} ~ NULL
A3. First line{\\\\}second line ~ BREAK`}
        </pre>
      </div>

      <p>
        Every ASCII punctuation character is reserved as a type character: <code>{"! \" # $ % & ' ( ) * + , - . / : ; < = > ? @ [ \\ ] ^ _ ` { | } ~"}</code>.
        Those without a defined meaning are held for future span types. A <code>{`{`}</code> followed by anything else (a letter, digit,
        space...) is literal text, so most clues need no escaping.
      </p>

      <p>
        The older positional forms (<code>{`{@text|url@}`}</code>, <code>{`{![url|alt]!}`}</code>, <code>{`{!![url]!}`}</code>,{" "}
        <code>{`{#text|light|dark#}`}</code>) still parse, but report deprecation warnings.
      </p>

      <h2>Puzzmo extensions</h2>

      <p>
        These are supported by <code>xd-crossword-tools</code> but are not part of the xd spec, so a strictly conforming parser may not
        understand them.
      </p>

      <h3>Extension: Notes section</h3>

      <p>
        A <code>## Notes</code> section holds free-form text about the puzzle.
      </p>

      <h3>Extension: Start section</h3>

      <p>
        A <code>## Start</code> grid pre-fills letters for the solver, using <code>.</code> for empty cells and <code>#</code> for blocks:
      </p>

      <div className="example-block">
        <pre>
          {`## Start

GO..##FOR#IT...
.....#...#.....`}
        </pre>
      </div>

      <h3>Extension: Metapuzzle section</h3>

      <p>
        A <code>## Metapuzzle</code> section holds a meta clue, with the answer on a line starting with <code>&gt;</code>:
      </p>

      <div className="example-block">
        <pre>
          {`## Metapuzzle

What do the starred answers have in common?

> CATS`}
        </pre>
      </div>

      <h3>Extension: Split character</h3>

      <p>
        Declare <code>SplitCharacter: |</code> in the metadata, then add an annotation to the end of the clue line after a{" "}
        <code>//</code>: each word in it is one of the answers written with the split character marking where one word ends and the
        next begins. v4 only reads the first word of an answer, so the annotation doesn't change the answers, and the split positions
        are recorded on each entry of the clue's <code>answers</code>. Without a declared split character, <code>|</code> is used.
      </p>

      <div className="example-block">
        <pre>{`D25. Father of Spider-Man ~ STANLEE // STAN|LEE
D26. Band ~ OKGO ~ OKAY // OK|GO OK|AY`}</pre>
      </div>

      <p>
        Older files put the split character inside the answer (<code>~ STAN|LEE</code>). That still works but is deprecated, and{" "}
        <code>migrateXDToV4</code> converts it.
      </p>

      <h3>Extension: Colors</h3>

      <p>Inline text colors in xdown, with a color for light and dark themes:</p>

      <div className="example-block">
        <pre>{`A18. The {#red | light: #c00000; dark: #ff6666#} planet ~ MARS`}</pre>
      </div>

      <p>And per-cell background colors in the Design section:</p>

      <div className="example-block">
        <pre>{`R { background-light: #FF69B4; background-dark: #C71585 }`}</pre>
      </div>

      <h3>Extension: Schrödinger squares</h3>

      <p>
        Besides multi-valued rebus keys (<code>Rebus: 1=O 1=A</code>), which can also hold multiple letters (<code>Rebus: 1=OR 1=AR</code>),
        a <code>*</code> in the grid marks a Schrödinger square, with the alternative answers given in <code>^alt</code> clue metadata (
        <code>^alt</code>, <code>^alt2</code>, ...):
      </p>

      <div className="example-block">
        <pre>
          {`## Grid

TILE
APEX
C*NE
ODDS

## Clues

A6. Sugar ____ ~ CONE
A6 ^alt: CANE

D2. Apple tech ~ IPOD
D2 ^alt: IPAD`}
        </pre>
      </div>

      <h2>CHANGELOG</h2>

      <h3>4.0</h3>

      <ul>
        <li>[BREAKING] Capitals in the grid no longer indicate special blocks (use the Design section)</li>
        <li>
          [BREAKING] <code>.</code> can now be used as a block
        </li>
        <li>[BREAKING] The 'Cluegroup' field is dropped</li>
        <li>Section headings are recommended, and required to use a design section; the implicit section order is still valid</li>
        <li>A grid cell holds exactly one Unicode codepoint; larger graphemes are rebuses</li>
        <li>Metadata field keys and clue metadata keys are case-insensitive; writers should emit titlecase</li>
        <li>Metadata fields can be xdown formatted</li>
        <li>A rebus key may be assigned multiple values, declaring a Schrödinger cell</li>
        <li>
          The <code>## Design</code> section (adopted from Puzzmo's extension, without its <code>&lt;style&gt;</code> wrapper) replaces the
          'Special' field and lowercase special cells
        </li>
        <li>Barred grids and background images can be represented</li>
        <li>
          A clue line holds a <code> ~ </code>-separated list of answers; an answer is a single word and text following it is ignored
        </li>
        <li>Markup adds subscript, superscript, and small caps, and formally nests</li>
        <li>
          Links and images take named attributes (<code>href</code>, <code>src</code>, <code>display</code>) rather than positional parts
        </li>
        <li>
          A <code>{`{\\literal\\}`}</code> span replaces backslash escapes, and <code>{`{\\\\}`}</code> is a line break
        </li>
      </ul>

      <h3>3.0</h3>

      <p>Includes syntax support for arbitrary clue metadata.</p>

      <h3>2.0</h3>

      <p>
        Adds support for <code>## [Section Name]</code> headings for sections of xd content.
      </p>
    </div>
  )
}
