// A library for converting .xd Crossword data to JSON (as defined by Saul Pwanson - http://xd.saul.pw)

// xdparser.ts is a TypeScript fork of https://github.com/j-norwood-young/xd-crossword-parser
// 
// MIT License
// 
// Copyright (c) 2020 Jason Norwood-Young
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


export function XDParser(xd: string) {
    function processData(data: string) {
      // Split into parts
      const parts = data.split(/^$^$/gm).filter(s => s !== "\n")
      if (parts.length < 4) throw `Too few parts - expected 4+`
      const rawMeta = parts[0]
      const rawGrid = parts[1]
      const rawAcross = parts[2]
      const rawDown = parts[3]
      let notes = ""
      for (let index = 4; index < parts.length - 3; index++) {
        notes += parts[index];
      } 
      const meta = processMeta(rawMeta)
      const grid = processGrid(rawGrid)
      const across = processClues(rawAcross)
      const down = processClues(rawDown)
      return { meta, grid, across, down, rawGrid, rawAcross, rawDown, rawMeta, notes }
    }
  
    function processMeta(rawMeta: string) {
      const metaLines = rawMeta.split("\n").filter(s => s && s !== "\n")
      let meta: Record<string, string> = {}
      metaLines.forEach((metaLine, i) => {
        const lineParts = metaLine.split(": ")
        const key = lineParts.shift()
        if (!key) throw new Error(`Could not find a : in the meta on line ${i} - '${metaLine}'`)
        meta[key.toLowerCase()] = lineParts.join(": ")
      })
      return meta
    }
  
    function processGrid(rawGrid: string) {
      let result = []
      const lines = rawGrid.split("\n").filter(s => s && s !== "\n")
      for (let x = 0; x < lines.length; x++) {
        result[x] = lines[x].split("")
      }
      return result
    }
  
    function processClues(rawClues: string) {
      let result = []
      const lines = rawClues.split("\n").filter(s => s && s !== "\n")
      const regex = /(^.\d*)\.\s(.*)\s\~\s(.*)/
      for (let x = 0; x < lines.length; x++) {
        const parts = lines[x].match(regex)
        if (!parts) throw new Error(`Did not get a match at ${x} for ${lines[x]}`)
        if (parts.length !== 4) throw new Error(`Could not parse question ${lines[x]}`)
        result[x] = {
          num: parts[1],
          question: parts[2],
          answer: parts[3],
        }
      }
      return result
    }
  
    return processData(xd)
  }
  