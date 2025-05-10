import React, { use } from "react"

import { useCallback, useRef, useState } from "react"
import MonacoEditor, { EditorDidMount, EditorWillMount, monaco } from "react-monaco-editor"
import { defaultMonacoSettings } from "./monacoConstants"
import { RootContext } from "./RootContext"

const language = "xd"

// We need a thunk to get access to the latest info from the expression editor.
// This technique is a hack, because it only works with one expression editor per page.
// However, thats fine for this sandbox.
let getEditorTools = (text: string) => {}

// As monaco is a global, we need to ensure we only set up the language tools once
let didSetupLanguageTools = false

export const XDEditor = (props: {}) => {
  const { xd, setXD, editorInfo } = use(RootContext)

  const [height, setHeight] = useState(600)
  const wrapperElement = useRef<HTMLDivElement>(null)
  const setDefaultHeight = useRef(false)

  // When the inner content height changes, handle the resize
  const updateHeight = useCallback((e: monaco.editor.IContentSizeChangedEvent) => {
    if (e.contentHeightChanged || !setDefaultHeight.current) {
      setHeight(e.contentHeight)
      setDefaultHeight.current = true
    }
  }, [])

  const editorMounted = useCallback<EditorDidMount>(
    (e) => {
      // Handle width re-sizing
      if (wrapperElement.current) {
        const monacoWatcher = new ResizeObserver(() => e.layout())
        monacoWatcher.observe(wrapperElement.current)
      }

      e.onDidContentSizeChange(updateHeight)

      e.onDidChangeCursorPosition((e) => {
        const info = editorInfo?.(e.position.lineNumber, e.position.column)
        if (info) {
          console.log(info)
        }
      })
    },

    [updateHeight, editorInfo]
  )

  getEditorTools = (text) => {
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
            [/^D\d*\./, "down-clue"],
            [/^A\d*\. \^.*/, "across-meta"],
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
    },

    []
  )

  return (
    <div ref={wrapperElement} className="form-control me-2">
      <MonacoEditor
        width="100%"
        height={`${height}px`}
        language="expression"
        options={{
          // Style
          fontSize: 12,
          suggestFontSize: 16,
          padding: { top: 5, bottom: 0 },

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
