import { readFileSync } from "fs"
import { jpzToXD } from "../lib/jpzToXD"

const jpz = readFileSync("./tests/jpz/lil-167-ratliff-121823.jpz", "utf8")

describe(jpzToXD.name, () => {
  it("should parse a simple jpz file", () => {
    expect(jpz).toContain("Shell-shielded species")

    const res = jpzToXD(jpz)
    expect(res).toMatchInlineSnapshot(`
"## Metadata

title: December 18, 2023 - \\"Pipelines\\" - Darby Ratliff, edited by Will Eisenberg
author: Darby Ratliff
editor: 
date: 2023-11-10
copyright: (c) 2023

## Grid

IHOP.STAIN.
NOTI.NUDGES
CORNCOBDOWN
ADOBO...TSO
...AIM.BYOB
.HALFDREAM.
WALL.SUB...
ALE...DRAFT
WARPCLEANER
ALTERS.VETO
..SPUD.EWAN

## Clues

A1. Breakfast chain that should install pogo stick racks? ~ 
A5. Leave a mark? ~ 
A10. Shell-shielded species introduced in \\"Ahsoka\\" ~ 
A11. Gently encourages ~ 
A13. *Accessory for Frosty ~ 
A15. *\\"Hush!\\" ~ 
A16. Filipino stew celebrated by a 2023 Google Doodle ~ 
A17. General on many an American Chinese menu ~ 
A18. Org. that seized a replica of the Mayflower on Thanksgiving 1970 ~ 
A20. Caveat on a BBQ invite ~ 
A21. *Ramp found in \\"Tony Hawk: Pro Skater 2\\" ~ 
A23. *Unlikely aspiration ~ 
A25. \\"Over the Garden ___\\" (Cartoon Network miniseries) ~ 
A26. Step in ~ 
A27. Word that might follow pretzel or pumpkin ~ 
A28. What 27-Across might be on ~ 
A32. *Mario's portal that's apt since he's a plumber ~ 
A34. *Piece of equipment for an egg drop in Physics, perhaps ~ 
A36. Changes a vowel in the spelling of altars? ~ 
A37. Deny, presidentially ~ 
A38. Tater ~ 
A39. \\"Obi-Wan Kenobi\\" star McGregor ~ 

D1. Quechua speaker ~ 
D2. Robin tail? ~ 
D3. Al ___ Lado (humanitarian support group whose name means \\"On the Other Side\\") ~ 
D4. Arcade game with \\"Star Wars\\" and \\"Ghostbusters\\" variants ~ 
D5. ___-caps ~ 
D6. Place to rub-a-dub-dub ~ 
D7. Put it all together, say ~ 
D8. \\"Lean on me\\" ~ 
D9. \\"Divers\\" singer Joanna ~ 
D12. One who might have their pinky up ~ 
D14. Style elaborately ~ 
D19. Psychiatrists' degs. ~ 
D20. \\"You can do this\\" ~ 
D21. Kind of food often found in a D.C. food cart ~ 
D22. Notifies ~ 
D24. Response to teasing ~ 
D25. Sheetz competitor ~ 
D29. Over again ~ 
D30. Baked cheese in a viral TikTok recipe ~ 
D31. 1982 cult classic in which Jeff Bridges says, \\"Greetings, programs\\" ~ 
D33. Word preceding band or squad ~ 
D34. French wine designation ~ 
D35. Psychedelic found during April Fool's Day? ~ "
`)
  })
})
