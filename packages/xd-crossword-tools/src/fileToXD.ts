import { jpzToXD } from "./jpzToXD"
import { puzToXD } from "./puzToXD"
import { uclickXMLToXD } from "./uclickToXD"
import { crossCompilerXMLToXD } from "./crossCompilerXMLToXD"
import { acrossTextToXD } from "./acrossTextToXD"
import { amuseToXD } from "./amuseJSONToXD"
import { decodePuzzleMeHTML } from "./puzzleMeDecode"
import { ipuzToXD } from "./ipuzToXD"

/** The different crossword file formats that {@link fileToXD} knows how to convert into xd. */
export type CrosswordFileFormat =
  | "xd"
  | "jpz"
  | "puz"
  | "amuse"
  | "uclick-xml"
  | "crossword-compiler-xml"
  | "across-lite"
  | "puzzleme-html"
  | "ipuz"

export interface FileToXDResult {
  /** The converted (or, for a `.xd` input, verbatim) xd document. */
  xd: string
  /** The format we detected the input to be. */
  format: CrosswordFileFormat
}

/** Anything {@link fileToXD} can be handed as the file contents. */
export type FileToXDContent = string | ArrayBuffer | Uint8Array | Blob

/**
 * Convert a crossword file into an xd document, detecting the format from the
 * filename and — where the extension is ambiguous or missing — the contents.
 *
 * This is the single place a consumer should reach for instead of hand-rolling
 * "is this a .jpz / .puz / .ipuz / Crossword Compiler XML / …" checks. It accepts the
 * raw file contents in whatever shape is convenient (a string, an `ArrayBuffer`
 * / `Uint8Array` for binary `.puz` files, or a `Blob`/`File` straight from a
 * drag-and-drop or `fetch`).
 *
 * @param filename - The file's name (used for extension-based routing). May be
 *   empty, in which case the format is detected purely from the contents.
 * @param content - The file contents.
 * @returns The xd document and the format that was detected.
 * @throws If the format can't be detected, or the underlying converter fails
 *   (e.g. a malformed file, or a `.json` that isn't an Amuse export).
 *
 * @example
 * ```typescript
 * import { fileToXD } from "xd-crossword-tools"
 *
 * const { xd, format } = await fileToXD(file.name, file) // file is a Blob/File
 * console.log(`Imported a ${format} file`, xd)
 * ```
 */
export async function fileToXD(filename: string, content: FileToXDContent): Promise<FileToXDResult> {
  const normalized = await normalizeContent(content)
  const format = detectFormat(filename, normalized)

  switch (format) {
    case "xd":
      return { xd: normalized.getText(), format }
    case "jpz":
      return { xd: jpzToXD(normalized.getText()), format }
    case "puz":
      return { xd: puzToXD(bytesToArrayBuffer(normalized.getBytes())), format }
    case "across-lite":
      return { xd: acrossTextToXD(normalized.getText()), format }
    case "uclick-xml":
      return { xd: uclickXMLToXD(normalized.getText()), format }
    case "crossword-compiler-xml":
      return { xd: crossCompilerXMLToXD(normalized.getText()), format }
    case "amuse":
      return { xd: amuseFromJSON(normalized.getText()), format }
    case "puzzleme-html":
      return { xd: amuseToXD(decodePuzzleMeHTML(normalized.getText())), format }
    case "ipuz":
      return { xd: ipuzToXD(normalized.getText()), format }
  }

  // Exhaustive above; guards against a future format string sneaking through.
  throw new Error(`Unhandled crossword format: ${format}`)
}

// --- Format detection --------------------------------------------------------

function detectFormat(filename: string, content: NormalizedContent): CrosswordFileFormat {
  const name = (filename || "").toLowerCase().trim()

  // Extension-based routing. `.puz.txt` must be checked before both `.puz` and
  // `.txt`, since it ends with the latter.
  if (name.endsWith(".xd")) return "xd"
  if (name.endsWith(".jpz")) return "jpz"
  if (name.endsWith(".puz.txt")) return "across-lite"
  if (name.endsWith(".puz")) return "puz"
  if (name.endsWith(".ipuz")) return "ipuz"
  // A .json is either an ipuz file or an Amuse export - ipuz files always carry
  // an "http://ipuz.org/..." version/kind string
  if (name.endsWith(".json")) return content.getText().includes("ipuz.org") ? "ipuz" : "amuse"
  if (name.endsWith(".xml")) return sniffXML(content.getText())
  if (name.endsWith(".html") || name.endsWith(".htm")) return "puzzleme-html"
  if (name.endsWith(".txt")) return "across-lite"

  // No (or unknown) extension: fall back to sniffing the contents.
  return sniffContent(content)
}

