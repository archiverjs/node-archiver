import Archiver from "./lib/core.js";
import zip from "./lib/plugins/zip.js";
import tar from "./lib/plugins/tar.js";
import json from "./lib/plugins/json.js";

var formats = {};
/**
 * Dispenses a new Archiver instance.
 *
 * @constructor
 * @param  {String} format The archive format to use.
 * @param  {Object} options See [Archiver]{@link Archiver}
 * @return {Archiver}
 */
var vending = function (format, options) {
  return vending.create(format, options);
};
/**
 * Creates a new Archiver instance.
 *
 * @param  {String} format The archive format to use.
 * @param  {Object} options See [Archiver]{@link Archiver}
 * @return {Archiver}
 */
vending.create = function (format, options) {
  if (formats[format]) {
    var instance = new Archiver(format, options);
    instance.setFormat(format);
    instance.setModule(new formats[format](options));
    return instance;
  } else {
    throw new Error("create(" + format + "): format not registered");
  }
};
/**
 * Registers a format for use with archiver.
 *
 * @param  {String} format The name of the format.
 * @param  {Function} module The function for archiver to interact with.
 * @return void
 */
vending.registerFormat = function (format, module) {
  if (formats[format]) {
    throw new Error("register(" + format + "): format already registered");
  }
  if (typeof module !== "function") {
    throw new Error("register(" + format + "): format module invalid");
  }
  if (
    typeof module.prototype.append !== "function" ||
    typeof module.prototype.finalize !== "function"
  ) {
    throw new Error("register(" + format + "): format module missing methods");
  }
  formats[format] = module;
};
/**
 * Check if the format is already registered.
 *
 * @param {String} format the name of the format.
 * @return boolean
 */
vending.isRegisteredFormat = function (format) {
  if (formats[format]) {
    return true;
  }
  return false;
};
vending.registerFormat("zip", zip);
vending.registerFormat("tar", tar);
vending.registerFormat("json", json);
export default vending;
