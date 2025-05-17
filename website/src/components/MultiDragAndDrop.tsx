import React, { useState, useCallback, use } from "react"
import { jpzToXD, puzToXD, amuseToXD, uclickXMLToXD } from "xd-crossword-tools"

import { decode } from "xd-crossword-tools/src/vendor/puzjs"

import { RootContext } from "./RootContext"

interface DragAndDropProps {
  children: React.ReactNode
}

export const DragAndDrop: React.FC<DragAndDropProps> = ({ children }) => {
  const { setXD, setLastFileContext } = use(RootContext)
  const acceptedFileTypes = [".puz", ".jpz", ".json", ".xml"]

  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      const validFiles = files.filter((file) => {
        const extension = "." + file.name.split(".").pop()?.toLowerCase()
        return acceptedFileTypes.includes(extension)
      })

      const file = validFiles[0]
      if (!file) return

      if (file.name.endsWith(".jpz")) {
        const jpz = await file.text()
        const xd = jpzToXD(jpz)
        setXD(xd)
        setLastFileContext({ content: jpz, filename: file.name })
      }

      if (file.name.endsWith(".puz")) {
        const puz = await file.arrayBuffer()
        const xd = puzToXD(new Uint8Array(puz))

        const puzJSON = decode(new Uint8Array(puz))
        setLastFileContext({ content: puzJSON, filename: file.name })

        setXD(xd)
      }

      if (file.name.endsWith(".json")) {
        const jsonText = await file.text()
        const json = JSON.parse(jsonText)

        if (json?.data?.attributes?.amuse_data) {
          const xd = amuseToXD(json)
          setXD(xd)
          setLastFileContext({ content: jsonText, filename: file.name })
        }
      }

      if (file.name.endsWith(".xml")) {
        const xmlText = await file.text()
        const xd = uclickXMLToXD(xmlText)
        setLastFileContext({ content: xd, filename: file.name })
      }
    },
    [setXD]
  )

  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={{ position: "relative" }}>
      {children}
      {isDragging && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: "2px dashed #4CAF50",
            borderRadius: "8px",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <p style={{ margin: 0, color: "#4CAF50" }}>Drop your crossword file here</p>
        </div>
      )}
    </div>
  )
}
