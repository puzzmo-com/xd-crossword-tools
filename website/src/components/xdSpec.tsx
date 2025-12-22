import React from "react"

export const XDSpec = () => {
  return (
    <div className="xd-format-docs">
      <div className="docs-header">
        <a
          href="https://github.com/century-arcade/xd/blob/master/doc/xd-format.md"
          target="_blank"
          rel="noopener noreferrer"
          className="source-link"
        >
          View on GitHub →
        </a>
      </div>

      <h1>.xd futureproof crossword format 3.0</h1>

      <p>
        .xd is a corpus-oriented format, modeled after the simplicity and intuitiveness of the markdown format. It supports 99.99% of
        published crosswords, and is intended to be convenient for bulk analysis of crosswords by both humans and machines, from the present
        and into the future.
      </p>

      <h2>xdfile.py</h2>

      <ul>
        <li>
          <code>xdfile.py</code> has a simple parser for v1 .xd files with example code that answers some simple queries, like "what is the
          most used grid in this .zip of .xd files?"
        </li>
        <li>
          <code>puz2xd.py</code> will convert Across-Lite .puz format to .xd. Scripts to convert other formats are also in <code>src/</code>
          .
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
        {`Title: New York Times, Saturday, January 1, 1955
Author: Anthony Morse
Editor: Margaret Farrar
Rebus: 1=HEART 2=DIAMOND 3=SPADE 4=CLUB
Date: 1955-01-01


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

      <p>The file is specified in one of two methods:</p>

      <ul>
        <li>Using an implicit order, with sections being delineated by two or more blank lines (3 consecutive newlines (0x0A)).</li>
        <li>
          Using <code>## [Section Name]</code> to declare the lines after as a certain section. Sections with case-insensitive headers which
          are not <code>"metadata"</code>, <code>"grid"</code> or <code>"clues"</code> are ignored. Order is unimportant.
        </li>
      </ul>

      <details className="example-details">
        <summary>An example of the previous full example using the explicit headers.</summary>
        <div className="example-block">
          <pre>
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
        </div>
      </details>

      <h3>Metadata (Section 1)</h3>

      <p>
        The first section is a set of key:value pairs, one per line. Title, Author, Editor, Copyright, and Date are the standard headers in
        the meta section. Other headers describing the puzzle semantics are given below. Additional headers are allowed but will be ignored.
        Multiple entries with the same key are not allowed.
      </p>

      <h3>Grid (Section 2)</h3>

      <p>Optional leading whitespace and trailing whitespace on each line. Never any whitespace between characters in a grid line.</p>

      <p>One line per row. One UTF-8 character per cell.</p>

      <p>
        Uppercase A-Z refer to that letter in the solution; a <code>#</code> is a block. In a few puzzles, <code>_</code> means a space or
        non-existing block (usually on the edges), and <code>.</code> would be used for an empty cell (e.g. a partial solution).
      </p>

      <p>Lowercase a-z indicate Special cells. The 'Special' header indicates whether those cells are "shaded" or have a "circle".</p>

      <div className="example-block">
        <pre>Special: shaded</pre>
      </div>

      <p>
        Digits, most symbols, and printable unicode characters (if needed) can be used to indicate rebus cells. The 'Rebus' header provides
        the translation:
      </p>

      <div className="example-block">
        <pre>Rebus: 1=ONE 2=TWO 3=THREE</pre>
      </div>

      <p>
        Lowercase letters always indicate Special cells if there is a Special header. If a puzzle has cells that are both Special and Rebus,
        a lowercase letter should be used, and set to its value in the Rebus header.
      </p>

      <h3>Clues (Section 3)</h3>

      <p>
        A leading uppercase letter indicates the group the clue is in. 'A' or 'D' indicate Across or Down; the full heading for other
        letters would be specified in the 'Cluegroup' header. For uniclues, the cluegroup letter is omitted.
      </p>

      <p>The clues should be sorted, with a single newline separating clue groups (Across and Down).</p>

      <p>Minimal markup is available. An example clue line:</p>

      <div className="example-block">
        <pre>A51. {`{/Italic/}, {*bold*}, {_underscore_}, or {-strike-thru-} ~ MARKUP`}</pre>
      </div>

      <p>
        The clue is separated from the answer by a tilde with spaces on both sides (<code> ~ </code>).
      </p>

      <p>The full answer should be provided, including rebus expansion. [This makes clue/answer lines independently useful.]</p>

      <p>
        The backslash (<code>\</code>) is used as a line separator in the rare case of a multi-line clue.
      </p>

      <p>
        If you need to attach metadata to a clue, on a new line after the clue replace the <code>". "</code>
        with a <code>" ^"</code> - the key for the metadata is determined as being inbetween the hat and colon:
      </p>

      <div className="example-block">
        <pre>
          {`A1. Gardener's concerns with A2 and D4. ~ BULB
A1 ^Refs: A2 D4`}
        </pre>
      </div>

      <h3>Notes (Section 4)</h3>

      <p>The free-format final section can contain any amount of notes.</p>

      <h2>CHANGELOG</h2>

      <h3>3.0</h3>

      <p>Includes syntax support for arbitrary clue metadata.</p>

      <h3>2.0</h3>

      <p>
        The 2.0 version of the specification adds support for <code>## [headers]</code> for sections of xd content. You can read more in{" "}
        <a
          href="https://github.com/century-arcade/xd/blob/master/doc/xd-format.md#format-specification"
          target="_blank"
          rel="noopener noreferrer"
        >
          format specification
        </a>{" "}
        above.
      </p>
    </div>
  )
}
