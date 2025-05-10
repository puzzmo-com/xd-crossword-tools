import * as monacoEditor from "monaco-editor"

export const defaultMonacoSettings: monacoEditor.editor.IStandaloneEditorConstructionOptions = {
  scrollBeyondLastLine: false,
  minimap: { enabled: false },

  lineNumbers: "off",
  showFoldingControls: "never",
  folding: false,
  glyphMargin: false,
  renderLineHighlight: "none",
  lineNumbersMinChars: 0,
  selectionHighlight: false,
}
