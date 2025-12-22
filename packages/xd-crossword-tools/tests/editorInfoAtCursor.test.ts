import { readFileSync } from "fs"
import { CrosswordJSON } from "xd-crossword-tools-parser"
import { puzToXD } from "../src/puzToXD"
import { editorInfoAtCursor } from "../src/editorInfoAtCursor"
import { JSONToXD } from "../src/JSONtoXD"
import { xdToJSON } from "xd-crossword-tools-parser"
import { describe, it, expect, beforeAll } from "vitest"

describe(editorInfoAtCursor.name, () => {
  let xd: string
  let json: CrosswordJSON

  beforeAll(() => {
    const puz = readFileSync(`./packages/xd-crossword-tools/tests/puz/alpha-bits.puz`)
    xd = puzToXD(puz)
    json = xdToJSON(xd, true, true)

    // Adds a set of 2nd clues to the JSON
    for (const c of [...json.clues.across, ...json.clues.down]) {
      c.metadata = { hint: "Second clue" + c.number }
    }

    json.clues.across[2].metadata!.refs = "D2"

    xd = JSONToXD(json)
    json = xdToJSON(xd, true, true)
  })

  it("should give the right clue", () => {
    const xdLines = xd.split("\n")
    const lines = [] as string[]
    const info = editorInfoAtCursor(json)

    for (let i = 0; i < xdLines.length; i++) {
      const line = xdLines[i]
      const res = info(i, 0)

      let prefix = "      "
      switch (res.type) {
        case "clue":
          prefix = `CL ${res.direction.slice(0, 1).toUpperCase()}${res.number}`
          if (res.lineMeta) {
            prefix += ` [${res.lineMeta.type}]`
          }
          break
        case "grid":
          prefix = `G ${res.position.col}:${res.position.index}`
          break
      }
      lines.push(`${prefix} | ${line}`)
    }

    expect(json.editorInfo?.sections).toMatchInlineSnapshot(`
[
  {
    "endLine": 8,
    "startLine": 0,
    "type": "metadata",
  },
  {
    "endLine": 26,
    "startLine": 9,
    "type": "grid",
  },
  {
    "endLine": 295,
    "startLine": 27,
    "type": "clues",
  },
  {
    "endLine": 318,
    "startLine": 296,
    "type": "design",
  },
]
`)

    expect("\n" + lines.join("\n")).toMatchInlineSnapshot(`
      "
             | ## Metadata
             | 
             | title: Alpha-Bits
             | author: Drew Hodson
             | date: Not set
             | editor: Not set
             | copyright: © 2021
             | description: N/A
             | 
             | ## Grid
             | 
      G 0:0 | AHAB..CUD.SERIF
      G 0:1 | MADAM.ANY.ABODE
      G 0:2 | PLANE.DIE.NOTON
      G 0:3 | ....TODO.EGO...
      G 0:4 | GASH.NINJA.KEEL
      G 0:5 | ARTICLE.ORU.DOE
      G 0:6 | YEARLY.MISPRINT
      G 0:7 | ..NEI.MAN.SOT..
      G 0:8 | CALENDAR.RETIES
      G 0:9 | ICE.TAR.POTHOLE
      G 0:10 | OTEP.HQTRS.SNIT
      G 0:11 | ...ALL.HEAL....
      G 0:12 | SPIRO.NET.ATLAS
      G 0:13 | TARTS.ETA.DOONE
      G 0:14 | UWAVE.WAX..YUTZ
      G 0:15 | 
             | ## Clues
             | 
      CL A1 | A1. Captain of the Pequod ~ AHAB
      CL A1 [hint] | A1 ^hint: Second clue1
             | 
      CL A5 | A5. Food for second chance chewing ~ CUD
      CL A5 [hint] | A5 ^hint: Second clue5
             | 
      CL A8 | A8. Font feature ~ SERIF
      CL A8 [hint] | A8 ^hint: Second clue8
      CL A8 [refs] | A8 ^refs: D2
             | 
      CL A13 | A13. Palindromic address to a female ~ MADAM
      CL A13 [hint] | A13 ^hint: Second clue13
             | 
      CL A15 | A15. ___ Way You Want It ~ ANY
      CL A15 [hint] | A15 ^hint: Second clue15
             | 
      CL A16 | A16. Place often described as humble ~ ABODE
      CL A16 [hint] | A16 ^hint: Second clue16
             | 
      CL A17 | A17. Flat two dimensional surface in geometry ~ PLANE
      CL A17 [hint] | A17 ^hint: Second clue17
             | 
      CL A18 | A18. Grim homophone of 7D ~ DIE
      CL A18 [hint] | A18 ^hint: Second clue18
             | 
      CL A19 | A19. Off ~ NOTON
      CL A19 [hint] | A19 ^hint: Second clue19
             | 
      CL A20 | A20. Heading for some lists ~ TODO
      CL A20 [hint] | A20 ^hint: Second clue20
             | 
      CL A22 | A22. Kanye West is famous for his ~ EGO
      CL A22 [hint] | A22 ^hint: Second clue22
             | 
      CL A23 | A23. Laceration ~ GASH
      CL A23 [hint] | A23 ^hint: Second clue23
             | 
      CL A27 | A27. Alias of Twitch star Richard Tyler Blevins ~ NINJA
      CL A27 [hint] | A27 ^hint: Second clue27
             | 
      CL A29 | A29. Capsize ~ KEEL
      CL A29 [hint] | A29 ^hint: Second clue29
             | 
      CL A33 | A33. Piece of clothing or print ~ ARTICLE
      CL A33 [hint] | A33 ^hint: Second clue33
             | 
      CL A35 | A35. Evangelical school in Tulsa, OK ~ ORU
      CL A35 [hint] | A35 ^hint: Second clue35
             | 
      CL A37 | A37. ___-eyed ~ DOE
      CL A37 [hint] | A37 ^hint: Second clue37
             | 
      CL A38 | A38. Annual ~ YEARLY
      CL A38 [hint] | A38 ^hint: Second clue38
             | 
      CL A39 | A39. The stamp with the upside down airplane is a famous one ~ MISPRINT
      CL A39 [hint] | A39 ^hint: Second clue39
             | 
      CL A41 | A41. With 42A and Marcus, a luxury department store chain ~ NEI
      CL A41 [hint] | A41 ^hint: Second clue41
             | 
      CL A42 | A42. 41A continued ~ MAN
      CL A42 [hint] | A42 ^hint: Second clue42
             | 
      CL A43 | A43. Lush ~ SOT
      CL A43 [hint] | A43 ^hint: Second clue43
             | 
      CL A44 | A44. The Mayan one ended in 2012 ~ CALENDAR
      CL A44 [hint] | A44 ^hint: Second clue44
             | 
      CL A47 | A47. What a child often does to their shoes ~ RETIES
      CL A47 [hint] | A47 ^hint: Second clue47
             | 
      CL A50 | A50. Vanilla ___ ~ ICE
      CL A50 [hint] | A50 ^hint: Second clue50
             | 
      CL A51 | A51. Maligned cigarette ingredient ~ TAR
      CL A51 [hint] | A51 ^hint: Second clue51
             | 
      CL A52 | A52. Frequent cause for a new tire ~ POTHOLE
      CL A52 [hint] | A52 ^hint: Second clue52
             | 
      CL A53 | A53. Los Angeles heavy metal act ~ OTEP
      CL A53 [hint] | A53 ^hint: Second clue53
             | 
      CL A55 | A55. Bldgs. such as the Googleplex ~ HQTRS
      CL A55 [hint] | A55 ^hint: Second clue55
             | 
      CL A57 | A57. A fit of irritation ~ SNIT
      CL A57 [hint] | A57 ^hint: Second clue57
             | 
      CL A58 | A58. Lead-in to American or day ~ ALL
      CL A58 [hint] | A58 ^hint: Second clue58
             | 
      CL A60 | A60. What Pokémon do at a Pokémon Center ~ HEAL
      CL A60 [hint] | A60 ^hint: Second clue60
             | 
      CL A62 | A62. Nixon's vice ~ SPIRO
      CL A62 [hint] | A62 ^hint: Second clue62
             | 
      CL A65 | A65. Nothing but ___ ~ NET
      CL A65 [hint] | A65 ^hint: Second clue65
             | 
      CL A66 | A66. One with the world on his shoulders ~ ATLAS
      CL A66 [hint] | A66 ^hint: Second clue66
             | 
      CL A71 | A71. Filled pastries ~ TARTS
      CL A71 [hint] | A71 ^hint: Second clue71
             | 
      CL A72 | A72. Age, in Milan ~ ETA
      CL A72 [hint] | A72 ^hint: Second clue72
             | 
      CL A73 | A73. Lorna ___, novel or cookie ~ DOONE
      CL A73 [hint] | A73 ^hint: Second clue73
             | 
      CL A74 | A74. Electrocardiogram readout feature ~ UWAVE
      CL A74 [hint] | A74 ^hint: Second clue74
             | 
      CL A75 | A75. Hip slang for records ~ WAX
      CL A75 [hint] | A75 ^hint: Second clue75
             | 
      CL A76 | A76. Yiddish for a foolish person ~ YUTZ
      CL A76 [hint] | A76 ^hint: Second clue76
             | 
             | 
      CL D1 | D1. Pc. of concert gear ~ AMP
      CL D1 [hint] | D1 ^hint: Second clue1
             | 
      CL D2 | D2. AI antagonist of 2001 ~ HAL
      CL D2 [hint] | D2 ^hint: Second clue2
             | 
      CL D3 | D3. Programming pioneer Lovelace ~ ADA
      CL D3 [hint] | D3 ^hint: Second clue3
             | 
      CL D4 | D4. Prohibit ~ BAN
      CL D4 [hint] | D4 ^hint: Second clue4
             | 
      CL D5 | D5. Type of person to routinely carry a club ~ CADDIE
      CL D5 [hint] | D5 ^hint: Second clue5
             | 
      CL D6 | D6. State of the ___ Address ~ UNION
      CL D6 [hint] | D6 ^hint: Second clue6
             | 
      CL D7 | D7. Colorful homophone of 18A ~ DYE
      CL D7 [hint] | D7 ^hint: Second clue7
             | 
      CL D8 | D8. Snitched ~ SANG
      CL D8 [hint] | D8 ^hint: Second clue8
             | 
      CL D9 | D9. Kindle fare ~ EBOOK
      CL D9 [hint] | D9 ^hint: Second clue9
             | 
      CL D10 | D10. Decayed matter ~ ROT
      CL D10 [hint] | D10 ^hint: Second clue10
             | 
      CL D11 | D11. Type of response you hope to get at the altar ~ IDO
      CL D11 [hint] | D11 ^hint: Second clue11
             | 
      CL D12 | D12. Peat-accumulating wetland ~ FEN
      CL D12 [hint] | D12 ^hint: Second clue12
             | 
      CL D14 | D14. The ___, NY art museum ~ MET
      CL D14 [hint] | D14 ^hint: Second clue14
             | 
      CL D21 | D21. ___Fans ~ ONLY
      CL D21 [hint] | D21 ^hint: Second clue21
             | 
      CL D22 | D22. Friends, Romans, countrymen, lend me your... ~ EARS
      CL D22 [hint] | D22 ^hint: Second clue22
             | 
      CL D23 | D23. "Friend of Dorothy" ~ GAY
      CL D23 [hint] | D23 ^hint: Second clue23
             | 
      CL D24 | D24. We ___ the Champions ~ ARE
      CL D24 [hint] | D24 ^hint: Second clue24
             | 
      CL D25 | D25. Father of Spider-Man ~ STANLEE
      CL D25 [hint] | D25 ^hint: Second clue25
             | 
      CL D26 | D26. What a certain applicant becomes ~ HIREE
      CL D26 [hint] | D26 ^hint: Second clue26
             | 
      CL D28 | D28. Connect ~ JOIN
      CL D28 [hint] | D28 ^hint: Second clue28
             | 
      CL D30 | D30. Particular form of a published text ~ EDITION
      CL D30 [hint] | D30 ^hint: Second clue30
             | 
      CL D31 | D31. Suffix at the end of all of Eevee's evolutions ~ EON
      CL D31 [hint] | D31 ^hint: Second clue31
             | 
      CL D32 | D32. Live and ___ Die ~ LET
      CL D32 [hint] | D32 ^hint: Second clue32
             | 
      CL D34 | D34. Famous Eastwood whose name became a famous Gorillaz song ~ CLINT
      CL D34 [hint] | D34 ^hint: Second clue34
             | 
      CL D36 | D36. Unexpected result in a sporting competition ~ UPSET
      CL D36 [hint] | D36 ^hint: Second clue36
             | 
      CL D39 | D39. Disfigure ~ MAR
      CL D39 [hint] | D39 ^hint: Second clue39
             | 
      CL D40 | D40. David Lee and Tim ~ ROTHS
      CL D40 [hint] | D40 ^hint: Second clue40
             | 
      CL D42 | D42. Luxury watch collection by Garmin ~ MARQ
      CL D42 [hint] | D42 ^hint: Second clue42
             | 
      CL D44 | D44. Top dog in an IT org ~ CIO
      CL D44 [hint] | D44 ^hint: Second clue44
             | 
      CL D45 | D45. Sister ___ ~ ACT
      CL D45 [hint] | D45 ^hint: Second clue45
             | 
      CL D46 | D46. Author Roald ~ DAHL
      CL D46 [hint] | D46 ^hint: Second clue46
             | 
      CL D47 | D47. Civil rights activist Parks ~ ROSA
      CL D47 [hint] | D47 ^hint: Second clue47
             | 
      CL D48 | D48. An additional name that could be part of 40D's clue ~ ELI
      CL D48 [hint] | D48 ^hint: Second clue48
             | 
      CL D49 | D49. Director's domain ~ SET
      CL D49 [hint] | D49 ^hint: Second clue49
             | 
      CL D52 | D52. Type of income to go in a 401k ~ PRETAX
      CL D52 [hint] | D52 ^hint: Second clue52
             | 
      CL D54 | D54. The Empire Strikes Back, to the Star Wars saga ~ PARTV
      CL D54 [hint] | D54 ^hint: Second clue54
             | 
      CL D56 | D56. Greek letter following 72A ~ THETA
      CL D56 [hint] | D56 ^hint: Second clue56
             | 
      CL D59 | D59. Misplace ~ LOSE
      CL D59 [hint] | D59 ^hint: Second clue59
             | 
      CL D61 | D61. Wee boy ~ LAD
      CL D61 [hint] | D61 ^hint: Second clue61
             | 
      CL D62 | D62. Dad to Tommy Pickles ~ STU
      CL D62 [hint] | D62 ^hint: Second clue62
             | 
      CL D63 | D63. The only Patrol I trust ~ PAW
      CL D63 [hint] | D63 ^hint: Second clue63
             | 
      CL D64 | D64. Smart savings plan, briefly ~ IRA
      CL D64 [hint] | D64 ^hint: Second clue64
             | 
      CL D65 | D65. Fresh ~ NEW
      CL D65 [hint] | D65 ^hint: Second clue65
             | 
      CL D67 | D67. Breeds such as Chihuahua or Pomeranian ~ TOY
      CL D67 [hint] | D67 ^hint: Second clue67
             | 
      CL D68 | D68. Bega behind "Mambo No. 5" ~ LOU
      CL D68 [hint] | D68 ^hint: Second clue68
             | 
      CL D69 | D69. Aardvark breakfast ~ ANT
      CL D69 [hint] | D69 ^hint: Second clue69
             | 
      CL D70 | D70. Sonic ___ ~ SEZ
      CL D70 [hint] | D70 ^hint: Second clue70
             | 
             | 
             | ## Design
             | 
             | <style>
             | O { background: circle }
             | </style>
             | 
             | O..O##O.O#.O..O
             | .....#...#.....
             | .....#...#.....
             | ####....#...###
             | O..O#.O.O.#O..O
             | .......#...#...
             | ......#........
             | ##...#O.O#...##
             | ........#......
             | ...#...#.......
             | O..O#.O.O.#O..O
             | ###...#....####
             | .....#...#.....
             | .....#...#.....
             | O..O.#O.O##O..O
             | "
    `)
  })
})
