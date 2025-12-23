/**
 * Resolves a URL to a PuzzleMe URL.
 *
 * If the URL is already a puzzleme.amuselabs.com URL, returns it directly.
 * Otherwise, fetches the page and looks for an iframe containing a puzzleme URL,
 * or a puzzleme-embed.js script with embed div configuration.
 *
 * Based on xword-dl's AmuseLabsDownloader.matches_embed_pattern implementation.
 * License: MIT - https://github.com/thisisparker/xword-dl/blob/bd578c906aa51294b22e83284997832d471aeb3b/LICENSE
 */

const CORS_PROXY = "https://corsproxy.io/?"

export interface ResolvedPuzzleMeUrl {
  puzzleMeUrl: string
  wasResolved: boolean // true if we had to extract from an iframe/embed
}

/**
 * Check if a URL is a direct PuzzleMe/AmuseLabs URL
 */
export function isPuzzleMeUrl(url: string): boolean {
  return url.includes("amuselabs.com")
}

/**
 * Join a base URL with a potentially relative path
 */
function urlJoin(base: string, path: string): string {
  if (!path || path === "about:blank") return ""
  try {
    return new URL(path, base).href
  } catch {
    return path
  }
}

/**
 * Decode HTML entities in a string
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * Extract puzzle ID from a date-picker page at a given index.
 * The date-picker page contains a JSON blob with puzzle data.
 */
function extractPuzzleIdFromDatePicker(html: string, index: number): string | null {
  // Look for the params script tag containing puzzle data
  const paramsMatch = html.match(/<script[^>]*id=["']params["'][^>]*>([\s\S]*?)<\/script>/i)
  if (paramsMatch) {
    try {
      const paramsJson = JSON.parse(paramsMatch[1])
      const puzzles = paramsJson.puzzles
      if (Array.isArray(puzzles) && puzzles.length > index) {
        return puzzles[index].id
      }
    } catch {
      // JSON parse failed
    }
  }
  return null
}

/**
 * Fetch a URL through the CORS proxy
 */
async function fetchWithProxy(url: string): Promise<string> {
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`
  const response = await fetch(proxyUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

/**
 * Handle date-picker URLs by fetching the picker page and extracting puzzle ID.
 * Returns the crossword URL with the puzzle ID appended.
 */
async function resolveDatePickerUrl(datePickerUrl: string): Promise<string | null> {
  const parsedUrl = new URL(datePickerUrl)
  const params = new URLSearchParams(parsedUrl.search)

  // Get the index from the idx parameter (1-based in URL, 0-based in array)
  const idxParam = params.get("idx")
  const index = idxParam ? parseInt(idxParam, 10) - 1 : 0

  // Fetch the date picker page
  const html = await fetchWithProxy(datePickerUrl)
  const puzzleId = extractPuzzleIdFromDatePicker(html, index)

  if (!puzzleId) {
    return null
  }

  // Convert date-picker URL to crossword URL
  const crosswordUrl = datePickerUrl.replace("date-picker", "crossword")
  const crosswordParsedUrl = new URL(crosswordUrl)
  crosswordParsedUrl.searchParams.set("id", puzzleId)

  return crosswordParsedUrl.href
}

/**
 * Extract PuzzleMe/AmuseLabs URL from HTML content.
 *
 * Looks for:
 * 1. iframes with src, data-src, or data-crossword-url pointing to amuselabs.com
 * 2. puzzleme-embed.js script with PM_BasePath and div.pm-embed-div configuration
 *
 * Returns either a direct crossword URL, a date-picker URL that needs resolution, or null.
 */
interface ExtractResult {
  url: string
  isDatePicker: boolean
}

function extractPuzzleMeUrl(html: string, baseUrl: string): ExtractResult | null {
  // Method 1: Look for iframes with amuselabs.com URLs
  // Check data-crossword-url, data-src, and src attributes
  const iframeRegex = /<iframe[^>]*>/gi
  let iframeMatch
  while ((iframeMatch = iframeRegex.exec(html)) !== null) {
    const iframeTag = iframeMatch[0]

    // Extract potential URL attributes in order of preference
    const dataCrosswordUrl = iframeTag.match(/data-crossword-url=["']([^"']*)["']/i)
    const dataSrc = iframeTag.match(/data-src=["']([^"']*)["']/i)
    const src = iframeTag.match(/\ssrc=["']([^"']*)["']/i)

    const sources = [dataCrosswordUrl?.[1], dataSrc?.[1], src?.[1]]
      .filter((s): s is string => !!s && s !== "about:blank")
      .map((s) => decodeHtmlEntities(s))
      .map((s) => urlJoin(baseUrl, s))

    for (const embedSrc of sources) {
      try {
        const parsedUrl = new URL(embedSrc)
        if (parsedUrl.hostname.includes("amuselabs.com")) {
          if (parsedUrl.pathname.includes("crossword")) {
            return { url: embedSrc, isDatePicker: false }
          }
          if (parsedUrl.pathname.endsWith("date-picker")) {
            return { url: embedSrc, isDatePicker: true }
          }
        }
      } catch {
        // Invalid URL, skip
      }
    }
  }

  // Method 2: Look for puzzleme-embed.js pattern
  // This pattern uses a script tag and a div with data attributes
  if (html.includes("puzzleme-embed.js")) {
    // Extract PM_BasePath
    const basePathMatch = html.match(/PM_BasePath\s*=\s*["']([^"']*)["']/)
    const basePath = basePathMatch?.[1]

    // Extract data-id and data-set from pm-embed-div
    const embedDivMatch = html.match(/<div[^>]*class=["'][^"']*pm-embed-div[^"']*["'][^>]*>/i)
    if (embedDivMatch) {
      const embedDiv = embedDivMatch[0]
      const dataId = embedDiv.match(/data-id=["']([^"']*)["']/i)?.[1]
      const dataSet = embedDiv.match(/data-set=["']([^"']*)["']/i)?.[1]

      if (basePath && dataId && dataSet) {
        return { url: `${basePath}crossword?id=${dataId}&set=${dataSet}`, isDatePicker: false }
      }
    }
  }

  return null
}

/**
 * Resolves a URL to a PuzzleMe URL.
 *
 * @param url - Any URL that might be a PuzzleMe URL or contain a PuzzleMe iframe/embed
 * @returns The resolved PuzzleMe URL and whether resolution was needed
 * @throws Error if the URL cannot be resolved to a PuzzleMe URL
 */
export async function resolvePuzzleMeUrl(url: string): Promise<ResolvedPuzzleMeUrl> {
  // If it's already a PuzzleMe URL, return it directly
  if (isPuzzleMeUrl(url)) {
    return { puzzleMeUrl: url, wasResolved: false }
  }

  // Otherwise, fetch the page and look for a PuzzleMe iframe/embed
  const html = await fetchWithProxy(url)
  const result = extractPuzzleMeUrl(html, url)

  if (!result) {
    throw new Error("No PuzzleMe embed found on the page")
  }

  // If it's a date-picker URL, we need to fetch it to get the puzzle ID
  if (result.isDatePicker) {
    const crosswordUrl = await resolveDatePickerUrl(result.url)
    if (!crosswordUrl) {
      throw new Error("Could not extract puzzle ID from date picker")
    }
    return { puzzleMeUrl: crosswordUrl, wasResolved: true }
  }

  return { puzzleMeUrl: result.url, wasResolved: true }
}

/**
 * Checks if a URL could potentially contain a PuzzleMe puzzle
 * (either directly or via iframe). Used for validating input.
 */
export function couldBePuzzleMeUrl(url: string): boolean {
  // Accept any URL that looks valid - we'll try to resolve it
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
