// Forked from:
// https://github.com/downforacross/puzjs/blob/master/src/puz.js

// ISC License (ISC)
// Copyright 2018 Steven Hao

// Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

//
// reference: https://code.google.com/archive/p/puz/wikis/FileFormat.wiki

// === ENCODE ===
//
// The upstream encoder stubbed out every checksum and wrote numbers big-endian, which produced files
// that Across Lite (and other strict readers) refuse to open. This follows the spec in full:
// all numbers are little-endian, and every checksum is computed.

/** The shape `encode` accepts, `meta.notes` (or `meta.description`, which is what `decode` produces) becomes the notes string */
export interface PuzEncodeInput {
  grid: string[][]
  meta: { title?: string; author?: string; copyright?: string; notes?: string; description?: string }
  clues: { across: (string | undefined)[]; down: (string | undefined)[] }
  circles?: number[]
  shades?: number[]
  /** Letters the player starts with, indexed like the grid; anything not a letter is left empty */
  progress?: (string | undefined)[][]
  /** Indexes of squares whose progress letter was given rather than solved, e.g. pre-filled squares */
  given?: number[]
  /** Additional sections to append, codes must be 4 uppercase letters and data at most 65535 bytes */
  extraSections?: { code: string; data: Uint8Array }[]
}

// Windows-1252 has printable characters in 0x80-0x9F where Latin-1 has control codes, .puz readers
// treat strings as Windows-1252 so this is where curly quotes, dashes and ellipses live.
const cp1252: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91,
  0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98,
  0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
}

function charToByte(char: string): number {
  const code = char.codePointAt(0)!
  if (code < 0x80 || (code >= 0xa0 && code <= 0xff)) return code
  if (cp1252[code] !== undefined) return cp1252[code]
  // Try dropping accents (e.g. "ő" -> "o") before giving up
  const stripped = char.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  if (stripped.length === 1 && stripped !== char) return charToByte(stripped)
  return "?".charCodeAt(0)
}

function strToBytes(str: string | undefined, nulTerminate = true): Uint8Array {
  const bytes = Array.from(str || "", charToByte)
  if (nulTerminate) bytes.push(0)
  return Uint8Array.from(bytes)
}

function u16(val: number): Uint8Array {
  return Uint8Array.from([val & 0xff, (val >> 8) & 0xff])
}

function concat(byteArrays: Uint8Array[]) {
  const result = new Uint8Array(byteArrays.reduce((total, bytes) => total + bytes.length, 0))
  let currentIndex = 0
  for (const bytes of byteArrays) {
    result.set(bytes, currentIndex)
    currentIndex += bytes.length
  }
  return result
}

function checksumRegion(bytes: Uint8Array, cksum = 0) {
  for (let i = 0; i < bytes.length; i++) {
    cksum = cksum & 1 ? (cksum >> 1) | 0x8000 : cksum >> 1
    cksum = (cksum + bytes[i]) & 0xffff
  }
  return cksum
}

function extension(code: string, data: Uint8Array) {
  return concat([strToBytes(code, false), u16(data.length), u16(checksumRegion(data)), data, Uint8Array.of(0)])
}

function rebusExtensions(puzzle: PuzEncodeInput) {
  const sols: string[] = []
  const grbs = new Uint8Array(puzzle.grid.length * puzzle.grid[0].length)
  let idx = 0
  for (const row of puzzle.grid) {
    for (const cell of row) {
      if (cell && cell.length > 1) {
        if (!sols.includes(cell)) sols.push(cell)
        grbs[idx] = sols.indexOf(cell) + 1
      }
      idx += 1
    }
  }
  if (!sols.length) return new Uint8Array(0)

  // dict string format is k1:v1;k2:v2;...;kn:vn; where the key is the GRBS value minus 1, padded to 2 chars
  const rtbl = sols.map((sol, i) => `${i < 10 ? " " : ""}${i}:${sol};`).join("")
  return concat([extension("GRBS", grbs), extension("RTBL", strToBytes(rtbl, false))])
}

function markupExtension(puzzle: PuzEncodeInput) {
  const circles = puzzle.circles || []
  const shades = puzzle.shades || []
  const given = puzzle.given || []
  if (circles.length + shades.length + given.length === 0) return new Uint8Array(0)

  const markup = new Uint8Array(puzzle.grid.length * puzzle.grid[0].length)
  for (const i of circles) markup[i] |= 0x80
  for (const i of shades) markup[i] |= 0x08
  for (const i of given) markup[i] |= 0x40
  return extension("GEXT", markup)
}

