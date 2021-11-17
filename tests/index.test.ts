import { puzToXD } from "../index";
import { toMatchFile } from 'jest-file-snapshot';
import { readFileSync } from "fs";
 
expect.extend({ toMatchFile });

it("converts a random puz file", () => {
    const input = "wsj211117"
    
    const puz = readFileSync(`./tests/puz/${input}.puz`)
    const xd = puzToXD(puz)
    expect(xd).toMatchFile(`./tests/puz/${input}.xd`)
})