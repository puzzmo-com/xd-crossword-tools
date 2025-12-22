import type { AmuseTopLevel, AmuseData } from "./amuseJSONToXD.types"

/**
 * Descramble function that reverses chunks of the string at specific intervals.
 *
 * This is a direct port of the JavaScript Lf function from PuzzleMe's c-min.js.
 * It performs 5 passes of chunk reversal with different parameters.
 *
 * @param t - The scrambled string
 * @returns The descrambled string
 */
function descramble(t: string): string {
  const i = t.split("")
  const length = t.length
  let n: number, r: number, o: number, s: number, c: number, a: string

  // Pass 1: start at 8, step 61, reverse 11 chars (or remaining)
  for (n = 8; n < length; n += 61) {
    r = n
    c = 10 + r < length ? 11 : length - r + 1
    for (o = r, s = r + c - 1; o < s; s--, o++) {
      a = i[s]
      i[s] = i[o]
      i[o] = a
    }
    n = r += c
  }

  // Pass 2: start at 19, step 65, reverse 7 chars (or remaining)
  for (n = 19; n < length; n += 65) {
    r = n
    c = 6 + r < length ? 7 : length - r + 1
    for (o = r, s = r + c - 1; o < s; s--, o++) {
      a = i[s]
      i[s] = i[o]
      i[o] = a
    }
    n = r += c
  }

  // Pass 3: start at 61, step 61, reverse 11 chars (or remaining)
  for (n = 61; n < length; n += 61) {
    r = n
    c = 10 + r < length ? 11 : length - r + 1
    for (o = r, s = r + c - 1; o < s; s--, o++) {
      a = i[s]
      i[s] = i[o]
      i[o] = a
    }
    n = r += c
  }

  // Pass 4: start at 26, step 37, reverse 17 then 11 then 7
  for (n = 26; n < length; n += 37) {
    r = n

    // First: 17 chars
    c = 16 + r < length ? 17 : length - r + 1
    for (o = r, s = r + c - 1; o < s; s--, o++) {
      a = i[s]
      i[s] = i[o]
      i[o] = a
    }
    r += c

    // Second: 11 chars
    c = 10 + r < length ? 11 : length - r + 1
    for (o = r, s = r + c - 1; o < s; s--, o++) {
      a = i[s]
      i[s] = i[o]
      i[o] = a
    }
    r += c

    // Third: 7 chars
    c = 6 + r < length ? 7 : length - r + 1
    for (o = r, s = r + c - 1; o < s; s--, o++) {
      a = i[s]
      i[s] = i[o]
      i[o] = a
    }
    n = r += c
  }

  // Pass 5: start at 0, step 64, reverse 8 chars
  for (n = 0; n < length; n += 64) {
    r = n
    c = 7 + r < length ? 8 : length - r + 1
    for (o = r, s = r + c - 1; o < s; s--, o++) {
      a = i[s]
      i[s] = i[o]
      i[o] = a
    }
    n = r += c
  }

  return i.join("")
}

/**
 * Base64 decode that works in both Node.js and browser environments.
 *
 * @param base64String - The base64 encoded string
 * @returns Uint8Array of decoded bytes
 */
function base64Decode(base64String: string): Uint8Array {
  // Browser environment
  if (typeof atob === "function") {
    const binaryString = atob(base64String)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  // Node.js environment
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64String, "base64"))
  }

  throw new Error("No base64 decode method available")
}

/**
 * UTF-8 decode bytes to string.
 *
 * @param bytes - The UTF-8 encoded bytes
 * @returns The decoded string
 */
