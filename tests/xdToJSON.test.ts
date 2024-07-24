// Careful of this resolving to the .js version!
import { puzToXD, xdToJSON } from "../index"

import { readFileSync } from "fs"
import { JSONToXD } from "../lib/JSONtoXD"

it("can handle going back to an xd file", () => {
  const puz = readFileSync(`./tests/puz/alpha-bits.puz`)
  const xd = puzToXD(puz)
  const json = xdToJSON(xd)
  const newXD = JSONToXD(json)
  expect(newXD).toMatchInlineSnapshot(`
"## Metadata

title: Alpha-Bits
author: Drew Hodson
date: Not set
editor: Not set
copyright: © 2021
description: N/A

## Grid

AHAB..CUD.SERIF
MADAM.ANY.ABODE
PLANE.DIE.NOTON
....TODO.EGO...
GASH.NINJA.KEEL
ARTICLE.ORU.DOE
YEARLY.MISPRINT
..NEI.MAN.SOT..
CALENDAR.RETIES
ICE.TAR.POTHOLE
OTEP.HQTRS.SNIT
...ALL.HEAL....
SPIRO.NET.ATLAS
TARTS.ETA.DOONE
UWAVE.WAX..YUTZ

## Clues

A1. Captain of the Pequod ~ AHAB
A5. Food for second chance chewing ~ CUD
A8. Font feature ~ SERIF
A13. Palindromic address to a female ~ MADAM
A15. ___ Way You Want It ~ ANY
A16. Place often described as humble ~ ABODE
A17. Flat two dimensional surface in geometry ~ PLANE
A18. Grim homophone of 7D ~ DIE
A19. Off ~ NOTON
A20. Heading for some lists ~ TODO
A22. Kanye West is famous for his ~ EGO
A23. Laceration ~ GASH
A27. Alias of Twitch star Richard Tyler Blevins ~ NINJA
A29. Capsize ~ KEEL
A33. Piece of clothing or print ~ ARTICLE
A35. Evangelical school in Tulsa, OK ~ ORU
A37. ___-eyed ~ DOE
A38. Annual ~ YEARLY
A39. The stamp with the upside down airplane is a famous one ~ MISPRINT
A41. With 42A and Marcus, a luxury department store chain ~ NEI
A42. 41A continued ~ MAN
A43. Lush ~ SOT
A44. The Mayan one ended in 2012 ~ CALENDAR
A47. What a child often does to their shoes ~ RETIES
A50. Vanilla ___ ~ ICE
A51. Maligned cigarette ingredient ~ TAR
A52. Frequent cause for a new tire ~ POTHOLE
A53. Los Angeles heavy metal act ~ OTEP
A55. Bldgs. such as the Googleplex ~ HQTRS
A57. A fit of irritation ~ SNIT
A58. Lead-in to American or day ~ ALL
A60. What Pokémon do at a Pokémon Center ~ HEAL
A62. Nixon's vice ~ SPIRO
A65. Nothing but ___ ~ NET
A66. One with the world on his shoulders ~ ATLAS
A71. Filled pastries ~ TARTS
A72. Age, in Milan ~ ETA
A73. Lorna ___, novel or cookie ~ DOONE
A74. Electrocardiogram readout feature ~ UWAVE
A75. Hip slang for records ~ WAX
A76. Yiddish for a foolish person ~ YUTZ

D1. Pc. of concert gear ~ AMP
D2. AI antagonist of 2001 ~ HAL
D3. Programming pioneer Lovelace ~ ADA
D4. Prohibit ~ BAN
D5. Type of person to routinely carry a club ~ CADDIE
D6. State of the ___ Address ~ UNION
D7. Colorful homophone of 18A ~ DYE
D8. Snitched ~ SANG
D9. Kindle fare ~ EBOOK
D10. Decayed matter ~ ROT
D11. Type of response you hope to get at the altar ~ IDO
D12. Peat-accumulating wetland ~ FEN
D14. The ___, NY art museum ~ MET
D21. ___Fans ~ ONLY
D22. Friends, Romans, countrymen, lend me your... ~ EARS
D23. \\"Friend of Dorothy\\" ~ GAY
D24. We ___ the Champions ~ ARE
D25. Father of Spider-Man ~ STANLEE
D26. What a certain applicant becomes ~ HIREE
D28. Connect ~ JOIN
D30. Particular form of a published text ~ EDITION
D31. Suffix at the end of all of Eevee's evolutions ~ EON
D32. Live and ___ Die ~ LET
D34. Famous Eastwood whose name became a famous Gorillaz song ~ CLINT
D36. Unexpected result in a sporting competition ~ UPSET
D39. Disfigure ~ MAR
D40. David Lee and Tim ~ ROTHS
D42. Luxury watch collection by Garmin ~ MARQ
D44. Top dog in an IT org ~ CIO
D45. Sister ___ ~ ACT
D46. Author Roald ~ DAHL
D47. Civil rights activist Parks ~ ROSA
D48. An additional name that could be part of 40D's clue ~ ELI
D49. Director's domain ~ SET
D52. Type of income to go in a 401k ~ PRETAX
D54. The Empire Strikes Back, to the Star Wars saga ~ PARTV
D56. Greek letter following 72A ~ THETA
D59. Misplace ~ LOSE
D61. Wee boy ~ LAD
D62. Dad to Tommy Pickles ~ STU
D63. The only Patrol I trust ~ PAW
D64. Smart savings plan, briefly ~ IRA
D65. Fresh ~ NEW
D67. Breeds such as Chihuahua or Pomeranian ~ TOY
D68. Bega behind \\"Mambo No. 5\\" ~ LOU
D69. Aardvark breakfast ~ ANT
D70. Sonic ___ ~ SEZ

## Design

<style>
O { background: circle }
</style>

O..O##O.O#.O..O
.....#...#.....
.....#...#.....
####....#...###
O..O#.O.O.#O..O
.......#...#...
......#........
##...#O.O#...##
........#......
...#...#.......
O..O#.O.O.#O..O
###...#....####
.....#...#.....
.....#...#.....
O..O.#O.O##O..O
"
`)
})

