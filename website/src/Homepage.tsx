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

import "monaco-editor/esm/vs/editor/editor.all.js"
import { DragAndDrop } from "./components/SingleDragAndDrop"
import { PanelGroup, Panel, PanelResizer } from "@window-splitter/react"

import { JsonView, allExpanded, defaultStyles } from "react-json-view-lite"
import "react-json-view-lite/dist/index.css"
import { exampleXDs } from "./exampleXDs"
import Crossword from "@jaredreisinger/react-crossword"
import { convertToCrosswordFormat } from "./utils/convertToCrosswordFormat"

function App() {
  const { crosswordJSON, lastFileContext, setXD, validationReports } = use(RootContext)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(() => {
    // Load the last active tab from localStorage, defaulting to "result"
    return localStorage.getItem("activeTab") || "result"
  })

  // Shared tabs content component
  const TabsContent = () => (
    <Tabs activeKey={activeTab} onSelect={handleTabSelect} id="controlled-tab-example" className="mb-3">
      <Tab eventKey="docs" title="xd Format Spec">
        <Card className="modern-card">
          <Card.Body style={{ padding: 0 }}>
            <XDSpec />
          </Card.Body>
        </Card>
      </Tab>
      {crosswordJSON && (
        <Tab eventKey="result" title="JSON Output">
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
        <Tab eventKey="lastFile" title="File Content">
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
            Validation
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
                    focusBackground: "#66bb55",
                    highlightBackground: "#c0ebc0ff",
                    numberColor: "#000000",
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
    </Tabs>
  )

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
        <Container fluid className={isMobile ? "mobile-header-container" : ""}>
          <Navbar.Brand className={`brand-title ${isMobile ? "mobile-brand" : ""}`}>
            XD Crossword Tools
            <Badge bg="primary" className={`ms-2 version-badge ${isMobile ? "d-none" : ""}`}>
              playground
            </Badge>
          </Navbar.Brand>
          <div className={`header-subtitle ${isMobile ? "d-none" : ""}`}>Interactive crossword format converter and editor</div>
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
                  <Form.Label className="editor-label">
                    <strong>XD Editor</strong>
                    <div className="format-support">
                      Supports drag & drop of <code>.puz</code>, <code>.jpz</code>, <code>.json</code> (amuse), <code>.xml</code> (uclick)
                    </div>
                  </Form.Label>
                  <DragAndDrop>
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
            <PanelGroup orientation="horizontal" autosaveId="xd-tools-panels">
              {/* Editor Panel (Left side) */}
              <Panel default="400px" min="300px">
                <div className="editor-panel">
                  <Form className="form-container">
                    <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                      <Form.Label className="editor-label">
                        <strong>XD Editor</strong>
                        <div className="format-support">
                          Supports drag & drop of <code>.puz</code>, <code>.jpz</code>, <code>.json</code> (amuse), <code>.xml</code>{" "}
                          (uclick)
                        </div>
                      </Form.Label>
                      <DragAndDrop>
                        <XDEditor />
                      </DragAndDrop>
                    </Form.Group>
                  </Form>
                </div>
              </Panel>

              <PanelResizer size="5px" />

              {/* Content Panel (Right side) */}
              <Panel min="300px">
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
