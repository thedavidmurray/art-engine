"use strict";

/**
 * This utility tool is designed specifically for the scenario in which you 
 * would like to replace one or many tokens with one off, non-generated items,
 * (or any image/metadata combo that does NOT conflict with the generators permutation DNA checks)
 
 */
import fs from "fs";
import path from "path";
import chalk from "chalk";
import keccak256 from "keccak256";
import { Command } from "commander";
import Crypto from "../src/use/Crypto.js";

const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const program = new Command();

const builtImageDir = `${basePath}/build/images`;
const builtJsonDir = `${basePath}/build/json`;

const getIndividualJsonFiles = (sourcePath) => {
  return fs
    .readdirSync(sourcePath)
    .filter((item) => /^[0-9]{1,6}.json/g.test(item));
};

const getIndividualImageFiles = (sourcePath) => {
  return fs.readdirSync(sourcePath);
};

/**
 * Resolve an objects nested path from string
 * @param {String} path string path to object
 * @param {Object} obj Optional to directly return the value
 * @returns
 */
function resolveNested(stringpath, obj) {
  return stringpath
    .split(".") // split string based on `.`
    .reduce(function (o, k) {
      return o && o[k]; // get inner property if `o` is defined else get `o` and return
    }, obj); // set initial value as object
}

/**
 * Randomly selects a number within the range of built images.
 * Since images and json files in the build folder are assumed to be identical,
 * we index of the length of the images directory.
 *
 * @param {String} image incomong filename
 * @param {Number} randomID new index to replace existing image/json files
 * @param {String} sourcePath path to source files
 * @param {Object} options command options object
 */
const replace = (image, randomID, sourcePath, options) => {
  options.sneak
    ? console.log(chalk.cyan(`Randomly replacing ${image} -> ${randomID} `))
    : null;
  // console.log({ image, index, sourcePath });
  const imageNum = image.substr(0, image.lastIndexOf(".")) || image;
  const imageExtension = image.split(".").pop();

  // read the data, replace the numbers
  const currentImage = fs.readFileSync(path.join(sourcePath, "images", image));
  try {
    const currentData = fs.readFileSync(
      path.join(sourcePath, "json", `${imageNum}.json`)
    );

    const newMetadata = JSON.parse(currentData);
    // hash the image
    const imageHash = Crypto.hash(currentImage);
    newMetadata.imageHash = imageHash;

    // replace all ## with proper edition number
    const symbol = options.replacementSymbol
      ? new RegExp(options.replacementSymbol, "gm")
      : /##/gm;

    const updatedMetadata = JSON.stringify(newMetadata, null, 2).replace(
      symbol,
      randomID
    );

    const sanitizedMetadata = JSON.parse(updatedMetadata);
    // ensure the replacement edition/identifier is a number
    const identifierProp = options.identifier ?? "edition";
    sanitizedMetadata[identifierProp] = parseInt(
      sanitizedMetadata[identifierProp]
    );
    sanitizedMetadata.name = sanitizedMetadata.name.replace(/(\d+)/g, "#$1");

    options.debug ? console.log({ symbol }) : null;

    options.debug
      ? console.log(`Generating hash from ${image}`, imageHash)
      : null;

    const globalMetadata = JSON.parse(
      fs.readFileSync(path.join(builtJsonDir, "_metadata.json"))
    );

    // update the object in the globalFile,
    const updateIndex = globalMetadata.findIndex((item) => {
      const globalIndex = options.identifier
        ? resolveNested(options.identifier, item)
        : item.edition;
      return globalIndex === randomID;
    });
    console.log("updateIndex", updateIndex);
    if (updateIndex < 0) {
      throw new Error(
        `Could not find the identifier, "${
          options.identifier ? options.identifier : "edition"
        }" in _metadata.json. Check that it is correct and try again.`
      );
    }
    options.debug
      ? console.log(
          `updating _metadata.json index [${updateIndex}]`,
          globalMetadata[updateIndex]
        )
      : null;

    const updatedGlobalMetadata = globalMetadata;
    // set the new data in the _metadata.json
    console.log({ sanitizedMetadata });
    updatedGlobalMetadata[updateIndex] = sanitizedMetadata;
    // everything looks good to write files.
    // overwrite the build json file
    if (!options.nowrite) {
      fs.writeFileSync(
        path.join(builtJsonDir, `${randomID}.json`),
        JSON.stringify(sanitizedMetadata, null, 2)
      );
      // overwrite the build image file
      fs.writeFileSync(
        path.join(builtImageDir, `${randomID}.${imageExtension}`),
        currentImage
      );

      // overwrite the build image file
      fs.writeFileSync(
        path.join(builtJsonDir, "_metadata.json"),
        JSON.stringify(updatedGlobalMetadata, null, 2)
      );
    }
  } catch (error) {
    console.error(error);
    throw new Error(`Image ${imageNum} is missing a matching JSON file`);
  }
};

