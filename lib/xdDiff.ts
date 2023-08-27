import { Clue, CrosswordJSON } from "./types"
import { xdParser } from "./xdparser2"

export type DiffResults =
  | {
      error: true
      message: string
    }
  | {
      diff: Array<
        | { type: "same"; content: string }
        | { type: "change"; before: string; after: string; beforeLine: number; afterLine: number }
        | { type: "add"; after: string; afterLine: number }
        | { type: "remove"; before: string; beforeLine: number }
      >
      notes: any
    }

/** Creates an array of lines with a (mostly) semantic diff for a lot of the key changes in an xd file.
 * For the lower-priority ones, we use a simpler text diff. Aims to keep track of the lines from both before and after.  */
export const xdDiff = (beforeXD: string, afterXD: string) => {
  const beforeXDLines = beforeXD.split("\n")
  const afterXDLines = afterXD.split("\n")

  const before = xdParser(beforeXD, true, true)
  const after = xdParser(afterXD, true, true)
  const results: DiffResults = { diff: [], notes: {} }
  const diff = results.diff

  // Metadata ----------------------------
  const beforeMetaKeys = Object.keys(before.meta)
    .filter((k) => !k.includes(":"))
    .sort()
  const afterMetaKeys = Object.keys(after.meta)
    .filter((k) => !k.includes(":"))
    .sort()

  const addedMetaKeys = afterMetaKeys.filter((x) => !beforeMetaKeys.includes(x))
  const removedMetaKeys = beforeMetaKeys.filter((x) => !afterMetaKeys.includes(x))
  const sameMetaKeys = beforeMetaKeys.filter((x) => afterMetaKeys.includes(x))

  const afterMetaIndex = after.editorInfo?.sections?.find((x) => x.type === "metadata")?.startLine ?? 0

  diff.push({ type: "same", content: "## Metadata" })
  diff.push({ type: "same", content: "" })

  sameMetaKeys.forEach((key) => {
    const sameContent = before.meta[key] === after.meta[key]
    if (sameContent) {
      diff.push({ type: "same", content: `${key}: ${before.meta[key]}` })
    } else {
      diff.push({
        type: "change",
        before: `${key}: ${before.meta[key]}`,
        after: `${key}: ${after.meta[key]}`,
        beforeLine: Number(before.meta[key + ":line"]),
        afterLine: Number(after.meta[key + ":line"]),
      })
    }
  })
  addedMetaKeys.forEach((key) => {
    diff.push({ type: "add", after: `${key}: ${after.meta[key]}`, afterLine: Number(after.meta[key + ":line"]) })
  })
  removedMetaKeys.forEach((key) => {
    diff.push({ type: "remove", before: `${key}: ${before.meta[key]}`, beforeLine: Number(before.meta[key + ":line"]) })
  })

  diff.push({ type: "same", content: "" })

  // Grid, do a simpler string diff here ----------------------------
  const textOptions = { before, after, beforeLines: beforeXDLines, afterLines: afterXDLines }
  printTextSection("grid", textOptions)

  // Clues ----------------------------
  const beforeCluesSection = before.editorInfo?.sections?.find((x) => x.type === "clues")
  const afterCluesSection = after.editorInfo?.sections?.find((x) => x.type === "clues")

  if (beforeCluesSection && afterCluesSection) {
    diff.push({ type: "same", content: "## Clues" })
    diff.push({ type: "same", content: "" })

    for (const clue of after.clues.across) {
      const beforeClue = before.clues.across.find((x) => x.number === clue.number)
      printClue(beforeClue, clue, "A")
    }
    diff.push({ type: "same", content: "" })

    for (const clue of after.clues.down) {
      const beforeClue = before.clues.down.find((x) => x.number === clue.number)
      printClue(beforeClue, clue, "D")
    }
  }

  // Text diff all of the other sections! -----------------------

  const sectionsNotToDiff = ["metadata", "grid", "clues"]
  const sectionsToDiff = before.editorInfo?.sections?.filter((x) => !sectionsNotToDiff.includes(x.type))
  for (const section of sectionsToDiff ?? []) {
    printTextSection(section.type, textOptions)
  }

  // Util fns ------------------------
  function printClue(before: Clue | undefined, after: Clue | undefined, prefix = "A") {
    // Body
    if (!before && after) {
      const line = `${prefix}${after.number}. ${after.body} ~ ${after.metadata?.["answer:unprocessed"]!}`
      diff.push({ type: "add", after: line, afterLine: Number(after.metadata?.["body:line"]) })
    } else if (before && !after) {
      const line = `${prefix}${before.number}. ${before.body} ~ ${before.metadata?.["answer:unprocessed"]!}`
      diff.push({ type: "remove", before: line, beforeLine: Number(before.metadata?.["body:line"]) })
    } else if (before && after && before.body === after.body) {
      const line = `${prefix}${before.number}. ${before.body} ~ ${before.metadata?.["answer:unprocessed"]!}`
      diff.push({ type: "same", content: line })
    } else if (before && after && before.body !== after.body) {
      const afterLine = `${prefix}${after.number}. ${after.body} ~ ${after.metadata?.["answer:unprocessed"]!}`
      const beforeLine = `${prefix}${before.number}. ${before.body} ~ ${before.metadata?.["answer:unprocessed"]!}`

      diff.push({
        type: "change",
        before: beforeLine,
        after: afterLine,
        beforeLine: Number(before?.metadata?.["body:line"]),
        afterLine: Number(after?.metadata?.["body:line"]),
      })
    }

    // Metadata
    if (before && after && before?.metadata && after?.metadata) {
      const beforeMetaKeys = Object.keys(before.metadata)
        .filter((x) => !x.includes(":"))
        .sort()
      const afterMetaKeys = Object.keys(after.metadata)
        .filter((x) => !x.includes(":"))
        .sort()

      const addedMetaKeys = afterMetaKeys.filter((x) => !beforeMetaKeys.includes(x))
      const removedMetaKeys = beforeMetaKeys.filter((x) => !afterMetaKeys.includes(x))
      const sameMetaKeys = beforeMetaKeys.filter((x) => afterMetaKeys.includes(x))

      for (const key of sameMetaKeys) {
        const sameContent = before.metadata[key] === after.metadata[key]
        if (sameContent) {
          diff.push({ type: "same", content: `${prefix}${before.number} ^${key}: ${before.metadata[key]}` })
        } else {
          diff.push({
            type: "change",
            before: `${prefix}${before.number} ^${key}: ${before.metadata[key]}`,
            after: `${prefix}${after.number} ^${key}: ${after.metadata[key]}`,
            beforeLine: Number(before.metadata[key + ":line"]),
            afterLine: Number(after.metadata[key + ":line"]),
          })
        }
      }

      for (const key of addedMetaKeys) {
        diff.push({
          type: "add",
          after: `${prefix}${after.number} ^${key}: ${after.metadata[key]}`,
          afterLine: afterMetaIndex + diff.length,
        })
      }

      for (const key of removedMetaKeys) {
        diff.push({
          type: "remove",
          before: `${prefix}${before.number} ^${key}: ${before.metadata[key]}`,
          beforeLine: afterMetaIndex + diff.length,
        })
      }
    }
    diff.push({ type: "same", content: "" })
  }

  function printTextSection(
    name: string,
    opts: { before: CrosswordJSON; after: CrosswordJSON; beforeLines: string[]; afterLines: string[] }
  ) {
    const { before, after, beforeLines, afterLines } = opts

    const beforeSection = before.editorInfo?.sections?.find((x) => x.type === name)
    const afterSection = after.editorInfo?.sections?.find((x) => x.type === name)

    if (beforeSection && afterSection) {
      const sectionBeforeLines = beforeLines.slice(beforeSection.startLine, beforeSection.endLine)
      const sectionAfterLines = afterLines.slice(afterSection.startLine, afterSection.endLine)

      for (let i = 0; i < sectionAfterLines.length; i++) {
        const beforeLine = sectionBeforeLines[i]
        const afterLine = sectionAfterLines[i]
        if (beforeLine === afterLine) {
          diff.push({ type: "same", content: beforeLine })
        } else {
          diff.push({
            type: "change",
            before: beforeLine,
            after: afterLine,
            beforeLine: beforeSection.startLine + i,
            afterLine: afterSection.startLine + i,
          })
        }
        if (i === 0) {
          diff.push({ type: "same", content: "" })
        }
      }
    }
  }

  return results
}
