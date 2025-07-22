import React, { useState, useEffect, use } from "react"
import Card from "react-bootstrap/esm/Card"
import Badge from "react-bootstrap/esm/Badge"
import { CrosswordJSON } from "xd-crossword-tools-parser"
import { JSONToXD } from "xd-crossword-tools"
import { RootContext } from "./RootContext"

interface DesignEditorProps {
  designData: any
  crosswordJSON: CrosswordJSON
  onDesignChange?: (newDesign: any) => void
}

interface StyleDefinition {
  name: string
  className: string
  character: string
}

export const DesignEditor: React.FC<DesignEditorProps> = ({ designData, crosswordJSON, onDesignChange }) => {
  const { setXD } = use(RootContext)
  const [selectedStyle, setSelectedStyle] = useState<string>("")
  const [gridData, setGridData] = useState<string[][]>([])
  const [availableStyles, setAvailableStyles] = useState<StyleDefinition[]>([])

  // Initialize grid data from crossword
  useEffect(() => {
    if (crosswordJSON?.tiles) {
      const { tiles } = crosswordJSON
      const rows = tiles.length
      const cols = tiles[0]?.length || 0

      // Initialize grid with existing design data or default pattern
      const initialGrid: string[][] = []
      for (let row = 0; row < rows; row++) {
        initialGrid[row] = []
        for (let col = 0; col < cols; col++) {
          const tile = tiles[row][col]

          // Check if there's existing design position data for this tile
          const existingDesignValue = crosswordJSON.design?.positions?.[row]?.[col]
          if (existingDesignValue) {
            initialGrid[row][col] = existingDesignValue
          } else if (tile && (tile.type === "letter" || tile.type === "rebus" || tile.type === "schrodinger")) {
            initialGrid[row][col] = "."
          } else {
            initialGrid[row][col] = "#"
          }
        }
      }

      setGridData(initialGrid)
    }
  }, [crosswordJSON])

  // Parse available styles from crosswordJSON.design?.styles
  useEffect(() => {
    const styles: StyleDefinition[] = []

    // Read styles from crosswordJSON.design?.styles if available
    const designStyles = crosswordJSON?.design?.styles
    if (designStyles && typeof designStyles === "object") {
      // Get all keys from the styles object, excluding "#" (blocked tiles should not be settable)
      Object.keys(designStyles).forEach((styleKey: string) => {
        if (styleKey !== "#") {
          const styleData = designStyles[styleKey]
          styles.push({
            name: styleData?.name || styleKey,
            className: styleData?.className || styleKey,
            character: styleKey,
          })
        }
      })
    }

    // Add default "." style if no styles found (but never include "#")
    if (styles.length === 0) {
      styles.push({
        name: "Dot",
        className: "dot",
        character: ".",
      })
    }

    setAvailableStyles(styles)
    if (styles.length > 0 && !selectedStyle) {
      setSelectedStyle(styles[0].character)
    }
  }, [crosswordJSON?.design?.styles])

  const handleTileClick = (row: number, col: number) => {
    if (!selectedStyle) return

    // Don't allow clicking on blocked tiles ("#")
    const currentTile = gridData[row]?.[col]
    if (currentTile === "#") return

    // Update local grid data
    const newGridData = [...gridData]
    newGridData[row][col] = selectedStyle
    setGridData(newGridData)

    // Create updated crosswordJSON with new design positions
    const updatedCrosswordJSON: CrosswordJSON = {
      ...crosswordJSON,
      design: {
        ...crosswordJSON.design,
        positions: newGridData,
      },
    }

    // Convert back to XD format and update the main editor
    const updatedXD = JSONToXD(updatedCrosswordJSON)
    setXD(updatedXD)

    // Also call the onDesignChange callback if provided
    if (onDesignChange) {
      const newDesignData = {
        ...designData,
        grid: newGridData,
      }
      onDesignChange(newDesignData)
    }
  }

  const handleStyleSelect = (character: string) => {
    setSelectedStyle(character)
  }

  const renderGrid = () => {
    if (gridData.length === 0) return null

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridData[0]?.length || 0}, 1fr)`,
          gap: "0",
          backgroundColor: "#ccc",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        {gridData.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            // Get the actual crossword tile data
            const crosswordTile = crosswordJSON?.tiles?.[rowIndex]?.[colIndex]
            const actualLetter = crosswordTile?.letter || crosswordTile?.word || ""
            const isBlocked = cell === "#"

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleTileClick(rowIndex, colIndex)}
                style={{
                  width: "30px",
                  height: "30px",
                  backgroundColor: isBlocked ? "#333" : "#fff",
                  border: "1px solid #999",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isBlocked ? "not-allowed" : "pointer",
                  fontFamily: "monospace",
                  userSelect: "none",
                  opacity: isBlocked ? 0.6 : 1,
                  position: "relative",
                }}
                className={cell !== "." && cell !== "#" ? cell : ""}
              >
                {isBlocked ? (
                  <span style={{ fontSize: "16px", color: "#fff" }}>#</span>
                ) : (
                  <>
                    {/* Large actual letter */}
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#000",
                      }}
                    >
                      {actualLetter}
                    </span>

                    {/* Small CSS style character in corner if different from "." */}
                    {cell !== "." && (
                      <span
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          fontSize: "8px",
                          color: "#666",
                          backgroundColor: "#f0f0f0",
                          borderRadius: "2px",
                          padding: "1px 2px",
                          lineHeight: "1",
                        }}
                      >
                        {cell}
                      </span>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
    )
  }

  return (
    <div>
      <Card.Body>
        {/* Style Selector */}
        <div className="mb-3">
          <h6>Available Styles:</h6>
          <div className="d-flex gap-2 flex-wrap">
            {availableStyles.map((style) => (
              <Badge
                key={style.character}
                bg={selectedStyle === style.character ? "primary" : "secondary"}
                style={{
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: "8px 12px",
                }}
                onClick={() => handleStyleSelect(style.character)}
              >
                {style.character}
              </Badge>
            ))}
          </div>
          {selectedStyle && (
            <small className="text-muted d-block mt-2">
              Selected: <strong>{selectedStyle}</strong> - Click on tiles to apply this style
            </small>
          )}
        </div>

        {/* Grid */}
        <div>
          <h6>Grid:</h6>
          {renderGrid()}
          <small className="text-muted d-block mt-2">Click on any tile to apply the selected style</small>
        </div>
      </Card.Body>
    </div>
  )
}
