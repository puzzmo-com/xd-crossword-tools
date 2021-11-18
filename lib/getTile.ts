import { CrosswordJSON, Position } from "./types";

export const getTile = (tiles: CrosswordJSON["tiles"], position: Position) => tiles[position.index] && tiles[position.index][position.col]
