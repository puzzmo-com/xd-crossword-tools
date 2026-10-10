/** The grid character for an unfilled cell, which is also how one is written in an answer */
export const UNFILLED_CELL = "?"

/** How a letter tile is spelled in an answer, '?' for an unfilled cell */
export const spellLetterTile = (tile: { letter: string; unfilled?: true }) => (tile.unfilled ? UNFILLED_CELL : tile.letter)
