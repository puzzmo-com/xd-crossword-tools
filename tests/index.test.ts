// Careful of this resolving to the .js version!
import { puzToXD, xdToJSON } from "../index";

import { toMatchFile } from 'jest-file-snapshot';
import { readFileSync } from "fs";
 
expect.extend({ toMatchFile });

it("converts a random puz file", () => {
    const input = "alpha-bits"
    const puz = readFileSync(`./tests/puz/${input}.puz`)
    const xd = puzToXD(puz)
    expect(xd).toMatchFile(`./tests/puz/${input}.xd`)
})

it("generates json from the xd", () => {
    const input = "alpha-bits"
    const puz = readFileSync(`./tests/puz/${input}.xd`, "utf8")
    const json = xdToJSON(puz)
    expect(JSON.stringify(json, null, "  ")).toMatchFile(`./tests/puz/${input}.json`)
})