// .puz format documentation: https://code.google.com/archive/p/puz/wikis/FileFormat.wiki
function encodePuz(puzzle: PuzEncodeInput) {
  const width = puzzle.grid[0].length
  const height = puzzle.grid.length

  // Rebus squares only keep their first letter in the solution, the full answer lives in GRBS/RTBL
  const solution = strToBytes(puzzle.grid.map((row) => row.map((cell) => (cell === "." ? "." : cell.substring(0, 1))).join("")).join(""), false)
  const progress = strToBytes(
    puzzle.grid
      .map((row, r) =>
        row
          .map((cell, c) => {
            if (cell === ".") return "."
            const entry = puzzle.progress?.[r]?.[c]
            return entry && /^[^.\-\s]/.test(entry) ? entry.substring(0, 1) : "-"
          })
          .join(""),
      )
      .join(""),
    false,
  )

  // Ordered numerically, breaking ties by across before down
  const clues: string[] = []
  const { across, down } = puzzle.clues
  for (let i = 0; i < across.length || i < down.length; i++) {
    if (across[i] !== undefined) clues.push(across[i]!)
    if (down[i] !== undefined) clues.push(down[i]!)
  }

  const title = strToBytes(puzzle.meta.title)
  const author = strToBytes(puzzle.meta.author)
  const copyright = strToBytes(puzzle.meta.copyright)
  const clueBytes = clues.map((clue) => strToBytes(clue))
  const notes = strToBytes(puzzle.meta.notes ?? puzzle.meta.description)

  // Width, height, clue count, the "unknown" bitmask (always 1 in the wild) and the scrambled tag
  const cib = concat([Uint8Array.of(width, height), u16(clues.length), u16(1), u16(0)])

  // Title/author/copyright/notes include their NUL terminator but only when non-empty, clues never do
  const textChecksum = (cksum: number) => {
    for (const str of [title, author, copyright]) if (str.length > 1) cksum = checksumRegion(str, cksum)
    for (const clue of clueBytes) cksum = checksumRegion(clue.subarray(0, -1), cksum)
    if (notes.length > 1) cksum = checksumRegion(notes, cksum)
    return cksum
  }

  const cibChecksum = checksumRegion(cib)
  const solutionChecksum = checksumRegion(solution)
  const progressChecksum = checksumRegion(progress)
  const textOnlyChecksum = textChecksum(0)
  const globalChecksum = textChecksum(checksumRegion(progress, checksumRegion(solution, cibChecksum)))

  const maskedLow = Uint8Array.of(
    0x49 ^ (cibChecksum & 0xff),
    0x43 ^ (solutionChecksum & 0xff),
    0x48 ^ (progressChecksum & 0xff),
    0x45 ^ (textOnlyChecksum & 0xff),
  )
  const maskedHigh = Uint8Array.of(
    0x41 ^ (cibChecksum >> 8),
    0x54 ^ (solutionChecksum >> 8),
    0x45 ^ (progressChecksum >> 8),
    0x44 ^ (textOnlyChecksum >> 8),
  )

  return concat([
    u16(globalChecksum), // offset  0
    strToBytes("ACROSS&DOWN"), // offset  2
    u16(cibChecksum), // offset 14
    maskedLow, // offset 16
    maskedHigh, // offset 20
    strToBytes("1.3"), // offset 24
    new Uint8Array(2), // offset 28, reserved
    u16(0), // offset 30, scrambled checksum
    new Uint8Array(12), // offset 32, reserved
    cib, // offset 44
    solution, // offset 52
    progress, // offset 52 + SIZE
    title,
    author,
    copyright,
    ...clueBytes,
    notes,
    rebusExtensions(puzzle),
    markupExtension(puzzle),
    ...(puzzle.extraSections || []).map((section) => {
      if (!/^[A-Z]{4}$/.test(section.code)) throw new Error(`Invalid .puz section code: ${section.code}`)
      if (section.data.length > 0xffff) throw new Error(`The ${section.code} section is too large for a .puz file`)
      return extension(section.code, section.data)
    }),
  ])
}

// === DECODE ===

var _extends =
  Object.assign ||
  function (target: Record<string, any>) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i]
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key]
        }
      }
    }
    return target
  }