program
  .argument("<source>")
  .option("-d, --debug", "display additional logging")
  .option("-s, --sneak", "output the random ID's that are being replaced")
  .option("-n, --nowrite", "dry run to test without writing the data out")
  .option(
    "-p, --pick <pick>",
    "Comma separated list. explicitly pick the numbers that will be replaced"
  )
  .option(
    "-r, --replacementSymbol <symbol>",
    "The character used as a placeholder for edition numbers"
  )
  .option(
    "-i, --identifier <identifier>",
    'Change the default object identifier/location for the edition/id number. defaults to "edition"'
  )
  .action((source, options, command) => {
    // get source to replace from
    // replaceFrom source/ -> destination

    // get source to replace to, image + json
    const imageSource = path.join(basePath, source, `/images`);
    const dataSource = path.join(basePath, source, `/json`);
    const imageFiles = getIndividualImageFiles(imageSource);
    const dataFiles = getIndividualJsonFiles(dataSource);
    // global variable to keep track of which ID's have been used.
    let randomIDs = new Set();
    if (options.pick) {
      const parsedIDs = options.pick.split(",").map((n) => parseInt(n));
      randomIDs = new Set(parsedIDs);
    }
    options.pick ? console.log(`Replacing the follong ids`, randomIDs) : null;
    options.nowrite
      ? console.log(
          chalk.yellowBright("\nDry run. Images and data will NOT be replaced")
        )
      : null;
    console.log(
      chalk.greenBright.inverse(`\nPulling images and data from ${source}`)
    );
    options.debug
      ? console.log(
          `\tFound ${imageFiles.length} images in "${imageSource}"
        and
        ${dataFiles.length} in ${dataSource}`
        )
      : null;

    // Main functions in trycatch block for cleaner error logging if throwing errors.
    // try {
    if (imageFiles.length !== dataFiles.length) {
      throw new Error(
        "Number of images and number of metadata JSON files do not match. \n Are you Missing one?"
      );
    }
    // get the length of images in the build folder
    const totalCount =
      JSON.parse(fs.readFileSync(path.join(builtJsonDir, "_metadata.json")))
        .length - 1;
    // fs.readdirSync(builtImageDir).length;

    console.log(`Total count ${totalCount}`);

    while (randomIDs.size < imageFiles.length) {
      randomIDs.add(Math.floor(Math.random() * (totalCount - 1 + 1) + 1));
    }
    const randomIDArray = Array.from(randomIDs);

    // randomly choose a number
    imageFiles.forEach((image, index) =>
      replace(image, randomIDArray[index], path.join(basePath, source), options)
    );
    // if image is missing accompanying json, throw error.
    console.log(
      chalk.green(
        `\nSuccessfully inserted ${chalk.bgGreenBright.black(
          imageFiles.length
        )} Images and Data Files into the build directories\n`
      )
    );
    // } catch (error) {
    //   console.error(chalk.bgRedBright.black(error));
    // }

    // side effectsa
    // does it affect rarity data util?
    // provenance hash?

    // jsonFiles.forEach((filename) => {
    //   // read the contents
    //   options.debug ? console.log(`removing ${trait} from ${filename}`) : null;
    //   const contents = JSON.parse(fs.readFileSync(`${jsonDir}/${filename}`));

    //   const hasTrait = contents.attributes.some(
    //     (attr) => attr.trait_type === trait
    //   );

    //   if (!hasTrait) {
    //     console.log(chalk.yellow(`"${trait}" not found in ${filename}`));
    //   }
    //   // remove the trait from attributes

    //   contents.attributes = contents.attributes.filter(
    //     (traits) => traits.trait_type !== trait
    //   );

    //   // write the file
    //   fs.writeFileSync(
    //     `${jsonDir}/${filename}`,
    //     JSON.stringify(contents, null, 2)
    //   );

    //   options.debug
    //     ? console.log(
    //         hasTrait ? chalk.greenBright("Removed \n") : "…skipped \n"
    //       )
    //     : null;
    // });
  });

program.parse();
