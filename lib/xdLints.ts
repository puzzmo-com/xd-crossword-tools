import { Clue, Report } from "./types"

export const runLinterForClue = async (clue: Clue, ordinal: "across" | "down", clueLine: number, hintLine?: number) => {
  const reports: Report[] = []

  const lowerClueBody = clue.body.toLocaleLowerCase()
  const lowerHint = clue.metadata?.hint.toLocaleLowerCase() || ""
  const ref = `${ordinal.slice(0, 1).toUpperCase}${clue.number}`

  const wordsForClue = lowerClueBody.split(" ")
  const wordsFromHint = lowerHint.split(" ")
  const wordsFromAnswer = clue.answer.toLocaleLowerCase().split("|") // TODO: We support custom separators, but this is a good start

  const wordsFromAnswerSet = new Set(wordsForClue)
  const wordsFromHintSet = new Set(wordsFromHint ?? [])

  const addReport = (message: string, isHint?: boolean) =>
    reports.push({
      type: "clue_msg",
      message,
      position: {
        col: 0,
        index: isHint ? clueLine : hintLine ?? clueLine,
      },
      length: 1,
      clueNum: clue.number,
      clueType: ordinal,
    })

  // Looking at each word in the clue to see if they are in the hint
  for (const word of wordsFromAnswer) {
    const isWordInHint = wordsFromHintSet.has(word)
    const isWordInClue = wordsFromAnswerSet.has(word)
    if (isWordInClue || isWordInHint) {
      const place = isWordInHint ? "hint" : "clue"
      addReport(`${ref} has an answer word '${word}' that is in the ${place}`, isWordInHint)
    }
  }

  // If you're referring to another clue, you probably need to do this
  if (lowerClueBody.includes("-across") || lowerClueBody.includes("-down")) {
    if (!clue.metadata?.refs) addReport(`Clue ${ref} has a -across or -down hint, but no refs are provided`)
  }

  // If the answer has a | in it, there should be a flag if the clue doesn't have a : in it, since a | should often indicate : Abbr., : Hyph., : 2 wds. , etc
  if (clue.answer.includes("|") && lowerHint && !lowerHint.includes(":")) {
    addReport(`Clue ${ref} has multiple words, but the hint doesn't have a : in it (e.g. : Abbr., : Hyph., : 2 wds. , etc)`)
  }

  return reports
}