// This looks like C&P'd minified code, so I'm jamming some tsignores
var _slicedToArray = (function () {
  function sliceIterator(arr: any[], i: number) {
    var _arr = []
    var _n = true
    var _d = false
    var _e = undefined
    try {
      // @ts-ignore
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value)
        if (i && _arr.length === i) break
      }
    } catch (err) {
      _d = true
      _e = err
    } finally {
      try {
        // @ts-ignore
        if (!_n && _i["return"]) _i["return"]()
      } finally {
        if (_d) throw _e
      }
    }
    return _arr
  }
  return function (arr: any[], i: number) {
    if (Array.isArray(arr)) {
      return arr
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i)
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance")
    }
  }
})()

type Sections = Map<string, { data: Uint8Array; checksumValid: boolean }>

/**
 * Walks the extra sections which come after the strings: each one is a 4 char code, a little-endian
 * length and checksum, the data, and a NUL terminator.
 */
function readSections(bytes: Uint8Array, offset: number): Sections {
  var sections: Sections = new Map()
  while (offset + 8 <= bytes.length) {
    var code = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
    if (!/^[A-Z]{4}$/.test(code)) break
    var length = bytes[offset + 4] | (bytes[offset + 5] << 8)
    var checksum = bytes[offset + 6] | (bytes[offset + 7] << 8)
    var data = bytes.subarray(offset + 8, offset + 8 + length)
    if (data.length !== length) break
    sections.set(code, { data: data, checksumValid: checksumRegion(data) === checksum })
    offset += 8 + length + 1
  }
  return sections
}

/**
 * The original lookup, which scans the whole file for the section's code. Only used when the
 * sections can't be walked (e.g. a file with a malformed string section) as it can false-match
 * on clue text.
 */
function scanForSection(bytes: Uint8Array, code: string) {
  var i = 0,
    j = 0
  for (i = 0; i < bytes.length; i += 1) {
    if (j === code.length) break
    if (bytes[i] === code.charCodeAt(j)) {
      j += 1
    } else {
      j = 0
    }
  }
  if (j === code.length) {
    var length = bytes[i] | (bytes[i + 1] << 8)
    i += 4 // skip the length and checksum
    return bytes.subarray(i, i + length)
  }
  return null
}

function getRebus(sections: Sections) {
  var table = sections.get("GRBS")?.data
  var solbytes = sections.get("RTBL")?.data
  if (!table || !solbytes) {
    return // no rebus
  }
  var enc = new TextDecoder("ISO-8859-1")
  var solstring = enc.decode(solbytes)
  if (!solstring) {
    return
  }
  var sols: Record<number, any> = {}
  solstring.split(";").forEach(function (s) {
    var tokens = s.split(":")
    if (tokens.length === 2) {
      var _tokens = _slicedToArray(tokens, 2),
        key = _tokens[0],
        val = _tokens[1]

      sols[parseInt(key.trim(), 10)] = val
    }
  })
  // dict string format is k1:v1;k2:v2;...;kn:vn;

  return { table: Array.from(table), sols: sols }
}

/** Indexes of squares whose GEXT markup has the given bit set */
function getMarkup(sections: Sections, gridSize: number, flag: number) {
  var indexes: number[] = []
  var markups = sections.get("GEXT")?.data
  if (markups) {
    // Only iterate up to grid size to avoid reading garbage data
    var limit = Math.min(markups.length, gridSize)
    for (var i = 0; i < limit; i++) {
      if (markups[i] & flag) {
        indexes.push(i)
      }
    }
  }
  return indexes
}

function addRebusToGrid(grid: Puzzle["grid"], rebus: NonNullable<ReturnType<typeof getRebus>>) {
  return grid.map(function (row, i) {
    return row.map(function (cell, j) {
      var idx = i * row.length + j
      if (rebus.table[idx]) {
        // TODO: this is a string being extended with a solution when it is rebus,
        // this is tricky to type and hard to discover. Once we have more tests
        // this can be refactored
        return _extends({}, cell, {
          solution: rebus.sols[rebus.table[idx] - 1],
        })
      }
      return cell
    })
  })
}

type Puzzle = ReturnType<typeof PUZtoJSON>

