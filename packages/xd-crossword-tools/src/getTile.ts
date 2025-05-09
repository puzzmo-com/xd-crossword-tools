import { CrosswordJSON, Position } from "xd-crossword-parser"

export const getTile = (tiles: CrosswordJSON["tiles"], position: Position) => tiles[position.index] && tiles[position.index][position.col]
