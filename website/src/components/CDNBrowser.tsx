import React, { useState, useEffect } from "react"
import Form from "react-bootstrap/esm/Form"
import { convertImplicitOrderedXDToExplicitHeaders, shouldConvertToExplicitHeaders } from "xd-crossword-tools"

const CDN_BASE = "https://puzmo.blob.core.windows.net/xdg-mirror"

type DecodedIndex = Record<string, { name: string; years: Record<string, string[]> }>

let cachedIndex: DecodedIndex | null = null
let cachedPub = ""
let cachedYear = ""

function decodeIndex(index: Record<string, [string, string, Record<string, string[]>]>): DecodedIndex {
  const tree: DecodedIndex = {}
  for (const [pub, [prefix, name, yearMap]] of Object.entries(index)) {
    const years: Record<string, string[]> = {}
    for (const [year, entries] of Object.entries(yearMap)) {
      years[year] =
        year === "_"
          ? entries // flat pub, filenames are complete
          : entries.map((e) => `${prefix}${year}-${e}`) // restore stripped prefix+year
    }
    tree[pub] = { name, years }
  }
  return tree
}

interface CDNBrowserProps {
  onSelect: (xd: string) => void
}

export function CDNBrowser({ onSelect }: CDNBrowserProps) {
  const [index, setIndex] = useState<DecodedIndex | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPub, setSelectedPub] = useState(cachedPub)
  const [selectedYear, setSelectedYear] = useState(cachedYear)
  const [loadingFile, setLoadingFile] = useState<string | null>(null)

  useEffect(() => {
    if (cachedIndex) {
      setIndex(cachedIndex)
      return
    }
    setLoading(true)
    fetch(`${CDN_BASE}/index.json`)
      .then((r) => r.json())
      .then((raw) => {
        const decoded = decodeIndex(raw)
        cachedIndex = decoded
        setIndex(decoded)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!index || selectedPub) return
    const firstPub = Object.keys(index)[0]
    if (firstPub) {
      cachedPub = firstPub
      setSelectedPub(firstPub)
      const firstYear = Object.keys(index[firstPub].years)[0]
      if (firstYear) { cachedYear = firstYear; setSelectedYear(firstYear) }
    }
  }, [index])

  const handlePubChange = (pub: string) => {
    cachedPub = pub
    setSelectedPub(pub)
    if (index) {
      const firstYear = Object.keys(index[pub].years)[0]
      cachedYear = firstYear || ""
      setSelectedYear(cachedYear)
    }
  }

  const handleFileClick = async (pubKey: string, year: string, filename: string) => {
    setLoadingFile(filename)
    try {
      const path = year === "_" ? `${pubKey}/${filename}.xd` : `${pubKey}/${year}/${filename}.xd`
      const response = await fetch(`${CDN_BASE}/${path}`)
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
      let text = await response.text()
      if (shouldConvertToExplicitHeaders(text)) text = convertImplicitOrderedXDToExplicitHeaders(text)
      onSelect(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load puzzle")
    } finally {
      setLoadingFile(null)
    }
  }

  if (loading) return <div className="text-muted">Loading index...</div>
  if (error) return <div className="text-danger">{error}</div>
  if (!index) return null

  const pubEntries = Object.entries(index)
  const years = selectedPub ? Object.keys(index[selectedPub].years).sort().reverse() : []
  const files = selectedPub && selectedYear ? index[selectedPub].years[selectedYear] : []
  const totalFiles = files.length

  return (
    <div>
      <p className="text-muted small mb-2">
        Crosswords from the{" "}
        <a href="https://xd.saul.pw/data" target="_blank" rel="noreferrer">
          gxd
        </a>{" "}
        dataset, mirrored by Puzzmo in March 2026.
      </p>
      <div className="d-flex gap-2 mb-2 flex-wrap align-items-center">
        <Form.Select
          size="sm"
          value={selectedPub}
          onChange={(e) => handlePubChange(e.target.value)}
          style={{ maxWidth: "220px" }}
        >
          {pubEntries.map(([key, { name }]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </Form.Select>
        <Form.Select
          size="sm"
          value={selectedYear}
          onChange={(e) => { cachedYear = e.target.value; setSelectedYear(e.target.value) }}
          style={{ maxWidth: "120px" }}
          disabled={!selectedPub}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year === "_" ? "All" : year}
            </option>
          ))}
        </Form.Select>
        <span className="text-muted small">{totalFiles} puzzle{totalFiles !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ maxHeight: "300px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
        {files.length === 0 ? (
          <div className="text-muted">No puzzles found</div>
        ) : (
          files.map((filename) => {
            const dateMatch = filename.match(/(\d{4})-(\d{2})-(\d{2})/)
            const label = dateMatch
              ? new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                })
              : filename
            return (
              <button
                key={filename}
                className="example-button"
                style={{ textAlign: "left" }}
                onClick={() => handleFileClick(selectedPub, selectedYear, filename)}
                disabled={loadingFile !== null}
              >
                <div className="example-title">{loadingFile === filename ? "Loading..." : label}</div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