it("doesnt include the editor metadata", () => {
  const puz = readFileSync(`./tests/puz/alpha-bits.puz`)
  const xd = puzToXD(puz)
  const json = xdToJSON(xd, true, true)
  const newXD = JSONToXD(json)
  expect(newXD).toMatchInlineSnapshot(`
"## Metadata

title: Alpha-Bits
author: Drew Hodson
date: Not set
editor: Not set
copyright: © 2021
description: N/A

## Grid

AHAB..CUD.SERIF
MADAM.ANY.ABODE
PLANE.DIE.NOTON
....TODO.EGO...
GASH.NINJA.KEEL
ARTICLE.ORU.DOE
YEARLY.MISPRINT
..NEI.MAN.SOT..
CALENDAR.RETIES
ICE.TAR.POTHOLE
OTEP.HQTRS.SNIT
...ALL.HEAL....
SPIRO.NET.ATLAS
TARTS.ETA.DOONE
UWAVE.WAX..YUTZ

## Clues

A1. Captain of the Pequod ~ AHAB
A5. Food for second chance chewing ~ CUD
A8. Font feature ~ SERIF
A13. Palindromic address to a female ~ MADAM
A15. ___ Way You Want It ~ ANY
A16. Place often described as humble ~ ABODE
A17. Flat two dimensional surface in geometry ~ PLANE
A18. Grim homophone of 7D ~ DIE
A19. Off ~ NOTON
A20. Heading for some lists ~ TODO
A22. Kanye West is famous for his ~ EGO
A23. Laceration ~ GASH
A27. Alias of Twitch star Richard Tyler Blevins ~ NINJA
A29. Capsize ~ KEEL
A33. Piece of clothing or print ~ ARTICLE
A35. Evangelical school in Tulsa, OK ~ ORU
A37. ___-eyed ~ DOE
A38. Annual ~ YEARLY
A39. The stamp with the upside down airplane is a famous one ~ MISPRINT
A41. With 42A and Marcus, a luxury department store chain ~ NEI
A42. 41A continued ~ MAN
A43. Lush ~ SOT
A44. The Mayan one ended in 2012 ~ CALENDAR
A47. What a child often does to their shoes ~ RETIES
A50. Vanilla ___ ~ ICE
A51. Maligned cigarette ingredient ~ TAR
A52. Frequent cause for a new tire ~ POTHOLE
A53. Los Angeles heavy metal act ~ OTEP
A55. Bldgs. such as the Googleplex ~ HQTRS
A57. A fit of irritation ~ SNIT
A58. Lead-in to American or day ~ ALL
A60. What Pokémon do at a Pokémon Center ~ HEAL
A62. Nixon's vice ~ SPIRO
A65. Nothing but ___ ~ NET
A66. One with the world on his shoulders ~ ATLAS
A71. Filled pastries ~ TARTS
A72. Age, in Milan ~ ETA
A73. Lorna ___, novel or cookie ~ DOONE
A74. Electrocardiogram readout feature ~ UWAVE
A75. Hip slang for records ~ WAX
A76. Yiddish for a foolish person ~ YUTZ

D1. Pc. of concert gear ~ AMP
D2. AI antagonist of 2001 ~ HAL
D3. Programming pioneer Lovelace ~ ADA
D4. Prohibit ~ BAN
D5. Type of person to routinely carry a club ~ CADDIE
D6. State of the ___ Address ~ UNION
D7. Colorful homophone of 18A ~ DYE
D8. Snitched ~ SANG
D9. Kindle fare ~ EBOOK
D10. Decayed matter ~ ROT
D11. Type of response you hope to get at the altar ~ IDO
D12. Peat-accumulating wetland ~ FEN
D14. The ___, NY art museum ~ MET
D21. ___Fans ~ ONLY
D22. Friends, Romans, countrymen, lend me your... ~ EARS
D23. \\"Friend of Dorothy\\" ~ GAY
D24. We ___ the Champions ~ ARE
D25. Father of Spider-Man ~ STANLEE
D26. What a certain applicant becomes ~ HIREE
D28. Connect ~ JOIN
D30. Particular form of a published text ~ EDITION
D31. Suffix at the end of all of Eevee's evolutions ~ EON
D32. Live and ___ Die ~ LET
D34. Famous Eastwood whose name became a famous Gorillaz song ~ CLINT
D36. Unexpected result in a sporting competition ~ UPSET
D39. Disfigure ~ MAR
D40. David Lee and Tim ~ ROTHS
D42. Luxury watch collection by Garmin ~ MARQ
D44. Top dog in an IT org ~ CIO
D45. Sister ___ ~ ACT
D46. Author Roald ~ DAHL
D47. Civil rights activist Parks ~ ROSA
D48. An additional name that could be part of 40D's clue ~ ELI
D49. Director's domain ~ SET
D52. Type of income to go in a 401k ~ PRETAX
D54. The Empire Strikes Back, to the Star Wars saga ~ PARTV
D56. Greek letter following 72A ~ THETA
D59. Misplace ~ LOSE
D61. Wee boy ~ LAD
D62. Dad to Tommy Pickles ~ STU
D63. The only Patrol I trust ~ PAW
D64. Smart savings plan, briefly ~ IRA
D65. Fresh ~ NEW
D67. Breeds such as Chihuahua or Pomeranian ~ TOY
D68. Bega behind \\"Mambo No. 5\\" ~ LOU
D69. Aardvark breakfast ~ ANT
D70. Sonic ___ ~ SEZ

## Design

<style>
O { background: circle }
</style>

O..O##O.O#.O..O
.....#...#.....
.....#...#.....
####....#...###
O..O#.O.O.#O..O
.......#...#...
......#........
##...#O.O#...##
........#......
...#...#.......
O..O#.O.O.#O..O
###...#....####
.....#...#.....
.....#...#.....
O..O.#O.O##O..O
"
`)
})

