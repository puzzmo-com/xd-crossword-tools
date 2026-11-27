import type { XDownComponent } from "../types"
import { parseDeclarations, serializeDeclarations } from "./declarations"

/**
 * xdown is the inline markup used in clue bodies and metadata values in xd v4:
 * https://github.com/century-arcade/xdformat/blob/master/doc/xd-format-v4.md#xdown-formatting
 *
 * A span is `{` + a type character + content + the same type character + `}`. Every ASCII
 * punctuation character is reserved as a type character, a `{` followed by anything else is text.
 */

const ASCII_PUNCTUATION = new Set("!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~")

export interface XDownParseOptions {
  /**
   * Called for pre-v4 syntax, like positional links (`{@text|url@}`), which is read by the v4 rules and so
   * probably doesn't mean what it used to. xd-crossword-migrator can convert it.
   */
  onDeprecated?: (message: string) => void
}

interface Ctx {
  onDeprecated?: (message: string) => void
}

/** Parses xdown into a list of components which can be used for rendering */
export function parseXDown(input: string, options: XDownParseOptions = {}): XDownComponent[] {
  if (!input) return [["text", ""]]
  if (!input.includes("{")) return [["text", input]]
  return parseContent(input, { onDeprecated: options.onDeprecated })
}

const opensSpan = (input: string, i: number, ctx: Ctx) =>
  input[i] === "{" && i + 1 < input.length && ASCII_PUNCTUATION.has(input[i + 1])

/** Reads the span which opens at `i`, returning undefined if it is never closed (and so is text) */
function readSpan(input: string, i: number, ctx: Ctx): { typeChar: string; content: string; end: number } | undefined {
  if (!opensSpan(input, i, ctx)) return undefined
  const typeChar = input[i + 1]

  // Literals end at the first `\}` and nothing inside them is interpreted
  if (typeChar === "\\") {
    const close = input.indexOf("\\}", i + 2)
    if (close === -1) return undefined
    return { typeChar, content: input.slice(i + 2, close), end: close + 2 }
  }

  let j = i + 2
  while (j < input.length) {
    if (opensSpan(input, j, ctx)) {
      const inner = readSpan(input, j, ctx)
      j = inner ? inner.end : j + 1
      continue
    }
    if (input[j] === typeChar && input[j + 1] === "}") {
      return { typeChar, content: input.slice(i + 2, j), end: j + 2 }
    }
    j++
  }
  return undefined
}

function parseContent(input: string, ctx: Ctx): XDownComponent[] {
  const components: XDownComponent[] = []
  let text = ""

  let i = 0
  while (i < input.length) {
    const span = readSpan(input, i, ctx)
    if (!span) {
      text += input[i]
      i++
      continue
    }

    const node = buildNode(span.typeChar, span.content, ctx)
    if (node[0] === "text") {
      // Literals and unknown spans are text, so merge them with their neighbours
      text += node[1]
    } else {
      if (text) components.push(["text", text])
      text = ""
      components.push(node)
    }
    i = span.end
  }

  if (text || components.length === 0) components.push(["text", text])
  return components
}

const styleTypes: Record<string, "italics" | "bold" | "underscore" | "strike" | "subscript" | "superscript" | "smallcaps"> = {
  "/": "italics",
  "*": "bold",
  _: "underscore",
  "-": "strike",
  "~": "subscript",
  "^": "superscript",
  "=": "smallcaps",
}

function buildNode(typeChar: string, content: string, ctx: Ctx): XDownComponent {
  const style = styleTypes[typeChar]
  if (style) return [style, content, parseContent(content, ctx)]

  switch (typeChar) {
    case "\\":
      // An empty literal is a line break
      return content === "" ? ["linebreak"] : ["text", content]

    case "@": {
      const { text, attributes } = splitAttributes(content, ctx)
      // Pre-v4 links were positional, `{@text|url@}`, which v4 reads as a link without an href
      if (isLegacyAttributes(attributes, ["href"])) deprecated(ctx, `{@${content}@}`, `{@text | href: url@}`)
      const attrs = readAttributes(attributes)
      return ["link", text, attrs.href || "", parseContent(text, ctx)]
    }

    case "!": {
      // Pre-v4 images were positional - {!url|alt|width|height!} inline, {!!url|alt!} block - and the parts
      // could be wrapped in square brackets: {![url|alt]!}. v4 reads those as an image without a src
      const bracketed = /^!?\[[\s\S]*\]$/.test(content)
      const { text, attributes } = splitAttributes(content, ctx)
      const attrs = readAttributes(attributes)
      if (bracketed || !imgAttributes.some((key) => key in attrs)) deprecated(ctx, `{!${content}!}`, `{!alt text | src: url!}`)

      const img: XDownComponent = ["img", attrs.src || "", text, attrs.display === "block"]
      if (attrs.width || attrs.height) img.push(attrs.width || "")
      if (attrs.height) img.push(attrs.height)
      return img
    }

    case "#": {
      // Colors are a Puzzmo extension which is still under discussion for the spec
      const { text, attributes } = splitAttributes(content, ctx)
      if (!attributes.trim()) return ["text", `{#${content}#}`]

      // Pre-v4 colors were positional, `{#text|light|dark#}`, which v4 reads as a color without any colors
      if (isLegacyAttributes(attributes, ["light", "dark"])) deprecated(ctx, `{#${content}#}`, `{#text | light: color; dark: color#}`)
      const attrs = readAttributes(attributes)
      return ["color", text, attrs.light || "", attrs.dark || "", parseContent(text, ctx)]
    }

    default:
      // Reserved for a future version of the spec, so show it as-is
      return ["text", `{${typeChar}${content}${typeChar}}`]
  }
}

