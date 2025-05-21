// e.g. https://picayune.uclick.com/comics/usaon/data/usaon190124-data.xml
// Which does not actually work, this code would need to be changed to better
// handle formatting
//
import parse from "xml-parser"

export const uclickXMLToXD = (str: string) => {
  const parsed = parse(str)
  const crossword = parsed.root.children.find((child: { name: string }) => child.name === "crossword")
  if (!crossword) throw new Error("Could not find crossword element in XML")

  let width = -1
  let metaRaw: Record<string, string> = {}
  let answer = ""
  const downs: string[] = []
  const acrosses: string[] = []

  // Process all elements
  crossword.children.forEach((element: any) => {
    if (element.name === "Width") {
      width = Number(element.attributes.v)
    } else if (element.name === "AllAnswer") {
      answer = element.attributes.v.replace(/-/g, ".")
    } else if (element.name === "across") {
      element.children.forEach((clue: any) => {
        if (clue.name.startsWith("a")) {
          const i = clue.name.slice(1)
          const answer = clue.attributes.a
          const c = decodeURIComponent(clue.attributes.c)
          acrosses.push(`${i}. ${c} ~ ${answer}`)
        }
      })
    } else if (element.name === "down") {
      element.children.forEach((clue: any) => {
        if (clue.name.startsWith("d")) {
          const i = clue.name.slice(1)
          const answer = clue.attributes.a
          const c = decodeURIComponent(clue.attributes.c)
          downs.push(`${i}. ${c} ~ ${answer}`)
        }
      })
    } else {
      // Handle metadata
      metaRaw[element.name] = element.attributes.v
    }
  })

  const cap = (word: string) => word[0].toUpperCase() + word.slice(1)
  const board = splitToNewLines(answer, width)
  const meta = Object.keys(metaRaw).map((key) => `${cap(key)}: ${(metaRaw[key] || "N/A").trim()}`)

  return `${meta.join("\n")}


${board}


${acrosses.join("\n")}

${downs.join("\n")}
`
}

function splitToNewLines(str: string, width: number) {
  var result = ""
  while (str.length > 0) {
    result += str.substring(0, width) + "\n"
    str = str.substring(width)
  }
  return result
}
