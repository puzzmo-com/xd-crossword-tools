/** Inline xdown elements, the same shape as `XDownComponent` in xd-crossword-tools-parser */
export type XDownComponent =
  | [type: "text", text: string]
  | [type: "linebreak"]
  | [type: "img", url: string, alt: string, block: boolean, width?: string, height?: string]
  | [type: "italics", text: string, children: XDownComponent[]]
  | [type: "bold", text: string, children: XDownComponent[]]
  | [type: "strike", text: string, children: XDownComponent[]]
  | [type: "underscore", text: string, children: XDownComponent[]]
  | [type: "subscript", text: string, children: XDownComponent[]]
  | [type: "superscript", text: string, children: XDownComponent[]]
  | [type: "smallcaps", text: string, children: XDownComponent[]]
  | [type: "link", text: string, to: string, children: XDownComponent[]]
  | [type: "color", text: string, lightColor: string, darkColor: string, children: XDownComponent[]]
