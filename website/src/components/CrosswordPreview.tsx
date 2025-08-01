import React from "react"
import type { CrosswordJSON, Tile } from "xd-crossword-tools"

interface CrosswordPreviewProps {
  crosswordJSON: CrosswordJSON
}

export const CrosswordBarPreview: React.FC<CrosswordPreviewProps> = ({ crosswordJSON }) => {
  const { tiles } = crosswordJSON
  const rows = tiles.length
  const cols = tiles[0]?.length || 0

  const cellSize = 35
  const borderWidth = 1
  const barWidth = 2.5
  const barOffset = 0.5 // Slight offset to ensure bars render properly

  const width = cols * cellSize + borderWidth
  const height = rows * cellSize + borderWidth

  const renderTile = (tile: Tile, row: number, col: number) => {
    const x = col * cellSize
    const y = row * cellSize

    if (tile.type === "blank") {
      return <rect key={`${row}-${col}`} x={x} y={y} width={cellSize} height={cellSize} fill="#333" />
    }

    const elements: React.ReactElement[] = []

    // White background for letter/rebus/schrodinger tiles
    elements.push(
      <rect key={`${row}-${col}-bg`} x={x} y={y} width={cellSize} height={cellSize} fill="white" stroke="#ccc" strokeWidth={borderWidth} />
    )

    // Render clue numbers
    const clueNumber = tile.clues?.across || tile.clues?.down
    if (clueNumber) {
      elements.push(
        <text key={`${row}-${col}-num`} x={x + 2} y={y + 10} fontSize="10" fontFamily="Arial, sans-serif" fill="#000">
          {clueNumber}
        </text>
      )
    }

    // Render tile content
    if (tile.type === "letter") {
      elements.push(
        <text
          key={`${row}-${col}-letter`}
          x={x + cellSize / 2}
          y={y + cellSize / 2 + 5}
          fontSize="20"
          fontFamily="Arial, sans-serif"
          fill="#000"
          textAnchor="middle"
        >
          {tile.letter}
        </text>
      )
    } else if (tile.type === "rebus") {
      elements.push(
        <text
          key={`${row}-${col}-rebus`}
          x={x + cellSize / 2}
          y={y + cellSize / 2 + 3}
          fontSize="10"
          fontFamily="Arial, sans-serif"
          fill="#000"
          textAnchor="middle"
        >
          {tile.symbol}
        </text>
      )
    } else if (tile.type === "schrodinger") {
      elements.push(
        <text
          key={`${row}-${col}-schrodinger`}
          x={x + cellSize / 2}
          y={y + cellSize / 2 + 3}
          fontSize="12"
          fontFamily="Arial, sans-serif"
          fill="#000"
          textAnchor="middle"
        >
          {tile.validLetters.join("/")}
        </text>
      )
    }

    // Render bars
    if (tile.design) {
      tile.design.forEach((flag, idx) => {
        switch (flag) {
          case "bar-top":
            elements.push(
              <line
                key={`${row}-${col}-bar-top-${idx}`}
                x1={x - barOffset}
                y1={y}
                x2={x + cellSize + barOffset}
                y2={y}
                stroke="#000"
                strokeWidth={barWidth}
                strokeLinecap="square"
              />
            )
            break
          case "bar-left":
            elements.push(
              <line
                key={`${row}-${col}-bar-left-${idx}`}
                x1={x}
                y1={y - barOffset}
                x2={x}
                y2={y + cellSize + barOffset}
                stroke="#000"
                strokeWidth={barWidth}
                strokeLinecap="square"
              />
            )
            break
        }
      })
    }

    return <g key={`${row}-${col}`}>{elements}</g>
  }

  return (
    <div style={{ overflowX: "auto", overflowY: "auto", maxWidth: "100%", maxHeight: "600px" }}>
      <svg width={width} height={height} style={{ border: "1px solid #ccc", backgroundColor: "#f0f0f0" }}>
        {tiles.map((row, rowIdx) => row.map((tile, colIdx) => renderTile(tile, rowIdx, colIdx)))}
      </svg>
    </div>
  )
}
