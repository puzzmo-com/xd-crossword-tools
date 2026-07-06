import type {
  AmuseTopLevel,
  Copyright,
  Letter,
  Locale,
  PublishTimeZone,
  PuzzleType
} from "../../src/amuseJSONToXD.types"

export const schrodingerAmuseExample: AmuseTopLevel = {
  meta: {},
  data: {
    id: 1,
    attributes: {
        amuse_id: "abcd1234",
        amuse_set: "tny-weekly",
        unsupported: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      amuse_data: {
      h: 5,
      w: 1,
      id: "abcd1234",
      box: [
        [
          "H/J" as Letter,
          "E" as Letter,
          "L" as Letter,
          "L" as Letter,
          "O" as Letter,
        ],
      ],
      help: "",
      tags: [],
      title: "Standard Puzzle",
      author: "Julien Devlin",
      locale: "en-US" as Locale,
      srcJPZ: true,
      tn_url: "",
      checkPDF: false,
      clueNums: [
        [
          "1",
          "0",
          "0",
          "0",
          "0",
        ],
      ],
      problems: [],
      subtitle: "",
      authorURL: "",
      copyright: "" as Copyright,
      showRebus: false,
      endMessage: "",
      isImported: true,
      puzzleType: "CROSSWORD" as PuzzleType,
      targetTime: 0,
      authorEmail: "",
      backdropURL: "",
      bonusPoints: 0,
      boxImageURL: "",
      description: "",
      placedWords: [
        {
          x: 0,
          y: 0,
          clue: {
            clue: "schrodinger clue",
          },
          word: "{H/J}ELLO",
          nBoxes: 5,
          clueNum: "1",
          intersects: false,
          originalTerm: "{H/J}ELLO",
          acrossNotDown: false
        },
      ],
      publishTime: 0,
      srcFileName: "test.jpz",
      allowSharing: false,
      attributions: "",
      checkEnabled: true,
      creationTime: 0,
      hideInPicker: false,
      hintsEnabled: true,
      modifiedTime: 0,
      pauseMessage: "",
      caseSensitive: false,
      letterPenalty: -1,
      preRevealIdxs: [
        [
          false,
          false,
          false,
          false,
          false,
        ],
      ],
      revealEnabled: true,
      shareImageURL: "",
      wrongSoundURL: "",
      correctSoundURL: "",
      hideClueColumns: false,
      publishTimeZone: "Etc/UTC" as PublishTimeZone,
      showStartButton: false,
      correctWordPoints: 0,
      contestModeEnabled: false,
      unlinkGridAndClues: false,
      wordLengthsEnabled: false,
      mediaPreviewEnabled: false,
      boxToPlacedWordsIdxs: [],
      errorCheckModeEnabled: true,
      mediaPreviewAndTextEnabled: true
       } }
  }
}

export const rebusAmuseExample: AmuseTopLevel = {
  meta: {},
  data: {
    id: 1,
    attributes: {
        amuse_id: "abcd1234",
        amuse_set: "tny-weekly",
        unsupported: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      amuse_data: {
      h: 4,
      w: 1,
      id: "abcd1234",
      box: [
        [
          "W" as Letter,
          "O" as Letter,
          "R" as Letter,
          "LD" as Letter,
        ],
      ],
      help: "",
      tags: [],
      title: "Standard Puzzle",
      author: "Julien Devlin",
      locale: "en-US" as Locale,
      srcJPZ: true,
      tn_url: "",
      checkPDF: false,
      clueNums: [
        [
          "1",
          "0",
          "0",
          "0",
        ],
      ],
      problems: [],
      subtitle: "",
      authorURL: "",
      copyright: "" as Copyright,
      showRebus: false,
      endMessage: "",
      isImported: true,
      puzzleType: "CROSSWORD" as PuzzleType,
      targetTime: 0,
      authorEmail: "",
      backdropURL: "",
      bonusPoints: 0,
      boxImageURL: "",
      description: "",
      placedWords: [
        {
          x: 0,
          y: 0,
          clue: {
            clue: "rebus clue",
          },
          word: "WOR{LD}",
          nBoxes: 4,
          clueNum: "1",
          intersects: false,
          originalTerm: "WOR{LD}",
          acrossNotDown: false
        }
      ],
      publishTime: 0,
      srcFileName: "test.jpz",
      allowSharing: false,
      attributions: "",
      checkEnabled: true,
      creationTime: 0,
      hideInPicker: false,
      hintsEnabled: true,
      modifiedTime: 0,
      pauseMessage: "",
      caseSensitive: false,
      letterPenalty: -1,
      preRevealIdxs: [
        [
          false,
          false,
          false,
          false,
        ],
      ],
      revealEnabled: true,
      shareImageURL: "",
      wrongSoundURL: "",
      correctSoundURL: "",
      hideClueColumns: false,
      publishTimeZone: "Etc/UTC" as PublishTimeZone,
      showStartButton: false,
      correctWordPoints: 0,
      contestModeEnabled: false,
      unlinkGridAndClues: false,
      wordLengthsEnabled: false,
      mediaPreviewEnabled: false,
      boxToPlacedWordsIdxs: [],
      errorCheckModeEnabled: true,
      mediaPreviewAndTextEnabled: true
       } }
  }
}

/** A 1x5 "HELLO" grid mixing colored, circled and circled+colored cells */
export const colorAmuseExample: AmuseTopLevel = (() => {
  const example = structuredClone(schrodingerAmuseExample)
  const amuseData = example.data.attributes.amuse_data

  amuseData.title = "Color Puzzle"
  amuseData.box = [["H" as Letter, "E" as Letter, "L" as Letter, "L" as Letter, "O" as Letter]]

  const emptyCellInfo = {
    isVoid: false,
    isCircled: false,
    rightWall: false,
    bottomWall: false,
    displayRightWallShort: false,
    displayBottomWallShort: false,
  }

  amuseData.cellInfos = [
    { ...emptyCellInfo, x: 0, y: 0, bgColor: "#FFEB3B" },
    { ...emptyCellInfo, x: 0, y: 1, bgColor: "#FFEB3B", isCircled: true },
    { ...emptyCellInfo, x: 0, y: 2, bgColor: "#B3E5FC" },
    { ...emptyCellInfo, x: 0, y: 3, isCircled: true },
  ]

  amuseData.placedWords = [
    {
      x: 0,
      y: 0,
      clue: {
        clue: "colorful greeting",
      },
      word: "HELLO",
      nBoxes: 5,
      clueNum: "1",
      intersects: false,
      originalTerm: "HELLO",
      acrossNotDown: false,
    },
  ]

  return example
})()
