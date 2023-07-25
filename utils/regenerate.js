"use strict";
/**
 * The regeneration util uses the output _dna.json file to "continue" the same
 * uniqueness check the main generator uses when running the inital generation.
 *
 * This util takes an id number and generates an _additional_ unique DNA sequence,
 * and replaces the existing image and json files of the same id.
 *
 * It is assumed that the item is being regenerated because of an issue with
 * the DNA (picked traits), and that DNA is left in the _dna.json file so
 * (while changes are low) that item is not recreated again.
 */
import fs from "fs";
import path from "path";
import { Command } from "commander";
import chalk from "chalk";
import cnv from "canvas";
import Metadata from "../src/use/Metadata.js";
import workerpool from "workerpool";

import {
  format,
  background,
  uniqueDnaTorrance,
  shuffleLayerConfigurations,
  layerConfigurations,
  outputJPEG,
  startIndex,
} from "../config.js";

import {
  createDna,
  DNA_DELIMITER,
  isDnaUnique,
  writeMetaData,
  writeDnaLog,
  // paintLayers,
  layersSetup,
  // cmappedDnaToLayersonstructLayerToDna,
  // postProcessMetadata,
} from "../src/main.js";

import Paint from "../src/use/Paint.js";

const pool = workerpool.pool("./src/worker.js", {
  workerType: "process",
});

const { createCanvas } = cnv;

const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const program = new Command();

const jsonDir = `${basePath}/build/json`;
const imageDir = `${basePath}/build/images`;
const dnaFilePath = `${basePath}/build/_dna.json`;
const metadataFilePath = `${basePath}/build/json/_metadata.json`;

let failedCount = 0;
let attributesList = [];
const canvas = createCanvas(format.width, format.height);
const ctxMain = canvas.getContext("2d");

const getDNA = () => {
  const flat = JSON.parse(fs.readFileSync(dnaFilePath));
  return new Set(flat);
  // .filter((item) => /^[0-9]{1,6}.json/g.test(item));
};

function createItem(layers) {
  let newDna = createDna(layers);
  const existingDna = getDNA();
  if (isDnaUnique(newDna, existingDna)) {
    {
      const dna = _dna.split(DNA_DELIMITER);

      let mappedDnaToLayers = layers.map((layer, index) => {
        let selectedElements = [];
        const layerImages = dna.filter(
          (element) => element.split(".")[0] == layer.id
        );
        layerImages.forEach((img) => {
          const indexAddress = Parser.cleanDna(img);

          //

          const indices = indexAddress.toString().split(".");
          // const firstAddress = indices.shift();
          const lastAddress = indices.pop(); // 1
          // recursively go through each index to get the nested item
          let parentElement = indices.reduce((r, nestedIndex) => {
            if (!r[nestedIndex]) {
              throw new Error("wtf");
            }
            return r[nestedIndex].elements;
          }, _layers); //returns string, need to return

          selectedElements.push(parentElement[lastAddress]);
        });
        // If there is more than one item whose root address indicies match the layer ID,
        // continue to loop through them an return an array of selectedElements

        return {
          name: layer.name,
          blendmode: layer.blendmode,
          opacity: layer.opacity,
          selectedElements: selectedElements,
          ...(layer.display_type !== undefined && {
            display_type: layer.display_type,
          }),
        };
      });

      let results = mappedDnaToLayers;
      debugLogs ? console.log("DNA:", dna) : null;
      let loadedElements = [];
      // reduce the stacked and nested layer into a single array
      const allImages = results.reduce((images, layer) => {
        return [...images, ...layer.selectedElements];
      }, []);
      Paint.sortZIndex(allImages).forEach((layer) => {
        loadedElements.push(Paint.loadLayerImg(layer));
      });

      const renderObjectArray = Promise.all(loadedElements).then((data) => {
        const layerData = {
          dna,
          layerConfigIndex,
          tokenIndex,
          _background: background,
        };
        Paint.paintLayers(ctxMain, renderObjectArray, layerData, format);

        const metadata = outputFiles(tokenIndex, layerData);
        return metadata;
      });
    }
  } else {
    failedCount++;
    createItem(layers);
    if (failedCount >= uniqueDnaTorrance) {
      console.log(
        chalk.redBright(
          `You need more layers or elements to create a new, unique item`
        )
      );
      process.exit();
    }
  }
}

/**
 * Given an array of token ids, pick random items and regeneragte the
 * image and json
 **/
const regenerateItems = (_ids, options) => {
  let dnaList = getDNA();
  const generatorPromises = [];

  _ids.forEach((id) => {
    // get the dna lists
    const _id = parseInt(id);
    const layerEdition = layerConfigurations.reduce((acc, config) => {
      return [...acc, config.growEditionSizeTo];
    }, []);

    const layerConfigIndex =
      options.layerset ??
      layerEdition.findIndex((editionCount) => _id <= editionCount);
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );

    const newDna = createDna(layers);
    options.debug ? console.log({ newDna }) : null;

    // regenerate an image using main functions
    // const allImages = layerImages.reduce((images, layer) => {
    //   return [...images, ...layer.selectedElements];
    // }, []);
    if (isDnaUnique(newDna)) {
      // prepend the same output num (abstractedIndexes[0])
      // to the DNA as the saved files.
      dnaList.add(
        `${_id}/${newDna}${background.color ? "___" + background.color : ""}`
      );
      // uniqueDNAList.add(filterDNAOptions(newDna));
      generatorPromises.push(
        pool.exec("generate", [
          newDna,
          layers,
          DNA_DELIMITER,
          layerConfigIndex,
          background,
          _id,
        ])
      );
    } else {
      console.log(chalk.bgRed("DNA exists!"));
      failedCount++;
      if (failedCount >= uniqueDnaTorrance) {
        console.log(
          `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
        );
        process.exit();
      }
    }
  });

  //after loop
  Promise.all(generatorPromises).then(async (results) => {
    // Wait for all assets to be generated before writing the combined metadata
    console.log("generator done");
    // if (shuffleLayerConfigurations) {
    //   console.log(chalk.bgMagenta("metadata sort", results[0].edition));
    //   results.sort((a, b) => a.edition - b.edition);
    // }

    const existingMetadata = JSON.parse(fs.readFileSync(metadataFilePath));
    const updatedMetadata = existingMetadata;
    results.forEach((item) => {
      updatedMetadata[item.edition] = item;
    });

    writeMetaData(JSON.stringify(updatedMetadata, null, 2));
    Metadata.layerMap();
    pool.terminate();
    writeDnaLog(JSON.stringify([...dnaList], null, 2));
  });

  // update the _dna.json
  const existingDna = getDNA();
  const updatedDnaList = Array.from(existingDna);

  if (!options.nowrite) {
    fs.writeFileSync(
      path.join(dnaFilePath),
      JSON.stringify(updatedDnaList, null, 2)
    );
  }
};

program
  .argument("<ids>")
  .option("-l --layerset <layerset>", "pass layer configuration index")
  .option(
    "-c --config",
    "optional path to confg file. defaults to ../config.js"
  )
  .option(
    "-n, --nowrite",
    "dry run, runs the script without writting any files."
  )
  .option("-d, --debug", "display some debugging")
  .action((ids, options, command) => {
    options.config
      ? console.log(chalk.greenBright(`using config: ${path(options.config)}`))
      : null;

    options.debug
      ? console.log(chalk.green.inverse(`Regenerating #${ids}`))
      : null;

    regenerateItems(ids.split(","), options);
  });

program.parse();
