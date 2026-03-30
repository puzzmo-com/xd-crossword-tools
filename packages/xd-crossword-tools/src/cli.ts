#!/usr/bin/env node

import * as fs from "fs"
import * as path from "path"

import { puzToXD } from "./puzToXD"
import { jpzToXD } from "./jpzToXD"
import { uclickXMLToXD } from "./uclickToXD"
import { amuseToXD } from "./amuseJSONToXD"
import { acrossTextToXD } from "./acrossTextToXD"
import { decodePuzzleMeHTML } from "./puzzleMeDecode"

const SUPPORTED_EXTENSIONS = [".puz", ".jpz", ".xml", ".json", ".txt"]

function usage(): never {
  console.log(`Usage: xd-crossword-tools <input-files...> -o <output-dir>

Converts crossword puzzle files to .xd format.

Supported input formats:
  .puz   - Across Lite binary format
  .jpz   - JPZ XML format
  .xml   - UClick XML format
  .json  - Amuse Labs JSON format
  .txt   - Across text format
  URL    - PuzzleMe URL (https://puzzleme.amuselabs.com/...)

Options:
  -o, --output <dir>  Output directory (default: current directory)
  -h, --help          Show this help message

Examples:
  xd-crossword-tools puzzle.puz -o ./converted
  xd-crossword-tools *.puz *.jpz -o ./xd-files
  xd-crossword-tools https://puzzleme.amuselabs.com/pmm/crossword?id=abc -o ./converted`)
  process.exit(0)
}

function convertFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case ".puz": {
      const buffer = fs.readFileSync(filePath)
      return puzToXD(buffer)
    }
    case ".jpz": {
      const content = fs.readFileSync(filePath, "utf-8")
      return jpzToXD(content)
    }
    case ".xml": {
      const content = fs.readFileSync(filePath, "utf-8")
      return uclickXMLToXD(content)
    }
    case ".json": {
      const content = fs.readFileSync(filePath, "utf-8")
      const json = JSON.parse(content)
      return amuseToXD(json)
    }
    case ".txt": {
      const content = fs.readFileSync(filePath, "utf-8")
      return acrossTextToXD(content)
    }
    default:
      throw new Error(`Unsupported file format: ${ext}`)
  }
}

async function convertURL(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  const html = await response.text()
  const amuse = decodePuzzleMeHTML(html)
  return amuseToXD(amuse)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    usage()
  }

  let outputDir = "."
  const inputs: string[] = []

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-o" || args[i] === "--output") {
      outputDir = args[++i]
      if (!outputDir) {
        console.error("Error: -o requires a directory argument")
        process.exit(1)
      }
    } else if (args[i].startsWith("-")) {
      console.error(`Unknown option: ${args[i]}`)
      process.exit(1)
    } else {
      inputs.push(args[i])
    }
  }

  if (inputs.length === 0) {
    console.error("Error: no input files specified")
    process.exit(1)
  }

  // Create output directory if needed
  fs.mkdirSync(outputDir, { recursive: true })

  let converted = 0
  let failed = 0

  for (const input of inputs) {
    const isURL = input.startsWith("http://") || input.startsWith("https://")

    try {
      let xd: string
      let outputName: string

      if (isURL) {
        const url = new URL(input)
        const id = url.searchParams.get("id") ?? url.pathname.split("/").pop() ?? "puzzle"
        outputName = id
        xd = await convertURL(input)
      } else {
        const ext = path.extname(input).toLowerCase()
        if (!SUPPORTED_EXTENSIONS.includes(ext)) {
          console.error(`Skipping ${input}: unsupported format (${ext})`)
          failed++
          continue
        }
        outputName = path.basename(input, ext)
        xd = convertFile(input)
      }

      const outputPath = path.join(outputDir, `${outputName}.xd`)
      fs.writeFileSync(outputPath, xd)
      console.log(`${input} -> ${outputPath}`)
      converted++
    } catch (err: any) {
      console.error(`Error converting ${input}: ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${converted} converted, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
