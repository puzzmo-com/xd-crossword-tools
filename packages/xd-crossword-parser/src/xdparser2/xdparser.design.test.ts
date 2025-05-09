import { xdToJSON } from "../xdparser2"

it("Multiline works", () => {
  const xd = wrapStyle(`
<style>
O { background: circle }
</style>
`)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "background": "circle",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("Single line works", () => {
  const xd = wrapStyle(`
  <style>O { background: circle }</style>
  `)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "background": "circle",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("handles multiple rules", () => {
  const xd = wrapStyle(`
    <style>O { background: circle; foreground: hello }</style>
    `)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "background": "circle",
    "foreground": "hello",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("handles same line rules but different style", () => {
  const xd = wrapStyle(`
      <style>O { background: circle; foreground: hello }
      </style>
      `)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "background": "circle",
    "foreground": "hello",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("handles same line rules but different style", () => {
  const xd = wrapStyle(`
        <style>O { background: circle; foreground: hello }
        V { background: circle; foreground: hello }
        </style>
        `)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "background": "circle",
    "foreground": "hello",
  },
  "V": {
    "background": "circle",
    "foreground": "hello",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("handles dashes fine", () => {
  const xd = wrapStyle(`
          <style>O { border-right: circle; border-left: dot; }</style>
          `)

  const { design } = xdToJSON(xd, false)
  expect(design?.styles).toMatchInlineSnapshot(`
{
  "O": {
    "border-left": "dot",
    "border-right": "circle",
  },
}
`)
  expect(design?.positions.length).toBeGreaterThan(0)
})

it("throws when empty", () => {
  const xd = wrapStyle(``)

  expect(throwsWithError(xd)).toMatchInlineSnapshot(`undefined`)
})

it("throws you have a 2 char name", () => {
  const xd = wrapStyle(`
    <style>
OO { background: circle }
</style>
`)

  expect(throwsWithError(xd)).toMatchInlineSnapshot(`undefined`)
})

const wrapStyle = (style: string) => `
## Metadata
## Grid
## Design

${style}

....###...#....
....##....#....
....#.....#....
............###
...#....##....#
......#....O...
##...#....#O...
..O....#...O...
..O.#....#.O.##
..O.....#..O...
#.OO.##....#O..
###O........O..
...O#.....#.O..
...O#....##.O..
...O#...###.O..
`

const throwsWithError = (xd: string, strict = true) => {
  try {
    xdToJSON(xd, strict)
  } catch (error) {
    return JSON.parse(JSON.stringify(error))
  }
  expect("This should have failed")
}
