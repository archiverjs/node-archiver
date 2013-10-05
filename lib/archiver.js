/**
 * node-archiver
 *
 * Copyright (c) 2012-2013 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */
var ArchiverCore = require('./modules/core');
var archiverFormats = {};

var archiver = module.exports = function(format, options) {
  return archiver.create(format, options);
};

archiver.create = function(format, options) {
  if (archiverFormats[format]) {
    var inst = new ArchiverCore(options);
    inst.registerModule(archiverFormats[format]);

    return inst;
  } else {
    throw new Error('Unknown archive format: ' + format);
  }
};

function registerFormat(format, module) {
  if (!archiverFormats[format]) {
    if (module && typeof module === 'function') {
      archiverFormats[format] = module;

      // backwards compat
      var compatName = 'create' + format.charAt(0).toUpperCase() + format.slice(1);
      archiver[compatName] = function(options) {
        return archiver.create(format, options);
      };
    } else {
      throw new Error('Archive format module invalid: ' + format);
    }
  } else {
    throw new Error('Archive format already registered: ' + format);
  }
}

registerFormat('zip', require('./modules/zip'));
registerFormat('tar', require('./modules/tar'));