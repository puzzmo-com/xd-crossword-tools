function _extractAnswerLength(clue: RawClueData): number {
  // Extract answer length from clue text, e.g., "(8)" or "(3,4)" 
  const match = clue.question.match(/\(([0-9,\s]+)\)/)
  if (!match) return clue.answer.length // fallback to answer length
  
  const lengthStr = match[1]
  
  // Handle compound answers like "(3,4)" 
  if (lengthStr.includes(",")) {
    return lengthStr.split(",").reduce((sum, part) => sum + parseInt(part.trim()), 0)
  }
  
  // Handle simple answers like "(8)"
  return parseInt(lengthStr)
}