import React from "react"

const Open = () => <span style={{ color: "blue" }}>{"{"}</span>
const Close = () => <span style={{ color: "blue" }}>{"}"}</span>

const Nest = (props: { children: any }) => {
  return (
    <>
      <Open />
      <div style={{ marginLeft: 3, paddingLeft: 12, borderLeft: "grey 1px dashed" }}>{props.children}</div>
      <Close />
    </>
  )
}

export const ASTPreview = (props: { ast: any }) => {
  const RenderItem = (props: { item: any; depth: number }) => {
    const { item, depth } = props
    const fields = Object.keys(item).filter((key) => !["toWatch", "watchId"].includes(key))
    if (depth > 50) return <div>...</div>
    return (
      <div style={{ marginLeft: depth * 15 }} className="font-monospace">
        {fields.map((field) => {
          const v = item[field]

          if (Array.isArray(v)) {
            return (
              <div key={field}>
                <span>{field}: </span>
                <Nest>
                  {v.map((item: any, i) => {
                    return <RenderItem item={item} depth={depth + 1} key={i} />
                  })}
                </Nest>
              </div>
            )
          } else if (typeof v === "object" && v !== null) {
            return (
              <div key={field}>
                <span>{field}: </span>
                <Nest>
                  <RenderItem item={v} depth={depth + 1} />
                </Nest>
              </div>
            )
          }

          if (field === "type") {
            return (
              <div key={field} style={{ marginTop: 5 }}>
                <strong>{v}</strong>
              </div>
            )
          }

          const seen: any[] = []
          const vString = JSON.stringify(v, function (key, val) {
            if (val != null && typeof val == "object") {
              if (seen.indexOf(val) >= 0) return
              seen.push(val)
            }
            return val
          })

          return (
            <div key={field}>
              <span>{field}: </span>
              <span>{vString}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return <RenderItem item={props.ast} depth={0} />
}
