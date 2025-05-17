import { createContext, useEffect, useMemo, useState } from "react"
import lzstring, { decompressFromEncodedURIComponent } from "lz-string"

import React from "react"

import { CrosswordJSON, editorInfoAtCursor, xdToJSON } from "xd-crossword-tools"
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
}>({
  xd: "",
  setXD: () => {},

  crosswordJSON: null,
  editorInfo: null,

  lastFileContext: null,
  setLastFileContext: () => {},
})

export const getScopeResult = () => scopeResult

export const RootProvider = ({ children }: React.PropsWithChildren<object>) => {
  const [xd, setXD] = useState(() => {
    const fromParams = new URLSearchParams(document.location.search).get("xd")
    const localData = localStorage.getItem("xd")
    return fromParams ? decompressFromEncodedURIComponent(fromParams) : localData || defaultExampleXD.xd
  })

  const [crosswordJSON, editorInfo, error] = useMemo(() => {
    try {
      const state = xdToJSON(xd, true, true)
      return [state, editorInfoAtCursor(state), null] as const
    } catch (error) {
      return [null, null, error] as const
    }
  }, [xd])

  const [lastFileContext, setLastFileContext] = useState<{ content: string | object; filename: string } | null>(null)

  useEffect(() => {
    if (xd !== defaultExampleXD.xd) localStorage.setItem("xd", xd)

    const options = new URLSearchParams(document.location.search)
    if (xd !== defaultExampleXD.xd) options.set("expression", lzstring.compressToEncodedURIComponent(xd))
    // if (scopeString !== initialScopeString) options.set("scope", lzstring.compressToEncodedURIComponent(scopeString))
    // if (tsInterfaceForSchema != initialTSInterfaceForSchema) options.set("ts", lzstring.compressToEncodedURIComponent(tsInterfaceForSchema))

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
      }}
    >
      {children}
    </RootContext.Provider>
  )
}
