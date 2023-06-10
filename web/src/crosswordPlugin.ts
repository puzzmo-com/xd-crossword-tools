import { puzToXD, xdToJSON, editorInfoAtCursor, CrosswordJSON } from "../../index"

export type PluginConfig = {
  iframeRef: React.MutableRefObject<HTMLIFrameElement | null>
  crosswordJSONRef: React.MutableRefObject<CrosswordJSON | null>
  setPuzzleText: (str: string) => void
}

export const createBlankPlugin: (cfg: PluginConfig) => ReturnType<typeof createCrosswordPlugin> = () => ({
  setup: () => {},
  puzzleChanged: () => {},
  gameLaunched: () => {},
  droppedFiles: () => {},
})

const previousReportsToViewZones = new Map<string, any>()

export const createCrosswordPlugin = (cfg: PluginConfig) => {
  let editor: import("monaco-editor").editor.IStandaloneCodeEditor
  let monaco: typeof import("monaco-editor")

  const setup = (_editor: import("monaco-editor").editor.IStandaloneCodeEditor, _monaco: typeof import("monaco-editor")) => {
    editor = _editor
    monaco = _monaco

    // Setup the theme stuff
    themeSetup(monaco)
    monaco.editor.setTheme("puzmo")

    // Monitor the left panel for width changes, and tell monaco it's happened
    const monacoWatcher = new ResizeObserver(() => editor.layout())
    monacoWatcher.observe(document.getElementById("monaco-host")!)

    // Handle the cursor lookups
    const didChangePosition = (e) => {
      const crosswordJSON = cfg.crosswordJSONRef.current
      if (!crosswordJSON) return
      // Only do this on user specific changes
      if (e.reason !== monaco.editor.CursorChangeReason.Explicit) return

      const check = editorInfoAtCursor(crosswordJSON)
      const info = check(e.position.lineNumber - 1, e.position.column)

      if (!info) {
        return console.error("Got a null from editorInfoAtCursor, which is unexpected")
      }
      selectedClue = undefined
    }

    editor.onDidChangeCursorPosition(didChangePosition)

    const selectClue = (dir: "A" | "D", num: number) => {
      const crosswordJSON = cfg.crosswordJSONRef.current
      if (!crosswordJSON) return

      const direction = dir === "A" ? "across" : "down"

      // Don't do anything if we're in the same clue!
      const check = editorInfoAtCursor(crosswordJSON)
      const currentSelection = editor.getSelection()

      if (!currentSelection) return
      const currentPosition = check(currentSelection.positionLineNumber - 1, currentSelection.positionColumn)
      if (currentPosition.type === "clue" && currentPosition.direction === direction && currentPosition.number === num) {
        return
      }

      crosswordJSON.clues[direction].forEach((clue) => {
        // if (clue.number === num) cfg.setCurrentLookupWord(clue.answer)
      })

      const model = editor.getModel()
      if (!model) return

      // First try find and select the hint
      const hint = `${direction.slice(0, 1).toUpperCase()}${num} ^hint: `
      let matches = model.findMatches(hint, true, false, false, " ", true)
      if (matches[0]) {
        const line = model.getLineContent(matches[0].range.startLineNumber)
        const hintRange = new monaco.Range(
          matches[0].range.startLineNumber,
          matches[0].range.endColumn, // start at the end of the hint search
          matches[0].range.startLineNumber,
          line.length + 1
        )
        editor.setSelection(hintRange)
        editor.revealLineInCenter(matches[0].range.startLineNumber)
        return
      }

      // Fallback on to the clue
      const stringToFind = `${direction.slice(0, 1).toUpperCase()}${num}.`
      matches = model.findMatches(stringToFind, true, false, false, " ", true)
      if (matches[0]) {
        editor.setSelection(matches[0].range)
        editor.revealLineInCenter(matches[0].range.startLineNumber)
      }
    }
  }

  const puzzleChanged = (puz: string) => {
    const crosswordJSON = xdToJSON(puz, true, true)
    cfg.crosswordJSONRef.current = crosswordJSON

    const model = editor.getModel()
    if (editor && monaco && crosswordJSON && model) {
      const maxLines = model.getLineCount()

      const allReports = [...crosswordJSON.report.errors, ...crosswordJSON.report.warnings]
      const markers = allReports.map((e) => {
        const lineText = model.getLineContent(Math.min(e.position.index + 1, maxLines - 1))
        const hasHatAndColon = lineText.includes("^") && lineText.includes(":")
        return {
          startLineNumber: e.position.index + 1,
          startColumn: e.position.col,
          endColumn: e.type === "syntax" ? lineText.length + 1 : hasHatAndColon ? 11 : 5,
          endLineNumber: e.position.index + 1,
          severity: crosswordJSON.report.errors.includes(e) ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
          message: e.message,
        }
      })

      monaco.editor.setModelMarkers(model, "editor", markers)

      const reportByID = new Map(allReports.map((e) => [`${e.position.index}:${e.position.col}:${e.message}`, e]))
      const viewZoneIDs = [...reportByID.keys()]
      const viewZonesToRemove = [...previousReportsToViewZones.keys()].filter((k) => !viewZoneIDs.includes(k))
      const viewZonesToAdd = viewZoneIDs.filter((k) => !previousReportsToViewZones.has(k))

      editor.changeViewZones((change) => {
        for (const key of viewZonesToRemove) {
          change.removeZone(previousReportsToViewZones.get(key))
          previousReportsToViewZones.delete(key)
        }

        for (const key of viewZonesToAdd) {
          const error = reportByID.get(key)
          if (!error) continue
          const isError = crosswordJSON.report.errors.includes(error)

          const domNode = document.createElement("div")
          domNode.style.fontSize = "0.8rem"
          domNode.style.paddingLeft = "2px"
          domNode.style.background = isError ? "#8b000020" : "#8C460040"

          const inner = document.createElement("span")
          inner.style.color = "white"
          inner.style.display = "inline-block"
          inner.style.background = isError ? "#8B0000" : "#8C4600"
          inner.style.borderRadius = "4px"
          inner.style.paddingLeft = "4px"

          inner.style.paddingRight = "4px"
          inner.style.marginLeft = "4px"
          inner.style.height = "0.9rem"
          inner.style.lineHeight = "0.9rem"
          inner.style.whiteSpace = "nowrap"
          inner.style.textOverflow = "ellipsis"
          inner.textContent = error.message

          domNode.appendChild(inner)
          const zoneID = change.addZone({
            afterLineNumber: error.position.index + 1,
            heightInLines: 1,
            domNode: domNode,
          })

          previousReportsToViewZones.set(key, zoneID)
        }
      })
    }
  }

  const droppedFiles = (contents: DataTransfer) => {
    const item = contents.items[0]
    if (item.kind === "file") {
      const file = item.getAsFile()
      if (!file) return
      file.arrayBuffer().then((buffer) => {
        const xd = puzToXD(buffer)
        cfg.setPuzzleText(xd)
        puzzleChanged(xd)
      })
    }
  }

  return {
    setup,
    puzzleChanged,
    droppedFiles,
  }
}

