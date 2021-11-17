import { CrosswordProps, Position } from "./types";

export const getTile = (tiles: CrosswordProps["tiles"], position: Position) => tiles[position.index] && tiles[position.index][position.col]
