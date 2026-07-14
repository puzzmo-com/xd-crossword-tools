/**
 * Puzzmo's dedicated CORS proxy for xd-crossword-tools.com. Lets the site fetch
 * crossword files from third-party hosts that don't send CORS headers.
 *
 * Only requests with an xd-crossword-tools.com (or localhost) Origin are served,
 * and it is rate limited per IP. Source: apps/api.puzzmo.com/src/functions/
 * xdCrosswordProxy.ts in the puzzmo-com/app repo.
 */
const CORS_PROXY = "https://api.puzzmo.com/xdCrosswordProxy?url="

/** Build the proxied URL for fetching a third-party resource cross-origin. */
export function proxiedURL(url: string): string {
  return `${CORS_PROXY}${encodeURIComponent(url)}`
}

/** Fetch a URL through the CORS proxy, throwing a descriptive error on failure. */
export async function fetchViaProxy(url: string): Promise<Response> {
  const response = await fetch(proxiedURL(url))
  if (!response.ok) {
    const body = (await response.text().catch(() => "")).trim()
    const detail = body ? ` — ${body.slice(0, 300)}` : ""
    throw new Error(`Failed to fetch (${response.status} ${response.statusText})${detail}`)
  }
  return response
}