function PUZtoJSON(buffer: ArrayBuffer) {
  var grid: string[][] = []
  var info: Record<string, string> = {}
  var across = []
  var down = []
  var bytes = new Uint8Array(buffer)

  var ncol = bytes[44]
  var nrow = bytes[45]
  if (!ncol || !nrow) {
    throw new Error(`Invalid PUZ file: header reports grid size ${ncol}x${nrow}`)
  }
  if (!(bytes[50] === 0 && bytes[51] === 0)) {
    throw new Error("Scrambled PUZ file")
  }
  // Header must be followed by solution (ncol*nrow) and progress (ncol*nrow) bytes
  // before the NUL-terminated string section starts. If the file is shorter than
  // that the puzzle is truncated and we cannot safely decode it.
  var minBytes = 52 + 2 * ncol * nrow
  if (bytes.length < minBytes) {
    throw new Error(
      `Invalid PUZ file: header reports ${ncol}x${nrow} grid (needs at least ${minBytes} bytes) but file is only ${bytes.length} bytes`
    )
  }

  for (var i = 0; i < nrow; i++) {
    grid[i] = []

    for (var j = 0; j < ncol; j++) {
      var letter = String.fromCharCode(bytes[52 + i * ncol + j])
      grid[i][j] = letter
    }
  }

  function isBlack(i: number, j: number) {
    return i < 0 || j < 0 || i >= nrow || j >= ncol || grid[i][j] === "."
  }

  var isAcross: boolean[] = []
  var isDown: boolean[] = []
  var n = 0
  for (var _i = 0; _i < nrow; _i++) {
    for (var _j = 0; _j < ncol; _j++) {
      if (grid[_i][_j] !== ".") {
        var isAcrossStart = isBlack(_i, _j - 1) && !isBlack(_i, _j + 1)
        var isDownStart = isBlack(_i - 1, _j) && !isBlack(_i + 1, _j)

        if (isAcrossStart || isDownStart) {
          n += 1
          isAcross[n] = isAcrossStart
          isDown[n] = isDownStart
        }
      }
    }
  }

  var ibyte = 52 + ncol * nrow * 2
  function readString() {
    var result = ""
    if (ibyte >= bytes.length) {
      throw new Error(
        `Invalid PUZ file: reached end of file while reading strings. The grid scan found ${n} numbered cells (${
          isAcross.filter(Boolean).length
        } across, ${isDown.filter(Boolean).length} down) which doesn't match the strings stored in the file — the puzzle is likely truncated or its header grid size (${ncol}x${nrow}) is wrong.`
      )
    }
    var b = bytes[ibyte++]
    while (b !== 0) {
      if (b === undefined) {
        throw new Error("Invalid PUZ file: unterminated string at end of file")
      }
      result += String.fromCharCode(b)
      b = bytes[ibyte++]
    }
    return result
  }

  info.title = readString()
  info.author = readString()
  info.copyright = readString()

  for (var _i2 = 1; _i2 <= n; _i2++) {
    if (isAcross[_i2]) {
      across[_i2] = readString()
    }
    if (isDown[_i2]) {
      down[_i2] = readString()
    }
  }

  info.description = readString()

  var sections = readSections(bytes, ibyte)
  if (sections.size === 0) {
    for (var code of ["GRBS", "RTBL", "GEXT"]) {
      var found = scanForSection(bytes, code)
      if (found) sections.set(code, { data: found, checksumValid: true })
    }
  }

  // What the player has filled in so far, "-" is an empty square
  var progress: string[][] = []
  for (var _r = 0; _r < nrow; _r++) {
    progress[_r] = []
    for (var _c = 0; _c < ncol; _c++) {
      progress[_r][_c] = String.fromCharCode(bytes[52 + ncol * nrow + _r * ncol + _c])
    }
  }

  var gridSize = nrow * ncol
  var rebus = getRebus(sections)
  var circles = getMarkup(sections, gridSize, 0x80)
  var shades = getMarkup(sections, gridSize, 0x08)
  // Squares whose progress letter was given to the player at the start
  var given = getMarkup(sections, gridSize, 0x40)
  if (rebus) {
    grid = addRebusToGrid(grid, rebus)
  }

  // An xd document embedded by JSONToPuz, only trusted when its checksum is intact
  var xdoc = sections.get("XDOC")
  var xd = xdoc && xdoc.checksumValid ? new TextDecoder("utf-8").decode(xdoc.data) : undefined

  return {
    grid: grid,
    progress: progress,
    meta: info,
    circles: circles,
    shades: shades,
    given: given,
    xd: xd,
    clues: { across: across, down: down },
  }
}

export function encode(puzzle: PuzEncodeInput) {
  return encodePuz(puzzle)
}

export function decode(bytes: ArrayBuffer) {
  return PUZtoJSON(bytes)
}

export type Puz2JSONResult = ReturnType<typeof decode>
