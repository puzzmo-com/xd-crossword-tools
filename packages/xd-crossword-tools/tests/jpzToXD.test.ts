import { readFileSync } from "fs"
import { jpzToXD } from "../src/jpzToXD"
import { describe, it, expect } from "vitest"

const simpleJpz = readFileSync(__dirname + "/jpz/That's a Bear in a Bee Costume.jpz", "utf8")
const complexJpz = readFileSync(__dirname + "/jpz/lil-167-ratliff-121823.jpz", "utf8")
const jpzBarredContent = readFileSync(__dirname + "/jpz/Printer-Devilry-kyle-dolan.jpz", "utf-8")

describe(jpzToXD.name, () => {
  it("should parse a simple jpz file", () => {
    const res = jpzToXD(simpleJpz)
    expect(res).toMatchInlineSnapshot(`
      "## Metadata

      title: That's a Bear in a Bee Costume
      author: Dob Olino
      editor: 
      date: 2022-11-04
      copyright: 2022

      ## Grid

      .SMOL..SST.
      ATARI.SEWER
      BANGERALERT
      CGI.DOGEARS
      SEC..MANTA.
      ..MISPLAY..
      .MONTE..HMM
      RENTERS.ACA
      MADEASTINKY
      STAND.AODAI
      .SYD..BUSY.

      ## Clues

      A1. Teeny, as a cute animal, familiarly ~ SMOL
      A5. Indie record label counting Bad Brains, Husker Du, and Sonic Youth as past artists ~ SST
      A8. Early 80's gaming console brand ~ ATARI
      A9. Shitty channel? ~ SEWER
      A11. "Sound the hot new puzzle alarm!" ~ BANGERALERT
      A13. Some digital FX ~ CGI
      A14. Folded bookmarks ~ DOGEARS
      A15. Moment in time ~ SEC
      A16. ___ ray ~ MANTA
      A17. Judge a fly ball badly, for example ~ MISPLAY
      A20. Lead-in to Carlo or Cristo ~ MONTE
      A21. *scratches chin* "Let me think..." ~ HMM
      A24. They pay flat rates ~ RENTERS
      A26. Obama-era health care legislation, for short ~ ACA
      A27. Tooted ~ MADEASTINKY
      A29. Get (up) ~ STAND
      A30. Dress for a Tet celebration, perhaps ~ AODAI
      A31. Barrett of Pink Floyd ~ SYD
      A32. "You left it at the hotel! You go back and you get her ___ bee! GO TO THE HOTEL AND GET ___ BEE! RUN!" -iconic Best in Show quote ~ BUSY

      D1. ___ fright, bout of frayed nerves that may lead to 6d ~ STAGE
      D2. Bangles hit about Garfield's least favorite day of the week ~ MANICMONDAY
      D3. transgenderlawcenter.___ ~ ORG
      D4. Fudged, as a story ~ LIED
      D5. Mononymously-named singer known as "Queen of Tejano music" ~ SELENA
      D6. Clammy effect of 1d, maybe ~ SWEATYHANDS
      D7. Latin for "land" ~ TERRA
      D8. They're easy as 123's ~ ABCS
      D9. NPR host Peter ~ SAGAL
      D10. Shares another's post on Twitter, for short ~ RTS
      D12. One-piece garments that I absolutely didn't only just now learn are not the same as jumpsuits ~ ROMPERS
      D18. Mean ~ INTEND
      D19. Home closing? ~ STEAD
      D20. Butcher buys ~ MEATS
      D22. "Anchorman" director Adam ~ MCKAY
      D23. "Will you allow me?" ~ MAYI
      D24. Motel units: Abbr. ~ RMS
      D25. Attempt ~ STAB
      D28. Short message? ~ IOU"
    `)
  })

  it("should parse a more complex jpz file (this has bars, so the clues etc are wrong)", () => {
    const res = jpzToXD(complexJpz)
    expect(res).toMatchInlineSnapshot(`
      "## Metadata

      title: December 18, 2023 - "Pipelines" - Darby Ratliff, edited by Will Eisenberg
      author: Darby Ratliff
      editor: Will Eisenberg
      date: 2023-11-10
      copyright: (c) 2023
      form: barred

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

      A1. Breakfast chain that should install pogo stick racks? ~ IHOP
      A5. Leave a mark? ~ STAIN
      A10. Shell-shielded species introduced in "Ahsoka" ~ NOTI
      A11. Gently encourages ~ NUDGES
      A13. *Accessory for Frosty ~ CORNCOBDOWN
      A15. *"Hush!" ~ DOWN
      A16. Filipino stew celebrated by a 2023 Google Doodle ~ ADOBO
      A17. General on many an American Chinese menu ~ TSO
      A18. Org. that seized a replica of the Mayflower on Thanksgiving 1970 ~ AIM
      A20. Caveat on a BBQ invite ~ BYOB
      A21. *Ramp found in "Tony Hawk: Pro Skater 2" ~ HALFDREAM
      A23. *Unlikely aspiration ~ DREAM
      A25. "Over the Garden ___" (Cartoon Network miniseries) ~ WALL
      A26. Step in ~ SUB
      A27. Word that might follow pretzel or pumpkin ~ ALE
      A28. What 27-Across might be on ~ DRAFT
      A32. *Mario's portal that's apt since he's a plumber ~ WARPCLEANER
      A34. *Piece of equipment for an egg drop in Physics, perhaps ~ CLEANER
      A36. Changes a vowel in the spelling of altars? ~ ALTERS
      A37. Deny, presidentially ~ VETO
      A38. Tater ~ SPUD
      A39. "Obi-Wan Kenobi" star McGregor ~ EWAN

      D1. Quechua speaker ~ INCA
      D2. Robin tail? ~ HOOD
      D3. Al ___ Lado (humanitarian support group whose name means "On the Other Side") ~ OTRO
      D4. Arcade game with "Star Wars" and "Ghostbusters" variants ~ PINBALL
      D5. ___-caps ~ SNO
      D6. Place to rub-a-dub-dub ~ TUB
      D7. Put it all together, say ~ ADD
      D8. "Lean on me" ~ IGOTYA
      D9. "Divers" singer Joanna ~ NEWSOM
      D12. One who might have their pinky up ~ SNOB
      D14. Style elaborately ~ COIF
      D19. Psychiatrists' degs. ~ MDS
      D20. "You can do this" ~ BEBRAVE
      D21. Kind of food often found in a D.C. food cart ~ HALAL
      D22. Notifies ~ ALERTS
      D24. Response to teasing ~ RUDE
      D25. Sheetz competitor ~ WAWA
      D29. Over again ~ ANEW
      D30. Baked cheese in a viral TikTok recipe ~ FETA
      D31. 1982 cult classic in which Jeff Bridges says, "Greetings, programs" ~ TRON
      D33. Word preceding band or squad ~ PEP
      D34. French wine designation ~ CRU
      D35. Psychedelic found during April Fool's Day? ~ LSD"
    `)
  })

  it("handle a complex jpz file", () => {
    const res = jpzToXD(jpzBarredContent)
    expect(res).toMatchInlineSnapshot(`
      "## Metadata

      title: Beneath The Surface Printer&#039;s Devilry #4 (Midi)
      author: Kyle Dolan
      editor: 
      date: 
      copyright: © 2023 Kyle Dolan
      form: barred

      ## Grid

      SIGNPOST
      UNICORNS
      NCNARROW
      DAUNTUWE
      EYPTENOR
      RODENTLV
      SLEETIDE
      COUNTESS

      ## Clues

      A1. For dorm room wall, deer art is a popular choice (8) ~ SIGNPOST
      A6. Playing an investment game in Economics class, was lots offered the market? (7) ~ UNICORNS
      A9. As flight can be used to describe principles of classical mechanics (6) ~ NARROW
      A10. The reunion included grandparents, uncle, sans cousins and other extended family (5) ~ DAUNTUWE
      A13. The butcher shop was known for its famous sausages, for which they sold special extra-long buns (5) ~ TENOR
      A15. The oral surgeon who removed my wisdom teeth was a pal. Insurance covered the whole thing! (6) ~ RODENTLV
      A16. As commander of the flight, in having the most spacious cabin (3,4) ~ LEETIDE
      A17. With the term paper due date approaching, the lazy student tried to buy ad--I say!--off the Internet (8) ~ COUNTESS

      D1. The old couple knew each other so well that they had formed a Wordle standing between themselves (7) ~ SUNDERSC
      D2. For puzzle lovers, a good crossword is like brandy (4) ~ INCAYOLO
      D3. Loon setting up your user name and password to verify your account... (3,2) ~ GINUPDEU
      D4. ...if you need tech, super. Your email? (7) ~ PORTENTT
      D5. Our catcher isn&#039;t playing today--hermit there to be found (4) ~ SNOWOLDS
      D7. The bouncer didn&#039;t bother. Toss ID--she knew right away it was fake (7) ~ CANTEEN
      D8. Question: What items of clothing are typically worn by professional billiards players? Ants (7) ~ SWERVES
      D11. A lover offs Will, often use them as conversation starters at parties (5) ~ UNTIE
      D12. I&#039;ll have a turkey sandwich with Swiss cheese, mats of bacon, and tomatoes (4) ~ YOLO
      D14. A cake like daiginjo pairs well with sushi (4) ~ OLDS"
    `)
  })
})
