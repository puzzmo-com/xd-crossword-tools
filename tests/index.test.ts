// Careful of this resolving to the .js version!
import { puzToXD, xdToJSON, uclickXMLToXd } from "../index"

import { toMatchFile } from "jest-file-snapshot"
import { readdirSync, readFileSync } from "fs"

expect.extend({ toMatchFile })

const puzs = ["alpha-bits", "112921 - speakerboxxx the love below"]
puzs.forEach((file) => {
  describe(file, () => {
    it("converts a random puz file", () => {
      const puz = readFileSync(`./tests/puz/${file}.puz`)
      const xd = puzToXD(puz)
      expect(xd).toMatchFile(`./tests/output/${file}.xd`)
    })

    it("generates json from the xd", () => {
      const puz = readFileSync(`./tests/output/${file}.xd`, "utf8")
      const json = xdToJSON(puz, false, true)
      expect(JSON.stringify(json, null, "  ")).toMatchFile(`./tests/output/${file}.json`)
    })
  })
})

const fails = readdirSync("./tests/fails")
describe("Failing tests", () => {
  fails.forEach((file) => {
    it(`creates the right fail for ${file}`, () => {
      const xd = readFileSync(`./tests/fails/${file}`, "utf8")
      const json = xdToJSON(xd)
      expect(JSON.stringify(json, null, 2)).toMatchFile(`./tests/output/fail_${file}.json`)
      expect(json.report.success).toBeFalsy()
    })
  })
})

// I do not have a legit XML doc I can legally add in here, so this can be re-used if we fine one
it.skip("generates json from the xml", () => {
  const puz = readFileSync(`./tests/uclickXML/example.xml`, "utf8")
  const xd = uclickXMLToXd(puz)
  expect(xd).toMatchFile(`./tests/output/example.xd`)
})
