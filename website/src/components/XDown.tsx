import React from "react"
import type { XDownComponent } from "xd-crossword-tools"

/** Renders parsed xdown (clue bodies and metadata values) as React elements */
export const XDown = ({ components }: { components: XDownComponent[] | undefined }) => {
  if (!components) return null
  return <>{components.map((c, i) => renderComponent(c, i))}</>
}

const renderComponent = (component: XDownComponent, key: number): React.ReactNode => {
  switch (component[0]) {
    case "text":
      return <React.Fragment key={key}>{component[1]}</React.Fragment>
    case "linebreak":
      return <br key={key} />
    case "italics":
      return <em key={key}><XDown components={component[2]} /></em>
    case "bold":
      return <strong key={key}><XDown components={component[2]} /></strong>
    case "strike":
      return <s key={key}><XDown components={component[2]} /></s>
    case "underscore":
      return <u key={key}><XDown components={component[2]} /></u>
    case "subscript":
      return <sub key={key}><XDown components={component[2]} /></sub>
    case "superscript":
      return <sup key={key}><XDown components={component[2]} /></sup>
    case "smallcaps":
      return (
        <span key={key} style={{ fontVariant: "small-caps" }}>
          <XDown components={component[2]} />
        </span>
      )
    case "link":
      return (
        <a key={key} href={component[2]} target="_blank" rel="noopener noreferrer">
          <XDown components={component[3]} />
        </a>
      )
    case "color":
      return (
        <span key={key} style={{ color: component[2] }}>
          <XDown components={component[4]} />
        </span>
      )
    case "img": {
      const [, src, alt, block, width, height] = component
      return (
        <img
          key={key}
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={{ display: block ? "block" : "inline", maxWidth: "100%", verticalAlign: "middle" }}
        />
      )
    }
    default: {
      // Keeps this switch exhaustive when new xdown span types are added
      const _exhaustive: never = component
      return null
    }
  }
}
