import { Clue, Report } from "xd-crossword-parser"

export const runLinterForClue = (clue: Clue, ordinal: "across" | "down") => {
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

  const addReport = (message: string, isHint?: boolean) =>
    reports.push({
      type: "clue_msg",
      message,
      position: {
        col: 0,
        index: isHint ? hintLine ?? clueLine : clueLine,
      },
      length: -1,
      clueNum: clue.number,
      clueType: ordinal,
    })

  // Looking at each word in the clue to see if they are in the hint
  for (const word of wordsFromAnswer) {
    const isWordInHint = wordsFromHintSet.has(word)
    const isWordInClue = wordsFromAnswerSet.has(word)
    if (isWordInClue || isWordInHint) {
      const place = isWordInHint ? "hint" : "clue"
      addReport(`${ref} has an answer word '${word}' which is in the ${place}`, isWordInHint)
    }
  }

  // If you're referring to another clue, you probably need to do this
  if (lowerClueBody.includes("-across") || lowerClueBody.includes("-down")) {
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
