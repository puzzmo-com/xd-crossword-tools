import React, { useState } from "react"
import "./Homepage.scss"

import Container from "react-bootstrap/esm/Container"
import Card from "react-bootstrap/esm/Card"
import Button from "react-bootstrap/esm/Button"
import Badge from "react-bootstrap/esm/Badge"
import Navbar from "react-bootstrap/esm/Navbar"
import Form from "react-bootstrap/esm/Form"
import Nav from "react-bootstrap/esm/Nav"
import { Link } from "wouter"
import JSZip from "jszip"

import { MultiDragAndDrop } from "./components/MultiDragAndDrop"
import { decodePuzzleMeHTML, amuseToXD } from "xd-crossword-tools"

interface ConversionResult {
  filename: string
  status: "success" | "error"
  xd?: string
  error?: string
  originalFormat: string
}

type ImportMode = "files" | "puzzleme"

function MassImport() {
  const [mode, setMode] = useState<ImportMode>("files")
  const [results, setResults] = useState<ConversionResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCreatingZip, setIsCreatingZip] = useState(false)

  // PuzzleMe mode state
  const [puzzleMeUrls, setPuzzleMeUrls] = useState("")
  const [isLoadingUrls, setIsLoadingUrls] = useState(false)
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
  const [totalUrls, setTotalUrls] = useState(0)

  const handleFilesProcessed = (newResults: ConversionResult[]) => {
    setResults(prev => [...prev, ...newResults])
  }

  const handlePuzzleMeBatchImport = async () => {
    const urls = puzzleMeUrls
      .split("\n")
      .map(url => url.trim())
      .filter(url => url.length > 0 && url.includes("puzzleme.amuselabs.com"))

    if (urls.length === 0) return

    setIsLoadingUrls(true)
    setTotalUrls(urls.length)
    setCurrentUrlIndex(0)

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      setCurrentUrlIndex(i + 1)

      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`
        const response = await fetch(proxyUrl)

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
        }

        const html = await response.text()
        const amuseData = decodePuzzleMeHTML(html)
        const xd = amuseToXD(amuseData)

        const puzzleId = amuseData.data.attributes.amuse_data.id || "puzzle"
        const title = amuseData.data.attributes.amuse_data.title || puzzleId

        const result: ConversionResult = {
          filename: `${puzzleId}.xd`,
          status: "success",
          xd: xd,
          originalFormat: `PuzzleMe (${title})`
        }

        setResults(prev => [...prev, result])
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"

        // Extract puzzle ID from URL for error reporting
        const urlMatch = url.match(/[?&]id=([^&]+)/)
        const puzzleId = urlMatch ? urlMatch[1] : "unknown"

        const result: ConversionResult = {
          filename: `${puzzleId}.xd`,
          status: "error",
          error: errorMessage,
          originalFormat: "PuzzleMe"
        }

        setResults(prev => [...prev, result])
      }

      // Small delay between requests to be nice to the server
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setIsLoadingUrls(false)
    setPuzzleMeUrls("")
  }

  const clearResults = () => {
    setResults([])
  }

  const downloadAllXD = async () => {
    const successfulResults = results.filter(r => r.status === "success" && r.xd)

    if (successfulResults.length === 0) return

    setIsCreatingZip(true)

    try {
      const zip = new JSZip()

      successfulResults.forEach(result => {
        const filename = result.filename.replace(/\.[^/.]+$/, ".xd")
        zip.file(filename, result.xd!)
      })

      const content = await zip.generateAsync({ type: "blob" })

      const url = URL.createObjectURL(content)
      const a = document.createElement("a")
      a.href = url
      a.download = `converted-puzzles-${new Date().toISOString().split('T')[0]}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error creating zip file:", error)
      alert("Error creating zip file. Please try again.")
    } finally {
      setIsCreatingZip(false)
    }
  }

  const downloadSingleXD = (result: ConversionResult) => {
    if (!result.xd) return

    const blob = new Blob([result.xd], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = result.filename.replace(/\.[^/.]+$/, ".xd")
    a.click()
    URL.revokeObjectURL(url)
  }

  const successCount = results.filter(r => r.status === "success").length
  const errorCount = results.filter(r => r.status === "error").length

  const validUrlCount = puzzleMeUrls
    .split("\n")
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.includes("puzzleme.amuselabs.com"))
    .length

  return (
    <>
      <Navbar className="modern-header shadow-sm mb-0" expand="lg">
        <Container fluid>
          <Navbar.Brand className="brand-title">
            XD Crossword Tools
            <Badge bg="primary" className="ms-2 version-badge">
              mass import
            </Badge>
          </Navbar.Brand>
          <div className="header-subtitle">Batch convert multiple crossword files to XD format</div>
          <Link to="/">
            <Button variant="outline-light" size="sm">
              Back to Editor
            </Button>
          </Link>
        </Container>
      </Navbar>

      <Container fluid className="main-content">
        <div className="row g-3">
          <div className="col-md-6">
            <Card className="modern-card h-100">
              <Card.Header className="card-header p-0">
                <Nav variant="tabs" activeKey={mode} onSelect={(k) => setMode(k as ImportMode)}>
                  <Nav.Item>
                    <Nav.Link eventKey="files" className="px-4">Files</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="puzzleme" className="px-4">PuzzleMe URLs</Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body>
                {mode === "files" && (
                  <>
                    <MultiDragAndDrop onFilesProcessed={handleFilesProcessed} setIsProcessing={setIsProcessing} />

                    <div className="mt-3">
                      <p className="text-muted">
                        Supported formats: <code>.puz</code>, <code>.jpz</code>, <code>.json</code> (amuse), <code>.xml</code> (uclick)
                      </p>
                      <p className="text-muted">
                        Drop multiple files or folders to convert them all at once.
                      </p>
                    </div>
                  </>
                )}

                {mode === "puzzleme" && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Paste PuzzleMe URLs (one per line)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={10}
                        placeholder={"https://puzzleme.amuselabs.com/pmm/crossword?id=puzzle1&set=...\nhttps://puzzleme.amuselabs.com/pmm/crossword?id=puzzle2&set=...\nhttps://puzzleme.amuselabs.com/pmm/crossword?id=puzzle3&set=..."}
                        value={puzzleMeUrls}
                        onChange={(e) => setPuzzleMeUrls(e.target.value)}
                        disabled={isLoadingUrls}
                        style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                      />
                    </Form.Group>

                    {isLoadingUrls && (
                      <div className="mb-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <span>Processing URL {currentUrlIndex} of {totalUrls}...</span>
                        </div>
                        <div className="progress">
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${(currentUrlIndex / totalUrls) * 100}%` }}
                            aria-valuenow={currentUrlIndex}
                            aria-valuemin={0}
                            aria-valuemax={totalUrls}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      onClick={handlePuzzleMeBatchImport}
                      disabled={isLoadingUrls || validUrlCount === 0}
                      className="w-100"
                    >
                      {isLoadingUrls ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Importing...
                        </>
                      ) : (
                        `Import ${validUrlCount} URL${validUrlCount !== 1 ? "s" : ""}`
                      )}
                    </Button>

                    <p className="text-muted small mt-2">
                      Each URL will be fetched and converted to XD format. Invalid URLs will be skipped.
                    </p>
                  </>
                )}

                {results.length > 0 && (
                  <div className="mt-3 d-flex gap-2">
                    <Button
                      variant="success"
                      onClick={downloadAllXD}
                      disabled={successCount === 0 || isCreatingZip}
                    >
                      {isCreatingZip ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating ZIP...
                        </>
                      ) : (
                        `Download ZIP (${successCount} files)`
                      )}
                    </Button>
                    <Button
                      variant="outline-danger"
                      onClick={clearResults}
                    >
                      Clear Results
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          <div className="col-md-6">
            <Card className="modern-card h-100">
              <Card.Header className="card-header">
                <Card.Title className="mb-0">
                  Conversion Results
                  {results.length > 0 && (
                    <>
                      <Badge bg="success" className="ms-2">{successCount} succeeded</Badge>
                      {errorCount > 0 && <Badge bg="danger" className="ms-2">{errorCount} failed</Badge>}
                    </>
                  )}
                </Card.Title>
              </Card.Header>
              <Card.Body style={{ maxHeight: "70vh", overflow: "auto" }}>
                {(isProcessing || isLoadingUrls) && results.length === 0 && (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Processing...</span>
                    </div>
                    <p className="mt-2">Processing...</p>
                  </div>
                )}

                {!isProcessing && !isLoadingUrls && results.length === 0 && (
                  <div className="text-center text-muted p-4">
                    <p>No files processed yet. {mode === "files" ? "Drop some crossword files on the left to get started!" : "Paste some PuzzleMe URLs and click Import!"}</p>
                  </div>
                )}

                {results.map((result, index) => (
                  <div key={index} className={`mb-3 p-3 border rounded ${result.status === "success" ? "border-success" : "border-danger"}`}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">
                          {result.status === "success" ? "✅" : "❌"} {result.filename}
                        </h6>
                        <small className="text-muted">
                          Format: {result.originalFormat}
                        </small>
                      </div>
                      {result.status === "success" && (
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => downloadSingleXD(result)}
                        >
                          Download
                        </Button>
                      )}
                    </div>

                    {result.status === "error" && (
                      <div className="mt-2">
                        <small className="text-danger">{result.error}</small>
                      </div>
                    )}

                    {result.status === "success" && result.xd && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-primary">Preview XD</summary>
                        <pre className="mt-2 p-2 bg-light rounded" style={{ maxHeight: "200px", overflow: "auto", fontSize: "0.8rem" }}>
                          {result.xd.substring(0, 500)}...
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </>
  )
}

export default MassImport
