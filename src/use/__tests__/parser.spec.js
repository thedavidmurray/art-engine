import { describe, expect, test } from "vitest";

import Parser from "../Parser";
// import { rarityDelimiter } from "../../../config";

console.log(Parser);

describe("clean name", () => {
  test("Returns clean name from weight", () => {
    //
    const rarityDelimiter = "#";
    const rawFile = "TraitValue#50.png";
    const rawFolder = "TraitValue#50";
    // expect the z
    expect(Parser.cleanName(rawFile, rarityDelimiter)).to.equal("TraitValue");
    expect(Parser.cleanName(rawFolder, rarityDelimiter)).to.equal("TraitValue");
  });
  test("Returns clean name from z-index", () => {
    const rarityDelimiter = "#";
    const rawFile = "z10,TraitValue#50.png";
    const rawFolder = "z10,TraitValue#50";
    // expect the z
    expect(Parser.cleanName(rawFile, rarityDelimiter)).to.equal("TraitValue");
    expect(Parser.cleanName(rawFolder, rarityDelimiter)).to.equal("TraitValue");
  });
  test("Returns clean name from query params", () => {
    const rarityDelimiter = "#";
    const rawFile = "TraitValue?blend=screen#50.png";
    const rawFolder = "TraitValue?blend=screen&opacity=50#50";
    // expect the z
    expect(Parser.cleanName(rawFile, rarityDelimiter)).to.equal("TraitValue");
    expect(Parser.cleanName(rawFolder, rarityDelimiter)).to.equal("TraitValue");
    //
  });

  test("returns weight when v-flag is present", () => {
    const rarityDelimiter = "#";
    const rawFile = "z10,TraitValue?blend=screen#50_v.png";
    expect(Parser.getRarityWeight(rawFile, rarityDelimiter)).to.equal(50);
  });

  test("Returns clean name from everything, on folder", () => {
    const rarityDelimiter = "#";
    const rawFile = "z10,TraitValue?blend=screen#50_v.png";
    const rawFolder = "z10,TraitValue?blend=screen&opacity=50#50_v";
    // expect the
    expect(Parser.cleanName(rawFile, rarityDelimiter)).to.equal("TraitValue");
    expect(Parser.cleanName(rawFolder, rarityDelimiter)).to.equal("TraitValue");
    // expect value flag
    const vflag = Parser.parseValueFlag(rawFile);
    const folderVFlag = Parser.parseValueFlag(rawFolder);
    expect(vflag).to.be.true;
    expect(folderVFlag).to.be.true;
  });
});

describe("Value Flag", () => {
  test("Gets value flag from folder with weight", () => {
    const raw = "TraitValue#22_v";
    expect(Parser.parseValueFlag(raw)).to.be.true;
  });
  test("Gets value flag from file with weight", () => {
    const rawPng = "TraitValue#22_v.png";
    const rawJpg = "TraitValue#22_v.jpg";
    expect(Parser.parseValueFlag(rawPng)).to.be.true;
    expect(Parser.parseValueFlag(rawJpg)).to.be.true;
  });
  test("Gets value flag from file with z and weight", () => {
    const rawPng = "z20,TraitValue#22_v.png";
    const rawJpg = "z20,TraitValue#22_v.jpg";
    expect(Parser.parseValueFlag(rawPng)).to.be.true;
    expect(Parser.parseValueFlag(rawJpg)).to.be.true;
  });
  test("Gets value flag from folder with z and weight", () => {
    //
    const raw = "z5,TraitValue#22_v";
    expect(Parser.parseValueFlag(raw)).to.be.true;
  });
  test("Gets value flag from folder with z,query, and weight", () => {
    const raw = "z5,TraitValue?blend=multiply#22_v";
    expect(Parser.parseValueFlag(raw)).to.be.true;
  });
});

describe("Rarity Weights", () => {
  test("Parses '#' weight for .png's", async () => {
    const file = "something#55.png";
    const result = Parser.getRarityWeight(file, "#");

    expect(result).to.equal(55);
  });

  test("Parses '%' weight for .png's", async () => {
    const file = "something%55.png";
    const result = Parser.getRarityWeight(file, "%");

    expect(result).to.equal(55);
  });

  test("Parses '#' weight for .jpg's", async () => {
    const file = "something#55.jpg";
    const result = Parser.getRarityWeight(file, "#");

    expect(result).to.equal(55);
  });

  test("Parses '#' weight for folder", async () => {
    const file = "something#55";
    const result = Parser.getRarityWeight(file, "#");

    expect(result).to.equal(55);
  });

  test("Parses '#' weight for folder with trait marker", async () => {
    const file = "something#55_v";
    const valueMark = Parser.parseValueFlag(file);
    const result = Parser.getRarityWeight(file, "#");
    expect(valueMark).to.be.true;
    expect(result).to.equal(55);
  });
});

describe("Query Strings", () => {
  test("Gets blend mode from file", () => {
    const file = "SomeFolder?blend=multiply#100.png";
    const { blendmode } = Parser.parseQueryString(file, {});
    expect(blendmode).to.equal("multiply");
  });
  test("Gets blend mode from folder", () => {
    const file = "SomeFolder?blend=multiply";
    const { blendmode } = Parser.parseQueryString(file, {});
    expect(blendmode).to.equal("multiply");
  });
  test("Gets opacity from folder", () => {
    const file = "SomeFolder?blend=multiply&opacity=20";
    const { opacity, blendmode } = Parser.parseQueryString(file, {});
    expect(blendmode).to.equal("multiply");
    expect(opacity).to.equal(0.2);
  });
  test("Gets blend mode from folder with v flag", () => {
    const file = "SomeFolder?blend=multiply_v";
    const { blendmode } = Parser.parseQueryString(file, {});
    expect(blendmode).to.equal("multiply");
  });
  test("Gets blend mode from file with v flag", () => {
    const file = "SomeFolder?blend=multiply#100_v.png";
    const { blendmode } = Parser.parseQueryString(file, {});
    expect(blendmode).to.equal("multiply");
  });
});
