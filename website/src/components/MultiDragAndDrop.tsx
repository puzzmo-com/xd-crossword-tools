import React, { useState, useCallback } from "react"
import { jpzToXD, puzToXD, amuseToXD, uclickXMLToXD } from "xd-crossword-tools"

interface ConversionResult {
  filename: string
  status: "success" | "error"
  xd?: string
  error?: string
  originalFormat: string
}

interface MultiDragAndDropProps {
  onFilesProcessed: (results: ConversionResult[]) => void
  setIsProcessing: (processing: boolean) => void
}

export const MultiDragAndDrop: React.FC<MultiDragAndDropProps> = ({ onFilesProcessed, setIsProcessing }) => {
  const acceptedFileTypes = [".puz", ".jpz", ".json", ".xml"]
  const [isDragging, setIsDragging] = useState(false)

  const processFile = async (file: File): Promise<ConversionResult> => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase()

    try {
      if (file.name.endsWith(".jpz")) {
        const jpz = await file.text()
        const xd = jpzToXD(jpz)
        return {
          filename: file.name,
          status: "success",
          xd,
          originalFormat: "JPZ",
        }
      }

      if (file.name.endsWith(".puz")) {
        const puz = await file.arrayBuffer()
        const xd = puzToXD(new Uint8Array(puz))
        return {
          filename: file.name,
          status: "success",
          xd,
          originalFormat: "PUZ",
        }
      }

      if (file.name.endsWith(".json")) {
        const jsonText = await file.text()
        const json = JSON.parse(jsonText)

        if (json?.data?.attributes?.amuse_data) {
          const xd = amuseToXD(json)
          return {
            filename: file.name,
            status: "success",
            xd,
            originalFormat: "Amuse JSON",
          }
        } else {
          throw new Error("Not a valid Amuse JSON file")
        }
      }

      if (file.name.endsWith(".xml")) {
        const xmlText = await file.text()
        const xd = uclickXMLToXD(xmlText)
        return {
          filename: file.name,
          status: "success",
          xd,
          originalFormat: "UClick XML",
        }
      }

      throw new Error(`Unsupported file type: ${extension}`)
    } catch (error) {
      return {
        filename: file.name,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error occurred",
        originalFormat: extension.toUpperCase(),
      }
    }
  }

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

      if (validFiles.length === 0) return

      setIsProcessing(true)

      // Process files in batches to avoid blocking UI
      const batchSize = 5
      const results: ConversionResult[] = []

      for (let i = 0; i < validFiles.length; i += batchSize) {
        const batch = validFiles.slice(i, i + batchSize)
        const batchResults = await Promise.all(batch.map(processFile))
        results.push(...batchResults)

        // Update results after each batch
        onFilesProcessed(batchResults)

        // Small delay to keep UI responsive
        if (i + batchSize < validFiles.length) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      setIsProcessing(false)
    },
    [onFilesProcessed, setIsProcessing]
  )

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      const validFiles = files.filter((file) => {
        const extension = "." + file.name.split(".").pop()?.toLowerCase()
        return acceptedFileTypes.includes(extension)
      })

      if (validFiles.length === 0) return

      setIsProcessing(true)

      const results = await Promise.all(validFiles.map(processFile))
      onFilesProcessed(results)

      setIsProcessing(false)
    },
    [onFilesProcessed, setIsProcessing]
  )

  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={{ position: "relative" }}>
      <div
        style={{
          border: isDragging ? "2px dashed #4CAF50" : "2px dashed #ccc",
          borderRadius: "8px",
          padding: "3rem",
          textAlign: "center",
          backgroundColor: isDragging ? "rgba(76, 175, 80, 0.1)" : "#f8f9fa",
          transition: "all 0.3s ease",
          minHeight: "200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: isDragging ? "#4CAF50" : "#666" }}>
          {isDragging ? "Drop your files here!" : "Drag and drop crossword files here"}
        </p>
        <p style={{ margin: "0 0 1rem 0", color: "#666", fontSize: "0.9rem" }}>or</p>
        <label
          htmlFor="file-input"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#0e672e",
            color: "white",
            borderRadius: "0.25rem",
            cursor: "pointer",
            fontSize: "0.9rem",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#166534")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0e672e")}
        >
          Browse Files
        </label>
        <input id="file-input" type="file" multiple accept=".puz,.jpz,.json,.xml" onChange={handleFileInput} style={{ display: "none" }} />
      </div>
    </div>
  )
}
