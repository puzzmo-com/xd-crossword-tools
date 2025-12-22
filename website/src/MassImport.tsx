import React, { useState } from "react"
import "./Homepage.scss"

import Container from "react-bootstrap/esm/Container"
import Card from "react-bootstrap/esm/Card"
import Button from "react-bootstrap/esm/Button"
import Badge from "react-bootstrap/esm/Badge"
import Navbar from "react-bootstrap/esm/Navbar"
import Form from "react-bootstrap/esm/Form"
import InputGroup from "react-bootstrap/esm/InputGroup"
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

function MassImport() {
  const [results, setResults] = useState<ConversionResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCreatingZip, setIsCreatingZip] = useState(false)
  const [puzzleMeUrl, setPuzzleMeUrl] = useState("")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)

  const handleFilesProcessed = (newResults: ConversionResult[]) => {
    setResults(prev => [...prev, ...newResults])
  }

  const handlePuzzleMeImport = async () => {
    if (!puzzleMeUrl.trim()) return

    // Validate URL
    if (!puzzleMeUrl.includes("puzzleme.amuselabs.com")) {
      setUrlError("Please enter a valid PuzzleMe URL (puzzleme.amuselabs.com)")
      return
    }

    setIsLoadingUrl(true)
    setUrlError(null)

    try {
      // Use a CORS proxy to fetch the page
      // In production, you'd want your own proxy or backend
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(puzzleMeUrl)}`

      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
      }

      const html = await response.text()

      // Decode the puzzle
      const amuseData = decodePuzzleMeHTML(html)
      const xd = amuseToXD(amuseData)

      // Extract puzzle ID from URL or data for filename
      const puzzleId = amuseData.data.attributes.amuse_data.id || "puzzle"
      const title = amuseData.data.attributes.amuse_data.title || puzzleId

      // Add to results
      const result: ConversionResult = {
        filename: `${puzzleId}.xd`,
        status: "success",
        xd: xd,
        originalFormat: `PuzzleMe (${title})`
      }

      setResults(prev => [...prev, result])
      setPuzzleMeUrl("") // Clear input on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setUrlError(`Failed to import: ${errorMessage}`)
    } finally {
      setIsLoadingUrl(false)
    }
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
      
      // Add each XD file to the zip
      successfulResults.forEach(result => {
        const filename = result.filename.replace(/\.[^/.]+$/, ".xd")
        zip.file(filename, result.xd!)
      })
      
      // Generate zip file
      const content = await zip.generateAsync({ type: "blob" })
      
      // Download the zip
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
              <Card.Header className="card-header">
                <Card.Title className="mb-0">Drop Files Here</Card.Title>
              </Card.Header>
              <Card.Body>
                <MultiDragAndDrop onFilesProcessed={handleFilesProcessed} setIsProcessing={setIsProcessing} />
                
                <div className="mt-3">
                  <p className="text-muted">
                    Supported formats: <code>.puz</code>, <code>.jpz</code>, <code>.json</code> (amuse), <code>.xml</code> (uclick)
                  </p>
                  <p className="text-muted">
                    Drop multiple files or folders to convert them all at once.
                  </p>
                </div>

                <hr className="my-4" />

                <h6>Import from PuzzleMe URL</h6>
                <InputGroup className="mb-2">
                  <Form.Control
                    type="url"
                    placeholder="https://puzzleme.amuselabs.com/pmm/crossword?id=..."
                    value={puzzleMeUrl}
                    onChange={(e) => {
                      setPuzzleMeUrl(e.target.value)
                      setUrlError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handlePuzzleMeImport()
                      }
                    }}
                    disabled={isLoadingUrl}
                  />
                  <Button
                    variant="primary"
                    onClick={handlePuzzleMeImport}
                    disabled={isLoadingUrl || !puzzleMeUrl.trim()}
                  >
                    {isLoadingUrl ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Loading...
                      </>
                    ) : (
                      "Import"
                    )}
                  </Button>
                </InputGroup>
                {urlError && (
                  <div className="text-danger small">{urlError}</div>
                )}
                <p className="text-muted small">
                  Paste a PuzzleMe crossword URL to import directly from the web.
                </p>

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
                {isProcessing && (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Processing...</span>
                    </div>
                    <p className="mt-2">Processing files...</p>
                  </div>
                )}

                {!isProcessing && results.length === 0 && (
                  <div className="text-center text-muted p-4">
                    <p>No files processed yet. Drop some crossword files on the left to get started!</p>
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