/** Splits a span's content at the first `|` which is outside of a nested span */
function splitAttributes(content: string, ctx: Ctx) {
  let i = 0
  while (i < content.length) {
    const span = readSpan(content, i, ctx)
    if (span) {
      i = span.end
      continue
    }
    if (content[i] === "|") {
      // The spec examples put spaces around the pipe, and they're not part of the text
      const text = content.slice(0, i).trimEnd()
      return { text, attributes: content.slice(i + 1) }
    }
    i++
  }
  return { text: content, attributes: "" }
}

const readAttributes = (attributes: string) => Object.fromEntries(parseDeclarations(attributes).declarations) as Record<string, string>

/** The attributes v4 gives an image, a `{!...!}` span without any of them is probably pre-v4 and positional */
const imgAttributes = ["src", "width", "height", "display"]

/** Pre-v4 links and colors used positional parts, which won't have any of the v4 attribute names */
function isLegacyAttributes(attributes: string, knownKeys: string[]) {
  if (!attributes.trim()) return false
  const { declarations } = parseDeclarations(attributes)
  return !declarations.some(([key]) => knownKeys.includes(key))
}

const deprecated = (ctx: Ctx, found: string, replacement: string) =>
  ctx.onDeprecated?.(`'${found}' uses pre-v4 xdown syntax, xd v4 uses '${replacement}'. xd-crossword-migrator can convert this file.`)

/**
 * Flatten xdown components into a single string for consumers which cannot render markup.
 *
 * Styling (bold, italics, colour, etc) is dropped and only its inner text survives. Images become
 * their alt text in square brackets - `[a sleepy cat]`, or `[image]` when no alt text was given - and
 * links keep both halves in markdown form: `[you should read](https://github.com)`.
 */
export function xdownToPlainText(components: XDownComponent[]): string {
  return components
    .map((c) => {
      const type = c[0]
      switch (type) {
        case "text":
          return c[1]
        case "linebreak":
          return "\n"
        case "italics":
        case "bold":
        case "strike":
        case "underscore":
        case "subscript":
        case "superscript":
        case "smallcaps":
          return xdownToPlainText(c[2])
        case "link": {
          const text = xdownToPlainText(c[3])
          return c[2] ? `[${text}](${c[2]})` : text
        }
        case "img":
          return `[${c[2] || "image"}]`
        case "color":
          return xdownToPlainText(c[4])
        default:
          return unhandledXDownType(type)
      }
    })
    .join("")
}

/**
 * Called from the `default` branch of every switch over an xdown type. The `never` parameter means
 * adding a variant to XDownComponent without extending those switches is a compile error, rather
 * than a new markup type silently flattening to an empty string.
 */
function unhandledXDownType(type: never): string {
  return ""
}

const typeToChar: Record<string, string> = {
  italics: "/",
  bold: "*",
  strike: "-",
  underscore: "_",
  subscript: "~",
  superscript: "^",
  smallcaps: "=",
}

/** Serialize xdown components back to an xd v4 string */
export function serializeXDown(components: XDownComponent[]): string {
  return serialize(components)
}

function serialize(components: XDownComponent[], closeChar?: string, inAttributeSpan = false): string {
  return components
    .map((c) => {
      const type = c[0]
      switch (type) {
        case "text":
          return escapeText(c[1], closeChar, inAttributeSpan)
        case "linebreak":
          return "{\\\\}"
        case "italics":
        case "bold":
        case "strike":
        case "underscore":
        case "subscript":
        case "superscript":
        case "smallcaps": {
          const char = typeToChar[type]
          return `{${char}${serialize(c[2], char)}${char}}`
        }
        case "link": {
          const text = serialize(c[3], "@", true)
          return c[2] ? `{@${text} | ${serializeDeclarations([["href", c[2]]])}@}` : `{@${text}@}`
        }
        case "img": {
          const [, src, alt, block, width, height] = c
          const attrs: [string, string][] = [["src", src]]
          if (width) attrs.push(["width", width])
          if (height) attrs.push(["height", height])
          if (block) attrs.push(["display", "block"])
          return `{!${escapeText(alt, "!", true)} | ${serializeDeclarations(attrs)}!}`
        }
        case "color": {
          const text = serialize(c[4], "#", true)
          return `{#${text} | ${serializeDeclarations([
            ["light", c[2]],
            ["dark", c[3]],
          ])}#}`
        }
        default:
          return unhandledXDownType(type)
      }
    })
    .join("")
}

const literal = (str: string) => `{\\${str}\\}`

/** Wraps anything in plain text which would be read as markup in a literal */
function escapeText(text: string, closeChar: string | undefined, escapePipes: boolean) {
  let out = ""
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    // A `{` before punctuation opens a span, and at the end of the text it could meet whatever comes next
    if (ch === "{" && (next === undefined || ASCII_PUNCTUATION.has(next))) out += literal("{")
    // The closing delimiter of the span we're inside
    else if (closeChar && ch === closeChar && next === "}") {
      out += literal(ch + "}")
      i++
    }
    // The first top-level pipe in a link/image/color starts its attributes
    else if (escapePipes && ch === "|") out += literal("|")
    // ' ~ ' separates a clue body from its answers
    else if (ch === "~" && text[i - 1] === " " && next === " ") out += literal("~")
    else out += ch
  }
  return out
}

/** @deprecated use parseXDown, clue markup is called xdown in xd v4 */
export const xdMarkupProcessor = (input: string) => parseXDown(input)
/** @deprecated use xdownToPlainText, clue markup is called xdown in xd v4 */
export const xdMarkupToPlainText = xdownToPlainText
/** @deprecated use serializeXDown, clue markup is called xdown in xd v4 */
export const xdMarkupSerializer = serializeXDown
