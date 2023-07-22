import chalk from "chalk";
import fs from "fs";
import path from "path";
import directoryTree from "directory-tree";
import { exec } from "child_process";
import { stdout } from "process";
import Parser from "./Parser.js";
import {
  extraAttributes,
  buildDir,
  description,
  extraMetadata,
  emptyLayerName,
  baseUri,
  outputJPEG,
  hashImages,
  skipTrait,
} from "../../config.js";

export default {
  attributesList: [],
  metadataList: [],

  addAttributes(_element) {
    if (skipTrait.includes(Parser.cleanName(_element.layer.trait))) {
      return;
    }

    const selectedElement = _element.layer;
    if (selectedElement.traitValue == "None") {
      return;
    }
    const layerAttributes = {
      trait_type: Parser.cleanName(_element.layer.trait),
      value: selectedElement.traitValue,
      ...(_element.layer.display_type !== undefined && {
        display_type: _element.layer.display_type,
      }),
    };
    if (
      this.attributesList.some(
        (attr) =>
          attr.trait_type === Parser.cleanName(layerAttributes.trait_type)
      )
    ) {
      return;
    }
    this.attributesList.push(layerAttributes);
  },

  addMetadata(_dna, token, _prefixData) {
    let dateTime = Date.now();
    const _edition = token.genOrder;
    const {
      _prefix,
      _offset,
      _imageHash,
      layerConfigIndex,
      _globalAttributes,
    } = _prefixData;

    const combinedAttrs = [...this.attributesList, ...extraAttributes()];
    const cleanedAttrs = combinedAttrs.reduce((acc, current) => {
      const x = acc.find((item) => item.trait_type === current.trait_type);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    let tempMetadata = {
      name: `${_prefix ? _prefix + " " : ""}#${token.id - _offset}`,
      description,
      image: `${baseUri}/${_edition}${outputJPEG ? ".jpg" : ".png"}`,
      ...(hashImages === true && { imageHash: _imageHash }),
      edition: _edition,
      date: dateTime,
      ...extraMetadata,
      attributes: [..._globalAttributes, ...cleanedAttrs],
      compiler: "NFTChef 2.0.0 Beta",
    };
    this.metadataList.push(tempMetadata);
    this.attributesList = [];
    return tempMetadata;
  },

  layerMap(options) {
    console.log(chalk.green("\n Saving layers folder Map..."), "\n");

    const layersDir = options?.layersDir ?? "layers";
    const layersPath = path.join(process.cwd(), layersDir);

    console.log({ layersPath });

    function writeWithTree() {
      return new Promise((resolve, reject) => {
        exec(`tree '${layersPath}'`, (error, stdout, stderr) => {
          if (!error) {
            resolve(stdout);
          } else {
            reject(error);
          }
        });
      });
    }

    writeWithTree()
      .then((treedata) => {
        fs.writeFileSync(path.join(buildDir, "layers.txt"), treedata);
      })
      .catch((e) => {
        //caught tree
        const tree = directoryTree(layersPath);
        fs.writeFileSync(
          path.join(buildDir, "layers.json"),
          JSON.stringify(tree, null, 2)
        );
        console.log("tree not installed, saving as JSON");
      })
      .finally(() => {
        console.log(chalk.bgGreenBright("Saved Layers diriectory tree."));
      });
  },
};
