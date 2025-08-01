import { createContext, useEffect, useMemo, useState } from "react"
import lzstring, { decompressFromEncodedURIComponent } from "lz-string"

import React from "react"

import {
  CrosswordJSON,
  editorInfoAtCursor,
  xdToJSON,
  runLinterForClue,
  validateClueAnswersMatchGrid,
  PositionInfo,
  Report,
} from "xd-crossword-tools"

import { defaultExampleXD } from "../exampleXDs"
// eslint-disable-next-line no-var
var scopeResult = {}

export const RootContext = createContext<{
  xd: string
  setXD: (str: string) => void

  crosswordJSON: CrosswordJSON | null
  editorInfo: ReturnType<typeof editorInfoAtCursor> | null
  lastFileContext: { content: string | object; filename: string } | null
  setLastFileContext: (file: { content: string | object; filename: string }) => void

  validationReports: Report[]
  cursorInfo: PositionInfo | null
  setCursorInfo: (info: PositionInfo | null) => void
}>({
  xd: "",
  setXD: () => {},

  crosswordJSON: null,
  editorInfo: null,

  lastFileContext: null,
  setLastFileContext: () => {},

  validationReports: [],
  cursorInfo: null,
  setCursorInfo: () => {},
})

export const getScopeResult = () => scopeResult

export const RootProvider = ({ children }: React.PropsWithChildren<object>) => {
  const [xd, setXD] = useState(() => {
    const fromParams = new URLSearchParams(document.location.search).get("xd")
    const localData = localStorage.getItem("xd")
    return fromParams ? decompressFromEncodedURIComponent(fromParams) : localData || defaultExampleXD.xd
  })

  const [crosswordJSON, editorInfo, validationReports] = useMemo(() => {
    try {
      const state = xdToJSON(xd, true, true)
      const editorInfo = editorInfoAtCursor(state)

      // Run validation
      const reports: Report[] = []

      // Add existing parser reports if available
      if (state.report?.errors) {
        reports.push(...state.report.errors)
      }

      // Run linter for each clue
      for (const clue of state.clues.across) {
        reports.push(...runLinterForClue(clue, "across"))
      }
      for (const clue of state.clues.down) {
        reports.push(...runLinterForClue(clue, "down"))
      }

      // Run grid validation
      reports.push(...validateClueAnswersMatchGrid(state))

      return [state, editorInfo, reports] as const
    } catch (error) {
      // Create a validation report for the parsing error
      const errorReport: Report = {
        type: "syntax",
        message: error instanceof Error ? error.message : "Failed to parse XD content",
        position: { col: 0, index: 0 },
        length: -1,
      }

      return [null, null, [errorReport] as Report[]] as const
    }
  }, [xd])

  const [lastFileContext, setLastFileContext] = useState<{ content: string | object; filename: string } | null>(null)
  const [cursorInfo, setCursorInfo] = useState<PositionInfo | null>(null)

  useEffect(() => {
    if (xd !== defaultExampleXD.xd) localStorage.setItem("xd", xd)

    const options = new URLSearchParams(document.location.search)
    if (xd !== defaultExampleXD.xd) options.set("expression", lzstring.compressToEncodedURIComponent(xd))

    const newUrl = `${document.location.origin}${document.location.pathname}?${options.toString()}`
    window.history.replaceState({}, "", newUrl)
  }, [xd])

  return (
    <RootContext.Provider
      value={{
        xd,
        setXD,
        crosswordJSON,
        editorInfo,
        lastFileContext,
        setLastFileContext,
        validationReports,
        cursorInfo,
        setCursorInfo,
      }}
    >
      {children}
    </RootContext.Provider>
  )
}
