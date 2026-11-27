import { describe, it, expect } from "vitest"
import { parseXDown, serializeXDown } from "./xdown"
import type { XDownComponent } from "./types"

/** Helper: wrap plain text content as children for non-nested markup */
const t = (s: string): XDownComponent[] => [["text", s]]

// These moved from xd-crossword-tools-parser when it stopped reading pre-v4 xdown
describe("reading pre-v4 xdown", () => {
  it("still reads positional links, images and colors with a deprecation", () => {
    const deprecations: string[] = []
    const onDeprecated = (msg: string) => deprecations.push(msg)

    expect(parseXDown("{@see here|https://mylink.com@}", { onDeprecated })).toEqual([["link", "see here", "https://mylink.com", t("see here")]])
    expect(parseXDown("{!![https://img.png|alt|300|400]!}", { onDeprecated })).toEqual([["img", "https://img.png", "alt", true, "300", "400"]])
    expect(parseXDown("{![https://img.png]!}", { onDeprecated })).toEqual([["img", "https://img.png", "", false]])
    expect(parseXDown("{#red|#f00|#c00#}", { onDeprecated })).toEqual([["color", "red", "#f00", "#c00", t("red")]])

    expect(deprecations).toHaveLength(4)
    expect(deprecations[0]).toContain("{@text | href: url@}")
  })

  it("reads images whose positional parts have no square brackets, which is how they were documented", () => {
    const deprecations: string[] = []
    const onDeprecated = (msg: string) => deprecations.push(msg)
    const url = "https://cdn.puzzmo.com/game-assets/california-bear.svg"

    expect(parseXDown(`{!${url}!}`, { onDeprecated })).toEqual([["img", url, "", false]])
    expect(parseXDown(`{!${url}|a bear!}`, { onDeprecated })).toEqual([["img", url, "a bear", false]])
    expect(parseXDown(`{!${url}|a bear|30|40!}`, { onDeprecated })).toEqual([["img", url, "a bear", false, "30", "40"]])
    expect(parseXDown(`{!!${url}|a bear!}`, { onDeprecated })).toEqual([["img", url, "a bear", true]])

    expect(deprecations).toHaveLength(4)
    expect(deprecations[0]).toContain("{!alt text | src: url!}")
  })

  it("converts an image without square brackets to v4", () => {
    const v4 = (str: string) => serializeXDown(parseXDown(str, { legacy: true }))
    expect(v4("{!https://example.com/image.png|alt text|300!}")).toBe("{!alt text | src: https://example.com/image.png; width: 300!}")
    expect(v4("{!!https://example.com/image.png!}")).toBe("{! | src: https://example.com/image.png; display: block!}")
  })

  it("does not deprecate v4 syntax", () => {
    const deprecations: string[] = []
    parseXDown("{@a | href: https://a.com@} {!b | src: https://b.png!} {#c | light: #fff; dark: #000#} {/d/}", {
      onDeprecated: (msg) => deprecations.push(msg),
    })
    expect(deprecations).toEqual([])
  })

  it("can parse with the pre-v4 rules, where literals and new type characters are text", () => {
    expect(parseXDown("{\\~\\} {$5$}", { legacy: true })).toEqual([["text", "{\\~\\} {$5$}"]])
  })

  it("converts to v4 by parsing legacy and serializing", () => {
    const v4 = (str: string) => serializeXDown(parseXDown(str, { legacy: true }))
    expect(v4("I think {@you should read|https://github.com@} more")).toBe("I think {@you should read | href: https://github.com@} more")
    expect(v4("{!![https://example.com/image.png|alt text|300|400]!}")).toBe(
      "{!alt text | src: https://example.com/image.png; width: 300; height: 400; display: block!}",
    )
    expect(v4("{#{*bold*} text|#fff|#000#}")).toBe("{#{*bold*} text | light: #fff; dark: #000#}")
    expect(v4("A {\\path\\} costs {$5$}")).toBe("A {\\{\\}\\path\\} costs {\\{\\}$5$}")
  })
})
