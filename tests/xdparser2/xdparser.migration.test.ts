import { readFileSync } from "fs"
import { implicitOrderedXDToExplicitHeaders, shouldConvertToExplicitHeaders } from "../../lib/xdparser2.compat"

import { toMatchFile } from "jest-file-snapshot"
expect.extend({ toMatchFile })

it("converts a v1 implicit xd to explicit under the hood", () => {
  const xd = readFileSync("tests/xdparser2/inputs/alpha-bits.xd", "utf8")
  const explicit = implicitOrderedXDToExplicitHeaders(xd)
  expect(explicit).toMatchFile("tests/xdparser2/outputs/explicit-alpha-bits.xd")
})

it("correctly knows whether to do the transition", () => {
  const xd = readFileSync("tests/xdparser2/inputs/alpha-bits.xd", "utf8")
  const explicitXD = readFileSync("tests/xdparser2/outputs/explicit-alpha-bits.xd", "utf8")

  expect(shouldConvertToExplicitHeaders(xd)).toBeTruthy()
  expect(shouldConvertToExplicitHeaders(explicitXD)).toBeFalsy()
})
