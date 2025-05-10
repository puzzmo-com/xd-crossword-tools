// e.g. https://picayune.uclick.com/comics/usaon/data/usaon190124-data.xml
// Which does not actually work, this code would need to be changed to better
// handle formatting
//
enum State {
  Meta,
  Across,
  Down,
}

export const uclickXMLToXd = (str: string) => {
  const lines = str.split("\n")
  let width = -1
  let metaRaw: Record<string, string> = {}
  let state = State.Meta
  let answer = ""
  const downs: string[] = []
  const acrosses: string[] = []

  lines.forEach((l) => {
    const line = l.trim()
    const ignore = ["<crossword"]
    for (const toIgnore of ignore) {
      if (line.startsWith(toIgnore)) {
        return
      }
    }
    if (line.startsWith("<across")) {
      state = State.Across
    } else if (line.startsWith("<down")) {
      state = State.Down
    } else if (line.startsWith("<Width")) {
      width = Number(line.split('<Width v="')[1].slice(0, -4))
    } else if (line.startsWith("<AllAnswer")) {
      answer = line.split('<AllAnswer v="')[1].slice(0, -4).replace(/-/g, ".")
    } else if (state === State.Meta) {
      const keyName = line.split(" ")[0].slice(1)
      const value = line.split('v="')[1].slice(0, -4)
      metaRaw[keyName] = value
    } else if (state === State.Across && line.startsWith("<a") && !line.includes("<across")) {
      const i = line.split(" ")[0].slice(1)
      const answer = line.split('a="')[1].split('" ')[0]
      const c = decodeURIComponent(line.split('c="')[1].split('" ')[0])
      acrosses.push(`${i}. ${c} ~ ${answer}`)
    } else if (state === State.Down && line.startsWith("<d") && !line.includes("<down")) {
      const i = line.split(" ")[0].slice(1)
      const answer = line.split('a="')[1].split('" ')[0]
      const c = decodeURIComponent(line.split('c="')[1].split('" ')[0])
      downs.push(`${i}. ${c} ~ ${answer}`)
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
