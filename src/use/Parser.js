// TODO: refactor: remove main.js coupling
import { getElementOptions } from "../main.js";
import * as Config from "../../config.js";

export default {
  zflag: /(z-?\d*,)/,

  getRarityWeight(_path, rarityDelimiter) {
    // check if there is an extension, if not, consider it a directory
    const exp = new RegExp(`${rarityDelimiter}(\\d*)`, "g");
    const weight = exp.exec(_path);
    const weightNumber = weight ? Number(weight[1]) : -1;

    if (weightNumber < 0 || isNaN(weightNumber)) {
      return "required";
    }
    return weightNumber;
  },
  cleanDna(_str) {
    var dna = _str.split(":").shift();
    return dna;
  },

  cleanName(_str, rarityDelimiter, titlecase = false) {
    const hasZ = this.zflag.test(_str);
    const extensionRegex = /\.[0-9a-zA-Z]+$/;
    const queryRegex = /\?(.*)/;
    const valueFlagRegex = /_v$/;

    let cleanedName = _str.replace(this.zflag, "");
    const hasExtension = extensionRegex.test(cleanedName);
    cleanedName = cleanedName.replace(extensionRegex, "");
    cleanedName = cleanedName.replace(valueFlagRegex, "");
    cleanedName = cleanedName.replace(queryRegex, "");
    cleanedName = cleanedName.split(rarityDelimiter)[0];
    if (titlecase) {
      cleanedName = cleanedName.replace(/\b\w+/g, (txt) => {
        return `${txt.charAt(0).toUpperCase()}${txt.substr(1).toLowerCase()}`;
      });
    }
    return cleanedName;
  },

  parseQueryString(filename, layer, sublayer) {
    const extensionRegex = /\.[0-9a-zA-Z]+$/;
    const queryRegex = /\?(.*)/;
    const valueFlagRegex = /_v$/;

    const sanitized = filename
      .replace(extensionRegex, "")
      .replace(valueFlagRegex, "")
      .split(Config.rarityDelimiter)[0];

    const querystring = queryRegex.exec(sanitized);
    if (!querystring) {
      return getElementOptions(layer, sublayer);
    }
    const layerstyles = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return {
      blendmode: layerstyles.blend
        ? layerstyles.blend
        : getElementOptions(layer, sublayer).blendmode,
      opacity: layerstyles.opacity
        ? layerstyles.opacity / 100
        : getElementOptions(layer, sublayer).opacity,
    };
  },

  parseValueFlag(str) {
    const regex = /_v(\.[0-9a-zA-Z]+)?$/;
    console.log(`test str`, regex.test(str));
    return regex.test(str);
  },

  parseZIndex(str) {
    const z = this.zflag.exec(str);
    return z ? parseInt(z[0].match(/-?\d+/)[0]) : null;
  },

  /**
   * 2022.11.12 UNUSED.
   * Cleaning function for DNA strings. When DNA strings include an option, it
   * is added to the filename with a ?setting=value query string. It needs to be
   * removed to properly access the file name before Drawing.
   *
   * @param {String} _dna The entire newDNA string
   * @returns Cleaned DNA string without querystring parameters.
   */
  removeQueryStrings(_dna) {
    const query = /(\?.*$)/;
    return _dna.replace(query, "");
  },
};