/**
 * Both JPZ and Crossword Compiler XML use the rectangular-puzzle schema, so an
 * `.xml` file is only ever one of Crossword Compiler or UClick — decided by
 * whether the rectangular-puzzle markers are present.
 */
function sniffXML(text: string): "crossword-compiler-xml" | "uclick-xml" {
  return text.includes("crossword-compiler") || text.includes("rectangular-puzzle") ? "crossword-compiler-xml" : "uclick-xml"
}

function sniffContent(content: NormalizedContent): CrosswordFileFormat {
  // Binary formats first — a .puz carries its magic string at byte offset 2.
  if (looksLikePuz(content.getBytes())) return "puz"

  const text = content.getText().replace(/^\uFEFF/, "").trimStart()

  // Across Lite text starts with a `<ACROSS PUZZLE>` (or `V2`) banner.
  if (/^<ACROSS PUZZLE/i.test(text)) return "across-lite"
  // ipuz files may be wrapped in an `ipuz(...)` JSONP callback.
  if (text.startsWith("ipuz(")) return "ipuz"
  // A JSON object is an ipuz file (which always carries an "http://ipuz.org/..."
  // version/kind string) or otherwise an Amuse export (validated when we convert).
  if (text.startsWith("{")) return text.includes("ipuz.org") ? "ipuz" : "amuse"
  // PuzzleMe HTML embeds the scrambled puzzle in a `"rawc"` field. Checked
  // before the generic `<`-tag branch since the HTML also starts with `<`.
  if (text.includes('"rawc"')) return "puzzleme-html"
  if (text.startsWith("<")) return sniffXML(text)

  throw new Error(
    "Could not detect the crossword format from the file contents. Pass a filename with a known extension " +
      "(.xd, .puz, .jpz, .ipuz, .xml, .json, .puz.txt, .html) or recognisable content."
  )
}

const PUZ_MAGIC = "ACROSS&DOWN"

/** `.puz` files store the magic string `ACROSS&DOWN` starting at byte offset 2. */
function looksLikePuz(bytes: Uint8Array): boolean {
  if (bytes.length < 2 + PUZ_MAGIC.length) return false
  for (let i = 0; i < PUZ_MAGIC.length; i++) {
    if (bytes[2 + i] !== PUZ_MAGIC.charCodeAt(i)) return false
  }
  return true
}

// --- Conversions needing a little glue --------------------------------------

function amuseFromJSON(jsonText: string): string {
  let json: any
  try {
    json = JSON.parse(jsonText)
  } catch (error) {
    throw new Error(`Expected an Amuse JSON file but the contents were not valid JSON: ${(error as Error).message}`)
  }

  if (!json?.data?.attributes?.amuse_data) {
    throw new Error("Expected an Amuse JSON file (with data.attributes.amuse_data) but that field was not found")
  }

  return amuseToXD(json)
}

// --- Content normalization ---------------------------------------------------

interface NormalizedContent {
  /** The contents as text, decoded (as UTF-8) from bytes on demand. */
  getText: () => string
  /** The contents as bytes, encoded (as latin1) from a string on demand. */
  getBytes: () => Uint8Array
}

async function normalizeContent(content: FileToXDContent): Promise<NormalizedContent> {
  let text: string | undefined
  let bytes: Uint8Array | undefined

  if (typeof content === "string") {
    text = content
  } else if (content instanceof Uint8Array) {
    bytes = content
  } else if (content instanceof ArrayBuffer) {
    bytes = new Uint8Array(content)
  } else if (isBlobLike(content)) {
    bytes = new Uint8Array(await content.arrayBuffer())
  } else {
    throw new Error("Unsupported content: expected a string, ArrayBuffer, Uint8Array or Blob")
  }

  return {
    getText: () => {
      if (text === undefined) text = new TextDecoder().decode(bytes)
      return text
    },
    getBytes: () => {
      if (bytes === undefined) bytes = latin1ToBytes(text!)
      return bytes
    },
  }
}

function isBlobLike(value: unknown): value is Blob {
  return typeof value === "object" && value !== null && typeof (value as Blob).arrayBuffer === "function"
}

function latin1ToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xff
  return bytes
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}
