// Careful of this resolving to the .js version!
import { puzToXD, xdToJSON, uclickXMLToXd } from "../index"

import { toMatchFile } from "jest-file-snapshot"
import { readFileSync } from "fs"

expect.extend({ toMatchFile })
;["alpha-bits", "112921 - speakerboxxx the love below"].forEach((file) => {
  describe(file, () => {
    it("converts a random puz file", () => {
      const puz = readFileSync(`./tests/puz/${file}.puz`)
      const xd = puzToXD(puz)
      expect(xd).toMatchFile(`./tests/output/${file}.xd`)
    })

    it("generates json from the xd", () => {
      const puz = readFileSync(`./tests/output/${file}.xd`, "utf8")
      const json = xdToJSON(puz)
      expect(JSON.stringify(json, null, "  ")).toMatchFile(`./tests/output/${file}.json`)
    })
  })
})

// I do not have a legit XML doc I can legally add in here, so this can be re-used if we fine one
it.skip("generates json from the xml", () => {
  const puz = readFileSync(`./tests/uclickXML/example.xml`, "utf8")
  const xd = uclickXMLToXd(puz)
  expect(xd).toMatchFile(`./tests/output/example.xd`)
})
