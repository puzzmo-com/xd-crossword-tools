/**
 * Shared list of Unicode symbols used for representing rebus cells
 * in crossword puzzles. These symbols are used when converting from
 * formats that use numbered/lettered rebus markers to the XD format.
 */
const REBUS_SYMBOLS = [
  "❶", "❷", "❸", "❹", "❺", "❻", "❼", "❽", "❾", "❿",
  "➀", "➁", "➂", "➃", "➄", "➅", "➆", "➇", "➈", "➉",
  "➊", "➋", "➌", "➍", "➎", "➏", "➐", "➑", "➒", "➓",
  "✪", "✫", "✬", "✭", "✮", "✯", "✰", "✱", "✲", "✳",
  "✴", "✵", "✶", "✷", "✸", "✹", "✺", "✻", "✼", "✽",
  "✾", "✿", "❀", "❁", "❂", "❃", "❄", "❅", "❆", "❇",
  "❈", "❉", "❊", "❋",
  "À", "Á", "Â", "Ã", "Ä", "Å", "Æ", "Ç", "È", "É",
  "Ê", "Ë", "Ì", "Í", "Î", "Ï", "Ð", "Ñ", "Ò", "Ó",
  "Ô", "Õ", "Ö", "Ø", "Ù", "Ú", "Û", "Ü", "Ý", "Þ",
  "ß", "à", "á", "â", "ã", "ä", "å", "æ", "ç", "è",
  "é", "ê", "ë", "ì", "í", "î", "ï", "ð", "ñ", "ò",
  "ó", "ô", "õ", "ö", "ø", "ù", "ú", "û", "ü", "ý",
  "þ", "ÿ", "Ā", "ā", "Ă", "ă", "Ą", "ą", "Ć", "ć",
  "Ĉ", "ĉ", "Ċ", "ċ", "Č", "č", "Ď", "ď", "Đ", "đ",
  "Ē", "ē", "Ĕ", "ĕ", "Ė", "ė", "Ę", "ę", "Ě", "ě",
  "Ĝ", "ĝ", "Ğ", "ğ", "Ġ", "ġ", "Ģ", "ģ", "Ĥ", "ĥ",
] as const

/**
 * Creates a new rebus symbol generator function.
 * Each call to the returned function will yield the next unique symbol.
 *
 * @returns A function that returns a new rebus symbol on each call
 *
 * @example
 * ```ts
 * const getSymbol = makeGetNewRebusSymbol()
 * const sym1 = getSymbol() // "❶"
 * const sym2 = getSymbol() // "❷"
 * const sym3 = getSymbol() // "❸"
 * ```
 */
export function makeGetNewRebusSymbol(): () => string {
  let counter = -1

  return () => {
    counter++
    const symbol = REBUS_SYMBOLS[counter]
    if (!symbol) {
      throw new Error("Ran out of automatic rebus symbols")
    }
    return symbol
  }
}

/**
 * Gets a rebus symbol by index (0-based).
 * Useful when you need to directly access a specific symbol without state.
 *
 * @param index The 0-based index of the symbol to retrieve
 * @returns The rebus symbol at the given index
 * @throws Error if index is out of bounds
 */
export function getRebusSymbolByIndex(index: number): string {
  if (index < 0 || index >= REBUS_SYMBOLS.length) {
    throw new Error(`Rebus symbol index ${index} out of bounds (max ${REBUS_SYMBOLS.length - 1})`)
  }
  return REBUS_SYMBOLS[index]
}
