import React from "react"
import { PanelGroup, Panel, PanelResizer } from "@window-splitter/react"
import { use } from "react"
import "./App.scss"

import Container from "react-bootstrap/esm/Container"
import Row from "react-bootstrap/esm/Row"
import Form from "react-bootstrap/esm/Form"
import Card from "react-bootstrap/esm/Card"
import Tab from "react-bootstrap/esm/Tab"
import Tabs from "react-bootstrap/esm/Tabs"
import { XDEditor } from "./XDEditor"
import { RootContext } from "./RootContext"

import "monaco-editor/esm/vs/editor/editor.all.js"
import { DragAndDrop } from "./DragAndDrop"

import { JsonView, allExpanded, defaultStyles } from "react-json-view-lite"
import "react-json-view-lite/dist/index.css"

function App() {
  const { crosswordJSON, lastFileContext } = use(RootContext)
  return (
    <Container fluid>
      <Row>
        <PanelGroup>
          <Panel min="180px">
            <Form>
              <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                <Form.Label>Expression Scope</Form.Label>
                <DragAndDrop>
                  <XDEditor />
                </DragAndDrop>
              </Form.Group>
            </Form>
          </Panel>

          <PanelResizer size="10px" />

          <Panel min="180px">
            <Tabs defaultActiveKey="result" id="uncontrolled-tab-example" className="mb-3">
              {crosswordJSON && (
                <Tab eventKey="result" title="JSON of XD">
                  <Card style={{ margin: "1em", wordWrap: "break-word" }}>
                    <Card.Body>
                      <Card.Title>The JSON version of this xd</Card.Title>
                      <JsonView data={crosswordJSON} shouldExpandNode={allExpanded} style={defaultStyles} />
                    </Card.Body>
                  </Card>
                </Tab>
              )}

              {lastFileContext && (
                <Tab eventKey="lastFile" title="Dropped File Content">
                  <Card style={{ margin: "1em" }}>
                    <Card.Header>{lastFileContext.filename}</Card.Header>
                    <Card.Body>
                      {typeof lastFileContext.content === "string" ? (
                        <code>
                          <pre>{lastFileContext.content}</pre>
                        </code>
                      ) : (
                        <code>
                          <JsonView data={lastFileContext.content} shouldExpandNode={allExpanded} style={defaultStyles} />
                        </code>
                      )}
                    </Card.Body>
                  </Card>
                </Tab>
              )}
            </Tabs>
          </Panel>
        </PanelGroup>
      </Row>
    </Container>
  )
}

export default App