it("doesnt include the editor metadata", () => {
  const puz = readFileSync(`./tests/puz/alpha-bits.puz`)
  const xd = puzToXD(puz)
  const json = xdToJSON(xd, true, true)
  json.clues.across[0].metadata = { hint: "Here's a hint" }
  const newXD = JSONToXD(json)
  expect(newXD).toMatchInlineSnapshot(`
"## Metadata

title: Alpha-Bits
author: Drew Hodson
date: Not set
editor: Not set
copyright: © 2021
description: N/A

## Grid

AHAB..CUD.SERIF
MADAM.ANY.ABODE
PLANE.DIE.NOTON
....TODO.EGO...
GASH.NINJA.KEEL
ARTICLE.ORU.DOE
YEARLY.MISPRINT
..NEI.MAN.SOT..
CALENDAR.RETIES
ICE.TAR.POTHOLE
OTEP.HQTRS.SNIT
...ALL.HEAL....
SPIRO.NET.ATLAS
TARTS.ETA.DOONE
UWAVE.WAX..YUTZ

## Clues

A1. Captain of the Pequod ~ AHAB
A1 ^hint: Here's a hint

A5. Food for second chance chewing ~ CUD
A8. Font feature ~ SERIF
A13. Palindromic address to a female ~ MADAM
A15. ___ Way You Want It ~ ANY
A16. Place often described as humble ~ ABODE
A17. Flat two dimensional surface in geometry ~ PLANE
A18. Grim homophone of 7D ~ DIE
A19. Off ~ NOTON
A20. Heading for some lists ~ TODO
A22. Kanye West is famous for his ~ EGO
A23. Laceration ~ GASH
A27. Alias of Twitch star Richard Tyler Blevins ~ NINJA
A29. Capsize ~ KEEL
A33. Piece of clothing or print ~ ARTICLE
A35. Evangelical school in Tulsa, OK ~ ORU
A37. ___-eyed ~ DOE
A38. Annual ~ YEARLY
A39. The stamp with the upside down airplane is a famous one ~ MISPRINT
A41. With 42A and Marcus, a luxury department store chain ~ NEI
A42. 41A continued ~ MAN
A43. Lush ~ SOT
A44. The Mayan one ended in 2012 ~ CALENDAR
A47. What a child often does to their shoes ~ RETIES
A50. Vanilla ___ ~ ICE
A51. Maligned cigarette ingredient ~ TAR
A52. Frequent cause for a new tire ~ POTHOLE
A53. Los Angeles heavy metal act ~ OTEP
A55. Bldgs. such as the Googleplex ~ HQTRS
A57. A fit of irritation ~ SNIT
A58. Lead-in to American or day ~ ALL
A60. What Pokémon do at a Pokémon Center ~ HEAL
A62. Nixon's vice ~ SPIRO
A65. Nothing but ___ ~ NET
A66. One with the world on his shoulders ~ ATLAS
A71. Filled pastries ~ TARTS
A72. Age, in Milan ~ ETA
A73. Lorna ___, novel or cookie ~ DOONE
A74. Electrocardiogram readout feature ~ UWAVE
A75. Hip slang for records ~ WAX
A76. Yiddish for a foolish person ~ YUTZ

D1. Pc. of concert gear ~ AMP
D2. AI antagonist of 2001 ~ HAL
D3. Programming pioneer Lovelace ~ ADA
D4. Prohibit ~ BAN
D5. Type of person to routinely carry a club ~ CADDIE
D6. State of the ___ Address ~ UNION
D7. Colorful homophone of 18A ~ DYE
D8. Snitched ~ SANG
D9. Kindle fare ~ EBOOK
D10. Decayed matter ~ ROT
D11. Type of response you hope to get at the altar ~ IDO
D12. Peat-accumulating wetland ~ FEN
D14. The ___, NY art museum ~ MET
D21. ___Fans ~ ONLY
D22. Friends, Romans, countrymen, lend me your... ~ EARS
D23. \\"Friend of Dorothy\\" ~ GAY
D24. We ___ the Champions ~ ARE
D25. Father of Spider-Man ~ STANLEE
D26. What a certain applicant becomes ~ HIREE
D28. Connect ~ JOIN
D30. Particular form of a published text ~ EDITION
D31. Suffix at the end of all of Eevee's evolutions ~ EON
D32. Live and ___ Die ~ LET
D34. Famous Eastwood whose name became a famous Gorillaz song ~ CLINT
D36. Unexpected result in a sporting competition ~ UPSET
D39. Disfigure ~ MAR
D40. David Lee and Tim ~ ROTHS
D42. Luxury watch collection by Garmin ~ MARQ
D44. Top dog in an IT org ~ CIO
D45. Sister ___ ~ ACT
D46. Author Roald ~ DAHL
D47. Civil rights activist Parks ~ ROSA
D48. An additional name that could be part of 40D's clue ~ ELI
D49. Director's domain ~ SET
D52. Type of income to go in a 401k ~ PRETAX
D54. The Empire Strikes Back, to the Star Wars saga ~ PARTV
D56. Greek letter following 72A ~ THETA
D59. Misplace ~ LOSE
D61. Wee boy ~ LAD
D62. Dad to Tommy Pickles ~ STU
D63. The only Patrol I trust ~ PAW
D64. Smart savings plan, briefly ~ IRA
D65. Fresh ~ NEW
D67. Breeds such as Chihuahua or Pomeranian ~ TOY
D68. Bega behind \\"Mambo No. 5\\" ~ LOU
D69. Aardvark breakfast ~ ANT
D70. Sonic ___ ~ SEZ

## Design

<style>
O { background: circle }
</style>

O..O##O.O#.O..O
.....#...#.....
.....#...#.....
####....#...###
O..O#.O.O.#O..O
.......#...#...
......#........
##...#O.O#...##
........#......
...#...#.......
O..O#.O.O.#O..O
###...#....####
.....#...#.....
.....#...#.....
O..O.#O.O##O..O
"
`)
})

it("can handle going back to an xd file WITH pipes in the original xd file", () => {
  const xd = readFileSync(`./tests/puz/twitch-tv-with-pipes.xd`)
  const json = xdToJSON(xd.toString())
  const newXD = JSONToXD(json)
  expect(newXD).toMatchInlineSnapshot(`
"## Metadata

title: Rebus split test
author: Penelope Rudow
date: Not set
editor: Not set
copyright: © 2021
description: N/A
rebus: ❶=DOT
splitcharacter: |

## Grid

TWITCH❶TV

## Clues

A1. Example ~ TWITCH|DOT|T|V

"
`)
})
