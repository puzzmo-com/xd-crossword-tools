import {decode} from "./vendor/puzjs"
import { CrosswordJSON, CursorDirection, Tile } from "./types";

import { getWordTilesForCursor } from "./getWordTilesForCursor";
import { getCluePositionsForBoard } from "./clueNumbersFromBoard";
import { getTile } from "./getTile";

export function puzToXD(buffer: any) {
  const cap = (word: string) => word[0].toUpperCase() + word.substr(1);

  const file = decode(buffer);
  const meta = Object.keys(file.meta).map((key) => `${cap(key)}: ${(file.meta[key] || "N/A").trim()}`);
  const board = file.grid.map((line) => line.join(""));

  // We need to re-create the clues section, which isn't fully fleshed
  // out in a puz file, and the game makes expectations that all data
  // is set up
  const tileGrid = stringGridToTiles(file.grid);
  const boardClues = getCluePositionsForBoard(tileGrid);
  const getClues = (clues: Array<null | string>, direction: CursorDirection) =>
    clues
      .map((c, i) => {
        if (!c) return;

        const clueInfos = getWordTilesForCursor(tileGrid, {
          position: boardClues[i],
          direction,
        });
        if (clueInfos.length === 0) return;
        const prefix = direction === "across" ? "A" : "D";
        return `${prefix}${i}. ${c} ~ ${clueInfos.map((p) => (getTile(tileGrid, p) as any).letter).join("")}`;
      })
      .filter(Boolean)
      .join("\n");

  const across = getClues(file.clues.across, "across");
  const down = getClues(file.clues.down, "down");

  return `
${meta.join("\n")}


${board.join("\n")}


${across}

${down}
`;
}

export const stringGridToTiles = (strArr: string[][]): CrosswordJSON["tiles"] => {
  const tiles: CrosswordJSON["tiles"] = strArr.map((_) => []);

  strArr.forEach((row, rowI) => {
    row.forEach((char) => {
      tiles[rowI].push(letterToTile(char));
    });
  });

  return tiles;
};

export const letterToTile = (letter: string): Tile => {
  if (letter === "#") return { type: "blank" };
  // Puzz support
  if (letter === ".") return { type: "blank" };
  return { type: "letter", letter, state: "normal" };
};
