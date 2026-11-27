// Careful of this resolving to the .js version!
import { puzToXD } from "../src/puzToXD"

import { xdToJSON } from "xd-crossword-tools-parser"

import { readdirSync, readFileSync } from "fs"
import { describe, it, expect } from "vitest"

const puzs = ["alpha-bits", "112921 - speakerboxxx the love below"]
puzs.forEach((file) => {
  describe(file, () => {
    it("converts a random puz file", async () => {
      const puz = readFileSync(`${__dirname}/puz/${file}.puz`)
      const xd = puzToXD(puz as any)
      await expect(xd).toMatchFileSnapshot(`${__dirname}/output/${file}.xd`)
    })

    it("generates json from the xd", async () => {
      // The xd which the test above writes
      const puz = readFileSync(`${__dirname}/output/${file}.xd`, "utf8")
      const json = xdToJSON(puz, false, true)
      await expect(JSON.stringify(json, null, "  ")).toMatchFileSnapshot(`${__dirname}/output/${file}.json`)
    })
  })
})

const fails = readdirSync(`${__dirname}/fails`)
describe("Failing tests", () => {
  fails.forEach((file) => {
    it(`creates the right fail for ${file}`, async () => {
      const xd = readFileSync(`${__dirname}/fails/${file}`, "utf8")
      const json = xdToJSON(xd as any)
      await expect(JSON.stringify(json, null, 2)).toMatchFileSnapshot(`${__dirname}/output/fail_${file}.json`)
      expect(json.report.success).toBeFalsy()
    })
  })
})
