import React, { useState, useEffect } from "react"
import { use } from "react"
import "./Homepage.scss"

import Container from "react-bootstrap/esm/Container"
import Form from "react-bootstrap/esm/Form"
import Card from "react-bootstrap/esm/Card"
import Tab from "react-bootstrap/esm/Tab"
import Tabs from "react-bootstrap/esm/Tabs"
import Navbar from "react-bootstrap/esm/Navbar"
import Badge from "react-bootstrap/esm/Badge"
import Button from "react-bootstrap/esm/Button"
import { XDEditor } from "./components/XDEditor"
import { RootContext } from "./components/RootContext"
import { XDSpec } from "./components/xdSpec"
import { DesignEditor } from "./components/DesignEditor"

import "monaco-editor/esm/vs/editor/editor.all.js"
import { DragAndDrop, UploadButton } from "./components/SingleDragAndDrop"
import { PanelGroup, Panel, PanelResizer } from "@window-splitter/react"

import { JsonView, allExpanded, defaultStyles } from "react-json-view-lite"
import "react-json-view-lite/dist/index.css"
import { exampleXDs } from "./exampleXDs"
import Crossword from "@jaredreisinger/react-crossword"
import { convertToCrosswordFormat } from "./utils/convertToCrosswordFormat"
import { CrosswordBarPreview } from "./components/CrosswordPreview"
import { readmeHtml } from "virtual:readme"
import { Link } from "wouter"
import { version, puzEncode, decodePuzzleMeHTML, amuseToXD, type CrosswordJSON } from "xd-crossword-tools"
import { resolvePuzzleMeUrl } from "./utils/resolvePuzzleMeUrl"

const PRINT_SERVICE_BASE = "https://games-u7ii.onrender.com"

interface PrintOptions {
  includeSolution: boolean
  includeClues: boolean
  includeGrid: boolean
  grid: {
    showClueNumbers: boolean
    fillLetters: boolean
    boldLetters: boolean
    darkGridLines: boolean
  }
}

const PrintTab: React.FC<{ xd: string; crosswordJSON: CrosswordJSON }> = ({ xd, crosswordJSON }) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<PrintOptions>({
    includeSolution: false,
    includeClues: true,
    includeGrid: true,
    grid: {
      showClueNumbers: true,
      fillLetters: false,
      boldLetters: false,
      darkGridLines: false,
    },
  })

  const handleOpenPrint = async (asPDF: boolean) => {
    setIsGenerating(true)
    setError(null)

    try {
      const requestBody = {
        xd,
        options: {
          title: crosswordJSON.meta.title,
          authorString: crosswordJSON.meta.author,
          ...options,
        },
      }

      const response = await fetch(`${PRINT_SERVICE_BASE}/crossword/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to store: ${response.status}`)
      }

      const { slug } = await response.json()
      const url = asPDF ? `${PRINT_SERVICE_BASE}/crossword/stored/${slug}/pdf` : `${PRINT_SERVICE_BASE}/crossword/stored/${slug}`

      window.open(url, "_blank")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate print view")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="modern-card">
      <Card.Header className="card-header">
        <Card.Title className="mb-0">Print Crossword</Card.Title>
      </Card.Header>
      <Card.Body>
        <p>Configure and generate a printable version of the crossword.</p>

        <div className="print-options">
          <h6>Content Options</h6>
          <Form.Check
            type="checkbox"
            id="includeGrid"
            label="Include Grid"
            checked={options.includeGrid}
            onChange={(e) => setOptions({ ...options, includeGrid: e.target.checked })}
          />
          <Form.Check
            type="checkbox"
            id="includeClues"
            label="Include Clues"
            checked={options.includeClues}
            onChange={(e) => setOptions({ ...options, includeClues: e.target.checked })}
          />
          <Form.Check
            type="checkbox"
            id="includeSolution"
            label="Include Solution"
            checked={options.includeSolution}
            onChange={(e) => setOptions({ ...options, includeSolution: e.target.checked })}
          />

          <h6 className="mt-3">Grid Options</h6>
          <Form.Check
            type="checkbox"
            id="showClueNumbers"
            label="Show Clue Numbers"
            checked={options.grid.showClueNumbers}
            onChange={(e) => setOptions({ ...options, grid: { ...options.grid, showClueNumbers: e.target.checked } })}
          />
          <Form.Check
            type="checkbox"
            id="fillLetters"
            label="Fill Letters (show answers in grid)"
            checked={options.grid.fillLetters}
            onChange={(e) => setOptions({ ...options, grid: { ...options.grid, fillLetters: e.target.checked } })}
          />
          <Form.Check
            type="checkbox"
            id="boldLetters"
            label="Bold Letters"
            checked={options.grid.boldLetters}
            onChange={(e) => setOptions({ ...options, grid: { ...options.grid, boldLetters: e.target.checked } })}
          />
          <Form.Check
            type="checkbox"
            id="darkGridLines"
            label="Dark Grid Lines"
            checked={options.grid.darkGridLines}
            onChange={(e) => setOptions({ ...options, grid: { ...options.grid, darkGridLines: e.target.checked } })}
          />
        </div>

        {error && <div className="text-danger mt-3">{error}</div>}

        <div className="d-flex gap-2 flex-wrap mt-4">
          <Button variant="primary" onClick={() => handleOpenPrint(false)} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Open Print View"}
          </Button>
          <Button variant="outline-primary" onClick={() => handleOpenPrint(true)} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Download PDF"}
          </Button>
        </div>

        <div className="crossword-note mt-3">
          <strong>Note:</strong> The print service is a WIP.
        </div>
      </Card.Body>
    </Card>
  )
}

