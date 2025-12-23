import type { AmuseTopLevel, AmuseData } from "./amuseJSONToXD.types"

// The deobfuscation algorithm is adapted from:
// - https://github.com/thisisparker/xword-dl (xword-dl by Parker Higgins)
//   https://github.com/thisisparker/xword-dl/blob/main/src/xword_dl/downloader/amuselabsdownloader.py
// - https://github.com/jpd236/kotwords (kotwords by jpd236)
//   https://github.com/jpd236/kotwords/blob/master/LICENSE
//
// Used here under the terms of their respective licenses (Apache 2.0 / MIT).
//
// PuzzleMe scrambles the rawc field by reversing successive chunks of the string,
// using a repeating key of 7 digits (each 2-20) as chunk lengths. This implementation
// uses brute-force key discovery with BFS to find the correct key.
//
// Known keys (for fast-path optimization):
// - V1: [8, 11, 7, 17, 11, 7, 11]  - older puzzles
// - V2: [15, 14, 9, 8, 17, 11, 4]  - current as of late 2024
// - V3: [18, 15, 7, 16, 14, 17, 12] - Billboard variant

/** Known descramble keys for fast-path decoding */
const KNOWN_KEYS: number[][] = [
  [15, 14, 9, 8, 17, 11, 4], // V2 - most common currently
  [18, 15, 7, 16, 14, 17, 12], // V3 - Billboard variant
  [8, 11, 7, 17, 11, 7, 11], // V1 - legacy
]

/**
 * Descramble a string using a known key.
 *
 * Reverses successive chunks of the string using key digits as chunk lengths.
 *
 * @param rawc - The scrambled string
 * @param key - Array of chunk lengths (typically 7 digits, each 2-20)
 * @returns The descrambled string
 */
function descrambleWithKey(rawc: string, key: number[]): string {
  const buffer = rawc.split("")
  let i = 0
  let segmentCount = 0

  while (i < buffer.length - 1) {
    const segmentLength = Math.min(key[segmentCount % key.length], buffer.length - i)
    segmentCount++

    // Reverse this segment
    let left = i
    let right = i + segmentLength - 1
    while (left < right) {
      ;[buffer[left], buffer[right]] = [buffer[right], buffer[left]]
      left++
      right--
    }

    i += segmentLength
  }

  return buffer.join("")
}

/**
 * Validate if a key prefix could produce valid base64/UTF-8 output.
 *
 * This is used during brute-force key discovery to prune invalid branches early.
 *
 * @param rawc - The scrambled string
 * @param keyPrefix - Partial key to test
 * @param spacing - Remaining space to account for (min/max of remaining digits)
 * @returns true if this prefix could lead to valid output
 */
function isValidKeyPrefix(rawc: string, keyPrefix: number[], spacing: number): boolean {
  try {
    let pos = 0
    let chunk: string[] = []

    while (pos < rawc.length) {
      const startPos = pos
      let keyIndex = 0

      // Assemble a chunk by reversing segments of specified lengths
      while (keyIndex < keyPrefix.length && pos < rawc.length) {
        const chunkLength = Math.min(keyPrefix[keyIndex], rawc.length - pos)
        chunk.push(
          rawc
            .slice(pos, pos + chunkLength)
            .split("")
            .reverse()
            .join("")
        )
        pos += chunkLength
        keyIndex++
      }

      const chunkStr = chunk.join("")

      // Align to 4-byte Base64 boundaries
      const base64Start = Math.floor((startPos + 3) / 4) * 4 - startPos
      const base64End = Math.floor(pos / 4) * 4 - startPos

      if (base64Start >= chunkStr.length || base64End <= base64Start) {
        chunk = []
        pos += spacing
        continue
      }

      const b64Chunk = chunkStr.slice(base64Start, base64End)

      try {
        const decoded = base64Decode(b64Chunk)
        // Check for invalid UTF-8 bytes
        for (const byte of decoded) {
          if ((byte < 32 && ![0x09, 0x0a, 0x0d].includes(byte)) || byte === 0xc0 || byte === 0xc1 || byte >= 0xf5) {
            return false
          }
        }
      } catch {
        return false
      }

      pos += spacing
      chunk = []
    }
    return true
  } catch {
    return false
  }
}

