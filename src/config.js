"use strict";
const path  = require("path");
const base  = typeof process.pkg === "undefined" ? process.cwd() : path.dirname(process.execPath);

module.exports = {
  /* ───── meta ───── */
  description : "Protardio Citizens – test batch",
  baseUri     : "ipfs://NewUriToReplace",
  format      : { width: 600, height: 600, smoothing: false },

  /* ───── backgrounds ───── */
  background  : { generate: true, brightness: "80%" },

  /* ───── dual configs ───── */
  layerConfigurations: [
    /* ①  rare costumes only */
    {
      growEditionSizeTo: 25,
      namePrefix: "Protardio",
      layersOrder: [
        { name: "Backgrounds" },
        { name: "Body.skin.race" },
        { name: "Brows" },
        { name: "Eyes" },
        { name: "Face decoration" },
        { name: "Hair" },
        { name: "Costume" },               // hoodie / niqab / etc.
        { name: "Mouth" },
        { name: "Friend" },
        { name: "Text Overlay" },
      ],
    },

    /* ②  normal avatars (the remaining pcs) */
    {
      growEditionSizeTo: 1000,             // final id = 100
      namePrefix: "Protardio",
      layersOrder: [
        { name: "Backgrounds" },
        { name: "Body.skin.race" },
        { name: "Brows" },
        { name: "Eyes" },
        { name: "Face decoration" },
        { name: "Hair", options: { displayName: "Hair" } },
        { name: "Glasses" },
        { name: "Hat", options: { displayName: "Hat" } },
        { name: "Shirt" },
        { name: "Earrings" },
        { name: "Mouth" },
        { name: "Weapon" },
        { name: "Friend" },
        { name: "Text Overlay" },
      ],
    },
  ],

  /* ───── incompatibilities with pattern matching support ───── */
  incompatible: {
    // Oni bodies - no hair or hats
    "Oni Light": ["Hair*", "Hat*", "hat_*", "*HIGHER HAT*", "*Party Hat*"],
    "Oni Dark": ["Hair*", "Hat*", "hat_*", "*HIGHER HAT*", "*Party Hat*"],
    
    // Ghost bodies - no solid accessories
    "Base Ghost": ["Glasses*", "Earrings*", "Hat*"],
    "Ghost": ["Glasses*", "Earrings*", "Hat*"],
    
    // Certain costumes override other clothing
    "CostumeAstronaut": ["Shirt*", "Hat*"],  // Astronaut has built-in helmet
    "CostumePikachu": ["Shirt*"],             // Full body costume
    "CostumeShark": ["Shirt*"],               // Full body costume
    
    // Niqab costumes hide certain facial features
    "*Niqab": ["Mouth*", "Face decoration*"], // All niqab variants
  },

  /* ───── forced combinations (exact names only for now) ───── */
  forcedCombinations: {
    // Example: Force specific combinations
    // "floral": ["MetallicShades", "Golden Sakura"],
  },

  /* ───── misc ───── */
  emptyLayerName : "NON3",
  rarityDelimiter: "#",
  uniqueDnaTorrance: 100000,
  shuffleLayerConfigurations: true,   // shuffles all outputs together :contentReference[oaicite:0]{index=0}
  debugLogs: true,
  hashImages: true,
  useRootTraitType: true,
  outputJPEG: false,
  startIndex: 0,

  /* paths */
  buildDir : path.join(base, "build"),
  layersDir: path.join(base, "layers"),

  /* previews */
  preview:     { thumbPerRow:5, thumbWidth:50, imageRatio:1, imageName:"preview.png" },
  preview_gif: { numberOfImages:100, order:"MIXED", repeat:0, quality:100, delay:100, imageName:"preview.gif" },

  extraAttributes: () => [],
  
  /* ───── additional scalable configuration ideas ───── */
  // These are commented out but show what's possible:
  
  // traitGroups: {
  //   "headwear": ["Hair*", "Hat*", "hat_*"],
  //   "facewear": ["Glasses*", "Face*"],
  //   "clothing": ["Shirt*", "Costume*"],
  // },
  
  // conditionalWeights: {
  //   "Winter*": { season: "winter", multiplier: 2.0 },
  //   "Summer*": { season: "summer", multiplier: 2.0 },
  // },
  
  // rarityTiers: {
  //   "legendary": ["*Ghost*", "Oni*"],
  //   "epic": ["*Aura*", "Alien*"],
  //   "rare": ["Reptilian*", "Zombie*"],
  // },
  traitValueOverrides: {},
};