function utf8Decode(bytes: Uint8Array): string {
  // Use TextDecoder if available (modern browsers and Node.js)
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder("utf-8").decode(bytes)
  }

  // Fallback implementation
  let result = ""
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]

    if (byte < 0x80) {
      result += String.fromCharCode(byte)
    } else if (byte >= 0xc0 && byte < 0xe0) {
      result += String.fromCharCode(((byte & 0x1f) << 6) | (bytes[++i] & 0x3f))
    } else if (byte >= 0xe0 && byte < 0xf0) {
      result += String.fromCharCode(((byte & 0x0f) << 12) | ((bytes[++i] & 0x3f) << 6) | (bytes[++i] & 0x3f))
    } else if (byte >= 0xf0) {
      const codePoint = ((byte & 0x07) << 18) | ((bytes[++i] & 0x3f) << 12) | ((bytes[++i] & 0x3f) << 6) | (bytes[++i] & 0x3f)
      // Convert to surrogate pair for code points > 0xFFFF
      if (codePoint > 0xffff) {
        const offset = codePoint - 0x10000
        result += String.fromCharCode(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff))
      } else {
        result += String.fromCharCode(codePoint)
      }
    }
  }

  return result
}

/**
 * Decode the rawc field from PuzzleMe to get puzzle data.
 *
 * The decode chain is:
 * 1. descramble() - Reverses chunks of the string at specific intervals
 * 2. base64Decode() - Standard base64 decoding to bytes
 * 3. utf8Decode() - Converts bytes to UTF-8 string
 * 4. JSON.parse() - Parses the JSON puzzle data
 *
 * @param rawc - The encoded rawc string from PuzzleMe HTML
 * @returns The decoded puzzle data as AmuseData
 */
export function decodePuzzleMeRawc(rawc: string): AmuseData {
  // Step 1: Descramble using the Lf algorithm
  const descrambled = descramble(rawc)

  // Step 2: Base64 decode
  const decodedBytes = base64Decode(descrambled)

  // Step 3: UTF-8 decode
  const decodedString = utf8Decode(decodedBytes)

  // Step 4: Parse JSON
  const puzzleData = JSON.parse(decodedString) as AmuseData

  return puzzleData
}

/**
 * Extract the rawc field from PuzzleMe HTML.
 *
 * @param html - The HTML content of a PuzzleMe puzzle page
 * @returns The rawc encoded string
 * @throws Error if rawc field is not found
 */
export function extractPuzzleMeRawc(html: string): string {
  const match = html.match(/"rawc"\s*:\s*"([^"]+)"/)
  if (match) {
    return match[1]
  }
  throw new Error("rawc field not found in PuzzleMe HTML")
}

/**
 * Convert decoded puzzle data to AmuseTopLevel format compatible
 * with xd-crossword-tools amuseJSONToXD converter.
 *
 * @param puzzleData - The decoded puzzle data (AmuseData)
 * @param options - Optional metadata to include
 * @returns Data in AmuseTopLevel format
 */
export function puzzleMeDataToAmuseTopLevel(
  puzzleData: AmuseData,
  options?: {
    amuseSet?: string
  }
): AmuseTopLevel {
  return {
    meta: {},
    data: {
      id: 1,
      attributes: {
        amuse_id: puzzleData.id,
        amuse_set: options?.amuseSet ?? "puzzleme",
        unsupported: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        amuse_data: puzzleData,
      },
    },
  }
}

/**
 * Decode a PuzzleMe HTML page and convert to AmuseTopLevel format.
 *
 * This is a convenience function that combines extractPuzzleMeRawc,
 * decodePuzzleMeRawc, and puzzleMeDataToAmuseTopLevel.
 *
 * @param html - The HTML content of a PuzzleMe puzzle page
 * @param options - Optional metadata to include
 * @returns Data in AmuseTopLevel format ready for amuseToXD
 *
 * @example
 * ```typescript
 * import { decodePuzzleMeHTML, amuseToXD } from "xd-crossword-tools"
 *
 * const response = await fetch("https://puzzleme.amuselabs.com/pmm/crossword?id=...")
 * const html = await response.text()
 *
 * const amuseData = decodePuzzleMeHTML(html)
 * const xd = amuseToXD(amuseData)
 * console.log(xd)
 * ```
 */
export function decodePuzzleMeHTML(
  html: string,
  options?: {
    amuseSet?: string
  }
): AmuseTopLevel {
  const rawc = extractPuzzleMeRawc(html)
  const puzzleData = decodePuzzleMeRawc(rawc)
  return puzzleMeDataToAmuseTopLevel(puzzleData, options)
}