/**
 * Brute-force discover the descramble key using BFS.
 *
 * Uses heuristics to find the first key digit, then expands candidates
 * using validation to prune invalid branches.
 *
 * @param rawc - The scrambled string
 * @returns The discovered 7-digit key, or null if not found
 */
function discoverKey(rawc: string): number[] | null {
  // Heuristic: find "ye" or "we" which appear at the start of Base64-encoded JSON
  // These strings (reversed) correspond to `{"` and `{\n`
  const yePos = rawc.indexOf("ye")
  const wePos = rawc.indexOf("we")

  const ye = yePos !== -1 ? yePos : rawc.length
  const we = wePos !== -1 ? wePos : rawc.length

  const firstKeyDigit = Math.min(ye, we) + 2

  // Initialize BFS queue
  let queue: number[][] = firstKeyDigit > 20 ? [[]] : [[firstKeyDigit]]

  while (queue.length > 0) {
    const candidateKeyPrefix = queue.shift()!

    if (candidateKeyPrefix.length === 7) {
      // Try this complete key
      try {
        const descrambled = descrambleWithKey(rawc, candidateKeyPrefix)
        const decodedBytes = base64Decode(descrambled)
        const decodedString = utf8Decode(decodedBytes)

        if (decodedString.startsWith("{")) {
          const parsed = JSON.parse(decodedString) as AmuseData
          if (parsed.w && parsed.h) {
            return candidateKeyPrefix
          }
        }
      } catch {
        // This key didn't work, continue searching
      }
      continue
    }

    // Expand by trying next digits (2-20)
    for (let nextDigit = 2; nextDigit <= 20; nextDigit++) {
      const newCandidate = [...candidateKeyPrefix, nextDigit]
      const remainingDigits = 7 - newCandidate.length
      const minSpacing = 2 * remainingDigits
      const maxSpacing = 20 * remainingDigits

      // Test if any spacing within bounds produces valid output
      let valid = false
      for (let spacing = minSpacing; spacing <= maxSpacing && !valid; spacing++) {
        if (isValidKeyPrefix(rawc, newCandidate, spacing)) {
          valid = true
        }
      }
      if (valid) {
        queue.push(newCandidate)
      }
    }
  }

  return null
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
 * Try to decode with a specific key.
 *
 * @param rawc - The encoded rawc string
 * @param key - The descramble key to use
 * @returns The parsed puzzle data, or null if decoding failed
 */
function tryDecodeWithKey(rawc: string, key: number[]): AmuseData | null {
  try {
    const descrambled = descrambleWithKey(rawc, key)
    const decodedBytes = base64Decode(descrambled)
    const decodedString = utf8Decode(decodedBytes)

    // Quick validation: should start with { and be valid JSON
    if (!decodedString.startsWith("{")) {
      return null
    }

    const puzzleData = JSON.parse(decodedString) as AmuseData

    // Validate it has expected fields
    if (!puzzleData.w || !puzzleData.h) {
      return null
    }

    return puzzleData
  } catch {
    return null
  }
}

/**
 * Decode the rawc field from PuzzleMe to get puzzle data.
 *
 * The decode chain is:
 * 1. descramble() - Reverses chunks of the string using a key
 * 2. base64Decode() - Standard base64 decoding to bytes
 * 3. utf8Decode() - Converts bytes to UTF-8 string
 * 4. JSON.parse() - Parses the JSON puzzle data
 *
 * This function first tries known keys for fast decoding, then falls back
 * to brute-force key discovery if none work.
 *
 * @param rawc - The encoded rawc string from PuzzleMe HTML
 * @returns The decoded puzzle data as AmuseData
 */
export function decodePuzzleMeRawc(rawc: string): AmuseData {
  // Fast path: try known keys first
  for (const key of KNOWN_KEYS) {
    const puzzleData = tryDecodeWithKey(rawc, key)
    if (puzzleData) {
      return puzzleData
    }
  }

  // Slow path: brute-force key discovery
  const discoveredKey = discoverKey(rawc)
  if (discoveredKey) {
    const puzzleData = tryDecodeWithKey(rawc, discoveredKey)
    if (puzzleData) {
      return puzzleData
    }
  }

  throw new Error("Failed to decode PuzzleMe rawc data with any known algorithm")
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
