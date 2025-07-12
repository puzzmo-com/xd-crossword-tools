import React, { use } from "react"

import { useCallback, useRef, useState, useEffect } from "react"
import MonacoEditor, { EditorDidMount, EditorWillMount, monaco } from "react-monaco-editor"
import { defaultMonacoSettings } from "../monacoConstants"
import { RootContext } from "./RootContext"

const language = "xd"

// We need a thunk to get access to the latest info from the expression editor.
// This technique is a hack, because it only works with one expression editor per page.
// However, thats fine for this sandbox.
let getEditorTools = (text: string) => {}

// As monaco is a global, we need to ensure we only set up the language tools once
let didSetupLanguageTools = false

export const XDEditor = (props: {}) => {
  const { xd, setXD, editorInfo, validationReports, setCursorInfo } = use(RootContext)

  const [height, setHeight] = useState(600)
  const wrapperElement = useRef<HTMLDivElement>(null)
  const setDefaultHeight = useRef(false)
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  // When the inner content height changes, handle the resize
  const updateHeight = useCallback((e: monaco.editor.IContentSizeChangedEvent) => {
    if (e.contentHeightChanged || !setDefaultHeight.current) {
      setHeight(e.contentHeight)
      setDefaultHeight.current = true
    }
  }, [])

  const editorMounted = useCallback<EditorDidMount>(
    (e) => {
      // Store editor instance for later use
      editorInstanceRef.current = e

      // Handle width re-sizing
      if (wrapperElement.current) {
        const monacoWatcher = new ResizeObserver(() => e.layout())
        monacoWatcher.observe(wrapperElement.current)
      }

      e.onDidContentSizeChange(updateHeight)

      e.onDidChangeCursorPosition((e) => {
        const info = editorInfo?.(e.position.lineNumber - 1, e.position.column - 1)
        setCursorInfo(info || null)
      })
    },

    [updateHeight, editorInfo, setCursorInfo]
  )

  // Update Monaco markers when validation reports change
  useEffect(() => {
    if (!editorInstanceRef.current) return

    const editor = editorInstanceRef.current
    const model = editor.getModel()
    if (!model) return

    // Convert validation reports to Monaco markers
    const markers: monaco.editor.IMarkerData[] = validationReports.map((report) => {
      let severity = monaco.MarkerSeverity.Info
      
      // Set severity based on report type
      switch (report.type) {
        case "syntax":
          severity = monaco.MarkerSeverity.Error
          break
        case "clue_msg":
          severity = monaco.MarkerSeverity.Warning
          break
        default:
          severity = monaco.MarkerSeverity.Info
      }
      
      // Handle ValidationReport types (they have different structure)
      if ('clueNumber' in report && 'direction' in report) {
        severity = monaco.MarkerSeverity.Error
      }

      // Convert 0-based position to 1-based for Monaco
      const lineNumber = Math.max(1, (report.position?.index || 0) + 1)
      const startColumn = Math.max(1, (report.position?.col || 0) + 1)
      const endColumn = report.length > 0 ? startColumn + report.length : startColumn + 10

      return {
        severity,
        message: report.message,
        startLineNumber: lineNumber,
        endLineNumber: lineNumber,
        startColumn,
        endColumn,
        source: 'xd-validator'
      }
    })

    // Set markers on the model
    monaco.editor.setModelMarkers(model, 'xd-validator', markers)
  }, [validationReports])

  getEditorTools = (_text) => {
    const res = ""
    return res
  }

  const editorWillMount = useCallback<EditorWillMount>(
    (m) => {
      // m is a global, so these can only really get called once
      if (didSetupLanguageTools) return
      didSetupLanguageTools = true

      m.languages.register({ id: language })

      m.languages.setMonarchTokensProvider(language, {
        tokenizer: {
          root: [
            [/^(\s{0,3})(#+)((?:[^\\#])+)((?:#+)?)/, ["white", "keyword", "keyword", "keyword"]],

            [/^A\d*\./, "across-clue"],
            [/^A\d*\. \^.*/, "across-meta"],

            [/^D\d*\./, "down-clue"],
            [/^D\d*\. \^.*/, "down-meta"],

            [/ ~ .*/, "answer"],
            [/ ~ .*/, "hint"],
            [/^(A|D)(\d*) \^\w*:/, "key"],
            [/^(A|D) \^hint: \[ WIP \]/, "todo"],
            [/<!--/, "comment", "@comment"],
          ],
          comment: [
            [/[^<-]+/, "comment.content"],
            [/-->/, "comment", "@pop"],
            [/<!--/, "comment.content.invalid"],
            [/[<-]/, "comment.content"],
          ],
        },
      })

      m.languages.setLanguageConfiguration(language, {
        comments: { lineComment: "//", blockComment: ["<!--", "-->"] },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
        ],
      })

      // auto complete
      m.languages.registerCompletionItemProvider(language, {
        triggerCharacters: [".", " "],
        provideCompletionItems: (model, position) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          })

          const info = editorInfo?.(position.lineNumber, position.column - 1)

          // Handle accepting the auto-complete mid-way through a word
          let overlappingLetters: number | undefined = undefined
          if (info)
            textUntilPosition
              .split("")
              .reverse()
              .forEach((char, index) => {
                if (typeof overlappingLetters !== "undefined") return
                if (char === " " || char === "." || char === "(" || char === ")" || char === "]") {
                  overlappingLetters = index
                }
              })

          return {
            incomplete: false,
            suggestions: [],
            // suggestions: (info? || []).map((c) => ({
            //   ...c,
            //   kind: monaco.languages.CompletionItemKind.Variable,
            //   insertText: c.label.slice(overlappingLetters),
            //   range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            // })),
          }
        },
      })

      // m.languages.registerHoverProvider(language, {
      //   provideHover: (model, position) => {
      //     const info = editorInfo?.(position.lineNumber, position.column - 1)

      //     if (info) {
      //       return {
      //         contents: [{ value: info.schemaInfo?.description }, { value: JSON.stringify(info.scopeObject, null, 2) }],
      //       }
      //     }
      //   },
      // })

      m.editor.defineTheme("puzzmo", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "header", foreground: "22bb22", fontStyle: "bold" },
          { token: "across-clue", foreground: "16a34a" },
          { token: "down-clue", foreground: "16a34a" },
          { token: "across-meta", foreground: "059669" },
          { token: "down-meta", foreground: "059669" },
          { token: "answer", foreground: "365314" },
          { token: "key", foreground: "166534" },
          { token: "todo", foreground: "dc2626" },
          { token: "comment", foreground: "84cc16" },
          { token: "keyword.crossword", foreground: "365314" },
        ],

        colors: {
          "editor.foreground": "#365314",
          "editor.selectionBackground": "#d9f99d50",
          "editor.lineHighlightBackground": "#ecfccb50",
          "editorCursor.foreground": "#16a34a",
          "editorLineNumber.foreground": "#84cc16",
          "editorLineNumber.activeForeground": "#16a34a",
        },
      })
    },

    []
  )

  return (
    <div ref={wrapperElement} className="form-control me-2">
      <MonacoEditor
        width="100%"
        height={`${height}px`}
        language="xd"
        options={{
          // Style
          fontSize: 12,
          suggestFontSize: 16,
          padding: { top: 5, bottom: 0 },
          theme: "puzzmo",
          // Disable scroll capture to allow page scrolling
          scrollBeyondLastLine: false,
          scrollbar: {
            alwaysConsumeMouseWheel: false,
          },
          ...defaultMonacoSettings,
        }}
        onChange={setXD}
        value={xd}
        editorWillMount={editorWillMount}
        editorDidMount={editorMounted}
      />
    </div>
  )
}
