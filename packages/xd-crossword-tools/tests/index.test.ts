// Careful of this resolving to the .js version!
import { puzToXD } from "../src/puzToXD"
import { uclickXMLToXd } from "../src/uclickXMLToXd"

import { xdToJSON } from "xd-crossword-parser"

import { readdirSync, readFileSync } from "fs"
import { describe, it, expect } from "vitest"

const puzs = ["alpha-bits", "112921 - speakerboxxx the love below"]
puzs.forEach((file) => {
  describe(file, () => {
    it("converts a random puz file", async () => {
      const puz = readFileSync(`./packages/xd-crossword-tools/tests/puz/${file}.puz`)
      const xd = puzToXD(puz)
      await expect(xd).toMatchFileSnapshot(`./packages/xd-crossword-tools/tests/output/${file}.xd`)
    })

    it("generates json from the xd", async () => {
      const puz = readFileSync(`./packages/xd-crossword-tools/tests/output/${file}.xd`, "utf8")
      const json = xdToJSON(puz, false, true)
      await expect(JSON.stringify(json, null, "  ")).toMatchFileSnapshot(`./packages/xd-crossword-tools/tests/output/${file}.json`)
    })
  })
})

const fails = readdirSync("./packages/xd-crossword-tools/tests/fails")
describe("Failing tests", () => {
  fails.forEach((file) => {
    it(`creates the right fail for ${file}`, async () => {
      const xd = readFileSync(`./packages/xd-crossword-tools/tests/fails/${file}`, "utf8")
      const json = xdToJSON(xd)
      await expect(JSON.stringify(json, null, 2)).toMatchFileSnapshot(`./packages/xd-crossword-tools/tests/output/fail_${file}.json`)
      expect(json.report.success).toBeFalsy()
    })
  })
})

// I do not have a legit XML doc I can legally add in here, so this can be re-used if we fine one
it.skip("generates json from the xml", () => {
  const puz = readFileSync(`./packages/xd-crossword-tools/tests/uclickXML/example.xml`, "utf8")
  const xd = uclickXMLToXd(puz)
  expect(xd).toMatchFileSnapshot(`./packages/xd-crossword-tools/tests/output/example.xd`)
})
