/**
 * node-archiver
 *
 * Copyright (c) 2015 Chris Talkington.
 * Licensed under the MIT license.
 * https://github.com/archiverjs/node-archiver/blob/master/LICENSE
 */

var Archiver = require('./lib/core');

module.exports = Archiver;

module.exports.create = function(format, options) {
  return new Archiver(format, options);
};

module.exports.registerFormat = function(format, module) {
  throw new Error('registerFormat is no longer supported.');
};