export const themeSetup = (monaco: typeof import("monaco-editor")) => {
  monaco.languages.register({ id: "crossword" })

  monaco.languages.setMonarchTokensProvider("crossword", {
    tokenizer: {
      root: [
        [/\##.*/, "header"],
        [/^A\d*\./, "across-clue"],
        [/^D\d*\./, "down-clue"],
        [/^A\d*\. \^.*/, "across-meta"],
        [/^D\d*\. \^.*/, "down-meta"],
        [/ \~ .*/, "answer"],
        [/ \~ .*/, "hint"],
        [/^(A|D)(\d*) \^\w*:/, "key"],
        [/\[ WIP \]/, "todo"],
      ],
    },
  })

  monaco.editor.defineTheme("puzmo", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "header", foreground: "afa1ff", fontStyle: "bold" },
      { token: "across-clue", fontStyle: "bold" },
      { token: "down-clue", fontStyle: "bold" },
      { token: "across-meta", fontStyle: "italic" },
      { token: "down-meta", fontStyle: "italic" },
      { token: "answer", foreground: "eeeeee" },
      { token: "key", foreground: "D3CBFF" },
      { token: "todo", foreground: "FFAAAC" },
    ],
    colors: {
      "editor.foreground": "#cccccc",
    },
  })
}

const clueInfosForPosition = (tiles: any, clues: any, position: any) => {
  const tile = getTile(tiles, position)
  if (!tile) throw new Error("No tile at position")
  if (tile.type === "blank") return { down: undefined, across: undefined }

  // Start with the across clues, they should match the same index
  const downClue = clues.down.find((c) => {
    const sameColumn = c.position.col === position.col
    if (!sameColumn) return
    return c.position.index <= position.index && c.position.index + c.answer.length > position.index
  })

  const acrossClue = clues.across.find((clue) => {
    const sameIndex = clue.position.index === position.index
    if (!sameIndex) return
    return clue.position.col <= position.col && clue.position.col + clue.answer.length > position.col
  })

  return {
    down: !downClue ? undefined : { clue: downClue, index: clues.down.indexOf(downClue) },
    across: !acrossClue ? undefined : { clue: acrossClue, index: clues.across.indexOf(acrossClue) },
  }
}

export const getTile = (tiles: any, position: any): any | undefined => {
  if (!tiles[position.index] || !tiles[position.index][position.col]) {
    return undefined
  }
  return tiles[position.index][position.col]
}