function App() {
  const { xd, crosswordJSON, lastFileContext, setXD, validationReports, cursorInfo } = use(RootContext)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(() => {
    // Load the last active tab from localStorage, defaulting to "result"
    return localStorage.getItem("activeTab") || "result"
  })

  // PuzzleMe URL import state
  const [showImportInput, setShowImportInput] = useState(false)
  const [importUrl, setImportUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handlePuzzleMeImport = async () => {
    if (!importUrl.trim()) return

    setIsImporting(true)
    setImportError(null)

    try {
      // Resolve the URL to a PuzzleMe URL (handles iframes in blog posts, etc.)
      const { puzzleMeUrl } = await resolvePuzzleMeUrl(importUrl)

      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(puzzleMeUrl)}`
      const response = await fetch(proxyUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const html = await response.text()
      const amuseData = decodePuzzleMeHTML(html)
      const xd = amuseToXD(amuseData)

      setXD(xd)
      setImportUrl("")
      setShowImportInput(false)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed")
    } finally {
      setIsImporting(false)
    }
  }

  // Convert CrosswordJSON to the format expected by puzEncode
  const crosswordJSONToPuzFormat = (json: CrosswordJSON) => {
    // Build the grid as string[][]
    const grid: string[][] = json.tiles.map((row) =>
      row.map((tile) => {
        if (tile.type === "blank") return "."
        if (tile.type === "letter") return tile.letter
        if (tile.type === "rebus") return tile.word
        return "."
      }),
    )

    // Build clues arrays indexed by clue number
    const across: string[] = []
    const down: string[] = []
    json.clues.across.forEach((clue) => {
      across[clue.number] = clue.body
    })
    json.clues.down.forEach((clue) => {
      down[clue.number] = clue.body
    })

    // Find circles from design if present
    const circles: number[] = []
    if (json.design) {
      const circleStyles = new Set<string>()
      for (const [key, style] of Object.entries(json.design.styles || {})) {
        if (style.background === "circle") circleStyles.add(key)
      }
      if (circleStyles.size > 0) {
        json.design.positions.forEach((row, rowIdx) => {
          row.forEach((styleKey, colIdx) => {
            if (circleStyles.has(styleKey)) {
              circles.push(rowIdx * row.length + colIdx)
            }
          })
        })
      }
    }

    return {
      grid,
      meta: {
        title: json.meta.title || "",
        author: json.meta.author || "",
        copyright: json.meta.copyright || "",
      },
      clues: { across, down },
      circles,
      shades: [] as number[],
    }
  }

  // Download the current crossword as a .puz file
  const downloadPuz = () => {
    if (!crosswordJSON) return

    try {
      const puzData = crosswordJSONToPuzFormat(crosswordJSON)
      const puzBytes = puzEncode(puzData)
      const blob = new Blob([puzBytes], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${crosswordJSON.meta.title || "crossword"}.puz`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("Failed to generate .puz file:", e)
      alert(`Failed to generate .puz file: ${e instanceof Error ? e.message : "Unknown error"}`)
    }
  }

  // Shared tabs content component
  const TabsContent = () => (
    <Tabs activeKey={activeTab} onSelect={handleTabSelect} id="controlled-tab-example" className="mb-3 compact-tabs">
      <Tab eventKey="docs" title="Spec">
        <Card className="modern-card">
          <Card.Body style={{ padding: 0 }}>
            <XDSpec />
          </Card.Body>
        </Card>
      </Tab>
      <Tab eventKey="readme" title="README">
        <Card className="modern-card">
          <Card.Header className="card-header">
            <Card.Title className="mb-0">Project README</Card.Title>
          </Card.Header>
          <Card.Body>
            <div
              className="readme-content"
              dangerouslySetInnerHTML={{ __html: readmeHtml }}
              style={{
                maxHeight: "70vh",
                overflow: "auto",
                lineHeight: "1.6",
                fontSize: "14px",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            />
          </Card.Body>
        </Card>
      </Tab>
      {crosswordJSON && (
        <Tab eventKey="result" title="JSON">
          <Card className="modern-card">
            <Card.Header className="card-header">
              <Card.Title className="mb-0">Parsed XD JSON</Card.Title>
            </Card.Header>
            <Card.Body className="json-viewer">
              <JsonView data={crosswordJSON} shouldExpandNode={customExpandNode} style={defaultStyles} />
            </Card.Body>
          </Card>
        </Tab>
      )}

      {lastFileContext && (
        <Tab eventKey="lastFile" title="File">
          <Card className="modern-card">
            <Card.Header className="card-header">
              <Card.Title className="mb-0">{lastFileContext.filename}</Card.Title>
            </Card.Header>
            <Card.Body className="file-content">
              {typeof lastFileContext.content === "string" ? (
                <pre className="code-block">{lastFileContext.content}</pre>
              ) : (
                <div className="json-viewer">
                  <JsonView data={lastFileContext.content} shouldExpandNode={allExpanded} style={defaultStyles} />
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      )}

      <Tab eventKey="examples" title="Examples">
        <Card className="modern-card">
          <Card.Header className="card-header">
            <Card.Title className="mb-0">Sample Puzzles</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="examples-grid">
              {exampleXDs.map((e, index) => (
                <button key={index} className="example-button" onClick={() => setXD(e.xd)}>
                  <div className="example-title">{e.title}</div>
                  <div className="example-note">{e.note}</div>
                </button>
              ))}
            </div>
          </Card.Body>
        </Card>
      </Tab>

      <Tab
        eventKey="validation"
        title={
          <span>
            Valid
            {validationReports.length > 0 && (
              <Badge bg="warning" className="ms-2">
                {validationReports.length}
              </Badge>
            )}
          </span>
        }
      >
        <Card className="modern-card">
          <Card.Header className="card-header">
            <Card.Title className="mb-0">
              Validation Reports
              {validationReports.length > 0 && (
                <Badge bg="warning" className="ms-2">
                  {validationReports.length} issues
                </Badge>
              )}
            </Card.Title>
          </Card.Header>
          <Card.Body>
            {validationReports.length === 0 ? (
              <div className="validation-success">
                <div className="success-icon">✅</div>
                <div className="success-message">No validation issues found!</div>
              </div>
            ) : (
              <div className="validation-reports">
                {validationReports.map((report, index) => (
                  <div key={index} className={`validation-report ${report.type}`}>
                    <div className="report-header">
                      <span className="report-type">{report.type}</span>
                      {(report as any).clueNum && (
                        <span className="report-clue">
                          {(report as any).clueType?.toUpperCase().slice(0, 1)}
                          {(report as any).clueNum}
                        </span>
                      )}
                    </div>
                    <div className="report-message">{report.message}</div>
                    <div className="report-details">
                      {report.position && (
                        <span className="report-position">
                          Line {report.position.index + 1}, Column {report.position.col + 1}
                        </span>
                      )}
                      {report.length > 0 && <span className="report-length">Length: {report.length} chars</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </Tab>

      {crosswordJSON && (
        <Tab eventKey="crossword" title="Preview">
          <Card className="modern-card">
            <Card.Body>
              <div className="crossword-container">
                <Crossword
                  data={convertToCrosswordFormat(crosswordJSON)}
                  theme={{
                    focusBackground: "#0d5526",
                    highlightBackground: "#d1d9d4",
                    numberColor: "#1a1f1c",
                  }}
                />
              </div>
              <div className="crossword-note">
                <strong>Note:</strong> This preview uses a Crossword engine which doesn't support any clever features.
              </div>
            </Card.Body>
          </Card>
        </Tab>
      )}

      {crosswordJSON && (
        <Tab eventKey="print" title="Print">
          <PrintTab xd={xd} crosswordJSON={crosswordJSON} />
        </Tab>
      )}

      {crosswordJSON && crosswordJSON.meta?.form === "barred" && (
        <Tab eventKey="barsPreview" title="Bars Preview">
          <Card className="modern-card">
            <Card.Body>
              <div className="crossword-container">
                <CrosswordBarPreview crosswordJSON={crosswordJSON} />
              </div>
              <div className="crossword-note">
                <strong>Note:</strong> This preview shows the barred grid structure for the bars between cells.
              </div>
            </Card.Body>
          </Card>
        </Tab>
      )}

      {crosswordJSON && (
        <Tab eventKey="design" title="Design">
          <Card className="modern-card">
            <Card.Header className="card-header">
              <Card.Title className="mb-0">Design View</Card.Title>
            </Card.Header>

            {crosswordJSON.design ? (
              <Card.Body style={{ padding: 0 }}>
                <DesignEditor
                  designData={crosswordJSON.design}
                  crosswordJSON={crosswordJSON}
                  onDesignChange={(newDesign) => {
                    // Handle design changes if needed
                    console.log("Design updated:", newDesign)
                  }}
                />
              </Card.Body>
            ) : (
              <Card.Body>
                <div className="mb-3">
                  <Button variant="primary" onClick={() => generateDesignPattern()} size="sm">
                    Generate Design Pattern
                  </Button>
                </div>
                <div
                  id="design-output"
                  style={{
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    fontSize: "14px",
                    backgroundColor: "#f8f9fa",
                    padding: "15px",
                    borderRadius: "4px",
                    border: "1px solid #dee2e6",
                  }}
                >
                  <div className="text-muted">Click "Generate Design Pattern" to create a visual representation of the crossword grid</div>
                </div>
              </Card.Body>
            )}
          </Card>
        </Tab>
      )}

      <Tab eventKey="cursor" title="Cursor">
        <Card className="modern-card">
          <Card.Header className="card-header">
            <Card.Title className="mb-0">Editor Cursor Information</Card.Title>
          </Card.Header>
          <Card.Body style={{ position: "relative", minHeight: "300px", paddingBottom: "200px" }}>
            {!cursorInfo || cursorInfo.type === "noop" ? (
              <div className="text-muted">Click on the editor to see information about the current position</div>
            ) : cursorInfo.type === "grid" ? (
              <div>
                <h5>Grid Position</h5>
                <p>
                  <strong>Row:</strong> {cursorInfo.position.index + 1}, <strong>Column:</strong> {cursorInfo.position.col + 1}
                </p>

                {cursorInfo.clues.across && (
                  <div className="mb-3">
                    <h6>Across Clue</h6>
                    <p>
                      <strong>{cursorInfo.clues.across.number} Across:</strong> {cursorInfo.clues.across.body}
                    </p>
                    {cursorInfo.clues.across.answer && (
                      <p>
                        <strong>Answer:</strong> {cursorInfo.clues.across.answer}
                      </p>
                    )}
                  </div>
                )}

                {cursorInfo.clues.down && (
                  <div>
                    <h6>Down Clue</h6>
                    <p>
                      <strong>{cursorInfo.clues.down.number} Down:</strong> {cursorInfo.clues.down.body}
                    </p>
                    {cursorInfo.clues.down.answer && (
                      <p>
                        <strong>Answer:</strong> {cursorInfo.clues.down.answer}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : cursorInfo.type === "clue" ? (
              <div>
                <h5>Clue Definition</h5>
                <p>
                  <strong>Direction:</strong> {cursorInfo.direction.charAt(0).toUpperCase() + cursorInfo.direction.slice(1)}
                </p>
                <p>
                  <strong>Number:</strong> {cursorInfo.number}
                </p>
                {crosswordJSON && (
                  <div>
                    {cursorInfo.direction === "across" && crosswordJSON.clues.across.find((c) => c.number === cursorInfo.number) && (
                      <div>
                        <p>
                          <strong>Clue:</strong> {crosswordJSON.clues.across.find((c) => c.number === cursorInfo.number)?.body}
                        </p>
                        <p>
                          <strong>Answer:</strong> {crosswordJSON.clues.across.find((c) => c.number === cursorInfo.number)?.answer}
                        </p>
                      </div>
                    )}
                    {cursorInfo.direction === "down" && crosswordJSON.clues.down.find((c) => c.number === cursorInfo.number) && (
                      <div>
                        <p>
                          <strong>Clue:</strong> {crosswordJSON.clues.down.find((c) => c.number === cursorInfo.number)?.body}
                        </p>
                        <p>
                          <strong>Answer:</strong> {crosswordJSON.clues.down.find((c) => c.number === cursorInfo.number)?.answer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : cursorInfo.type === "metadata" ? (
              <div>
                <h5>Metadata</h5>
                <p>
                  <strong>Key:</strong> {cursorInfo.key}
                </p>
                <p>
                  <strong>Value:</strong> {cursorInfo.value}
                </p>
              </div>
            ) : null}

            {cursorInfo && cursorInfo.type !== "noop" && (
              <div
                style={{
                  position: "absolute",
                  bottom: "15px",
                  left: "15px",
                  right: "15px",
                  maxHeight: "180px",
                  overflow: "auto",
                  borderTop: "1px solid #dee2e6",
                  paddingTop: "10px",
                }}
              >
                <h6 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#6c757d" }}>Raw JSON</h6>
                <div className="json-viewer" style={{ fontSize: "0.8rem" }}>
                  <JsonView data={cursorInfo} shouldExpandNode={allExpanded} style={defaultStyles} />
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </Tab>
    </Tabs>
  )

  // Generate design pattern function
  const generateDesignPattern = () => {
    if (!crosswordJSON) return

    const { tiles } = crosswordJSON
    const rows = tiles.length // height
    const cols = tiles[0]?.length || 0 // width

    let pattern = `\n\n&lt;style>\n&lt;/style>\n\n`

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = tiles[row][col]

        if (tile && (tile.type === "letter" || tile.type === "rebus" || tile.type === "schrodinger")) {
          pattern += "."
        } else {
          pattern += "#"
        }
      }
      pattern += "\n"
    }

    const outputElement = document.getElementById("design-output")
    if (outputElement) {
      outputElement.innerHTML = `<div style="color: #495057; font-weight: 500; margin-bottom: 10px;">## Design</div><pre style="margin: 0;">${pattern}</pre>`
    }
  }

  // Handle tab selection and save to localStorage
  const handleTabSelect = (key: string | null) => {
    if (key) {
      setActiveTab(key)
      localStorage.setItem("activeTab", key)
    }
  }

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false) // Close sidebar when switching to desktop
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <>
      <Navbar className="modern-header shadow-sm mb-0" expand="lg">
        <Container fluid className={isMobile ? "mobile-header-container" : "desktop-header-container"}>
          <div className="header-left">
            <Navbar.Brand className={`brand-title ${isMobile ? "mobile-brand" : ""}`}>
              XD Crossword Tools
              <Badge bg="primary" className={`ms-2 version-badge ${isMobile ? "d-none" : ""}`}>
                v{version}
              </Badge>
            </Navbar.Brand>
          </div>
          <div className={`header-center ${isMobile ? "d-none" : ""}`}>
            <span className="header-subtitle">A site for playing with XD Crossword files</span>
          </div>
          <div className="header-right">
            {!isMobile && (
              <>
                {crosswordJSON && (
                  <Button variant="outline-light" size="sm" onClick={downloadPuz}>
                    Download .puz
                  </Button>
                )}
                <Link to="/mass-import">
                  <Button variant="outline-light" size="sm">
                    Mass Import
                  </Button>
                </Link>
              </>
            )}
            {isMobile && (
              <Button
                variant="outline-light"
                className="mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                size="sm"
                title={sidebarOpen ? "Close" : "View Results"}
              >
                {sidebarOpen ? "✕" : "Info"}
              </Button>
            )}
          </div>
        </Container>
      </Navbar>

      <Container fluid className={`main-content ${isMobile ? "mobile-layout" : ""}`}>
        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}

        {isMobile ? (
          <>
            <div className="editor-panel mobile-main">
              <Form className="form-container">
                <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                  <DragAndDrop>
                    <Form.Label className="editor-label">
                      <strong>XD Editor</strong>
                      <div className="format-support">
                        <span>
                          Supports drag & drop of <code>.xd</code>, <code>.puz</code>, <code>.jpz</code>, <code>.json</code> (amuse),{" "}
                          <code>.xml</code> (uclick), <code>.puz.txt</code> (Across Text)
                        </span>
                        <div className="format-buttons">
                          <button type="button" className="upload-btn" onClick={() => setShowImportInput(!showImportInput)}>
                            Import
                          </button>
                          <UploadButton className="upload-btn" />
                        </div>
                      </div>
                      {showImportInput && (
                        <div className="import-url-input">
                          <input
                            type="url"
                            placeholder="PuzzleMe URL or page with PuzzleMe iframe..."
                            value={importUrl}
                            onChange={(e) => {
                              setImportUrl(e.target.value)
                              setImportError(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handlePuzzleMeImport()
                              }
                              if (e.key === "Escape") {
                                setShowImportInput(false)
                                setImportUrl("")
                                setImportError(null)
                              }
                            }}
                            disabled={isImporting}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handlePuzzleMeImport}
                            disabled={isImporting || !importUrl.trim()}
                            className="import-go-btn"
                          >
                            {isImporting ? "..." : "Go"}
                          </button>
                          {importError && <div className="import-error">{importError}</div>}
                        </div>
                      )}
                    </Form.Label>
                    <XDEditor />
                  </DragAndDrop>
                </Form.Group>
              </Form>
            </div>

            {/* Content Panel (Mobile sidebar) */}
            <div className={`content-panel mobile-sidebar ${sidebarOpen ? "open" : ""}`}>
              <TabsContent />
            </div>
          </>
        ) : (
          <>
            {/* Desktop Layout with Resizable Panels */}
            <PanelGroup orientation="horizontal">
              {/* Editor Panel (Left side) */}
              <Panel default="50%" min="300px">
                <div className="editor-panel">
                  <Form className="form-container">
                    <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                      <DragAndDrop>
                        <Form.Label className="editor-label">
                          <div className="format-support">
                            <span>
                              Supports drag & drop of <code>.xd</code>, <code>.puz</code>, <code>.jpz</code>, <code>.json</code> (amuse),{" "}
                              <code>.xml</code> (uclick), <code>.puz.txt</code> (Across Text)
                            </span>
                            <div className="format-buttons">
                              <button type="button" className="upload-btn" onClick={() => setShowImportInput(!showImportInput)}>
                                Import
                              </button>
                              <UploadButton className="upload-btn" />
                            </div>
                          </div>
                          {showImportInput && (
                            <div className="import-url-input">
                              <input
                                type="url"
                                placeholder="PuzzleMe URL or page with PuzzleMe iframe..."
                                value={importUrl}
                                onChange={(e) => {
                                  setImportUrl(e.target.value)
                                  setImportError(null)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handlePuzzleMeImport()
                                  }
                                  if (e.key === "Escape") {
                                    setShowImportInput(false)
                                    setImportUrl("")
                                    setImportError(null)
                                  }
                                }}
                                disabled={isImporting}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handlePuzzleMeImport}
                                disabled={isImporting || !importUrl.trim()}
                                className="import-go-btn"
                              >
                                {isImporting ? "..." : "Go"}
                              </button>
                              {importError && <div className="import-error">{importError}</div>}
                            </div>
                          )}
                        </Form.Label>
                        <XDEditor />
                      </DragAndDrop>
                    </Form.Group>
                  </Form>
                </div>
              </Panel>

              <PanelResizer size="5px" />

              {/* Content Panel (Right side) */}
              <Panel min="200px">
                <div className="content-panel">
                  <TabsContent />
                </div>
              </Panel>
            </PanelGroup>
          </>
        )}
      </Container>
    </>
  )
}

export default App

// Custom expand function to collapse tiles and clues by default
const customExpandNode = (level: number, _value: any, field?: string) => {
  // Collapse tiles and clues arrays at level 1 (they're large)
  if (level === 1 && (field === "tiles" || field === "clues")) return false

  // Expand everything else
  return true
}
