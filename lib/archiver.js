/*
 * node-archiver
 *
 * Copyright (c) 2012 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */

var tarArchiver = require('./archiver/tar');
var zipArchiver = require('./archiver/zip');

var archiver = module.exports = {};

archiver.createTar = function(opt) {
  return new tarArchiver(opt);
};

archiver.createZip = function(opt) {
  return new zipArchiver(opt);
};