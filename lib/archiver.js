/*
 * node-archiver
 *
 * Copyright (c) 2012 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */

var zipArchiver = require('./archiver/zip');

exports.createZip = function(opt) {
  return new zipArchiver(opt);
};