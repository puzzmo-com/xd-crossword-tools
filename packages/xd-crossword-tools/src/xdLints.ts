import { Clue, CrosswordJSON, Report } from "xd-crossword-tools-parser"

/**
 * Runs linting checks on a single clue and returns any issues found.
 *
 * Checks include:
 * - Answer words appearing in the clue body or hint (giving away the answer)
 * - `-across` / `-down` references in the clue body without `refs` metadata set
 *   (only when the puzzle has a `splitCharacter` defined)
 * - Multi-word answers (via splits) whose hint is missing a `:` qualifier
 *   (e.g. `: Abbr.`, `: Hyph.`, `: 2 wds.`)
 *
 * @param clue - The clue to lint
 * @param ordinal - Whether this is an across or down clue
 * @param crossword - The full crossword JSON; used to read puzzle-level meta (e.g. splitCharacter)
 */
export const runLinterForClue = (clue: Clue, ordinal: "across" | "down", crossword?: CrosswordJSON) => {
  const reports: Report[] = []

  const lowerClueBody = clue.body.toLocaleLowerCase()
  const lowerHint = clue.metadata?.hint?.toLocaleLowerCase() || ""
  const ref = `${ordinal.slice(0, 1).toUpperCase()}${clue.number}`

  const wordsForClue = lowerClueBody.split(" ")
  const wordsFromHint = lowerHint.split(" ")
  const wordsFromAnswer = answerWithSplits(clue).toLocaleLowerCase().split("|")

  const wordsFromAnswerSet = new Set(wordsForClue)
  const wordsFromHintSet = new Set(wordsFromHint ?? [])

  const clueLine = parseInt(clue.metadata?.["body:line"] || "-1")
  const hintLine = parseInt(clue.metadata?.["hint:line"] || "-1")

  const addReport = (message: string, isHint?: boolean, length?: number, col?: number) =>
    reports.push({
      type: "clue_msg",
      message,
      position: {
        col: col || 0,
        index: isHint ? hintLine ?? clueLine : clueLine,
      },
      length: length || clue.body.length + 10, // Default to approximate clue length
      clueNum: clue.number,
      clueType: ordinal,
    })

  // Looking at each word in the clue to see if they are in the hint
  for (const word of wordsFromAnswer) {
    const isWordInHint = wordsFromHintSet.has(word)
    const isWordInClue = wordsFromAnswerSet.has(word)
    if (isWordInClue || isWordInHint) {
      const place = isWordInHint ? "hint" : "clue"
      const clueLetterLength = clue.number.toString().length + 3 // +2 for ". "
      const col = lowerClueBody.indexOf(word) + clueLetterLength
      addReport(`${ref} has an answer word '${word}' which is in the ${place}`, isWordInHint, word.length, col)
    }
  }

  // If you're referring to another clue, you probably need to do this
  // Only relevant when a splitCharacter is defined in the meta, as that's when cross-clue refs are meaningful
  const splitCharacter = crossword?.meta.splitCharacter || (crossword?.meta as Record<string, string> | undefined)?.["splitcharacter"]
  if (splitCharacter && (lowerClueBody.includes("-across") || lowerClueBody.includes("-down"))) {
    if (!clue.metadata?.refs) addReport(`Clue ${ref} has a -across or -down hint, but no refs are provided`)
  }

  // If the answer has a | in it, there should be a flag if the clue doesn't have a : in it, since a | should often indicate : Abbr., : Hyph., : 2 wds. , etc
  if (clue.splits?.length && lowerHint) {
    if (!lowerHint.includes(":"))
      addReport(`${ref} answer has multiple words, but the hint doesn't have a : in it (e.g. : Abbr., : Hyph., : 2 wds. , etc)`)
    // if (!clue.body.includes(":"))
    //   addReport(`Clue ${ref} has multiple words, but the clue doesn't have a : in it (e.g. : Abbr., : Hyph., : 2 wds. , etc)`)
  }

  return reports
}

const answerWithSplits = (clue: Clue) => {
  if (!clue.splits) return clue.answer

  const answer = clue.answer.split("")
  ;[...clue.splits.reverse()].forEach((idx) => {
    answer.splice(idx + 1, 0, "|")
  })
  return answer.join("")
}
