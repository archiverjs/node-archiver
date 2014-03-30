/**
 * node-archiver
 *
 * Copyright (c) 2012-2014 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */
var inherits = require('util').inherits;
var Transform = require('stream').Transform || require('readable-stream').Transform;

var crc32 = require('buffer-crc32');

function ChecksumStream(options) {
  Transform.call(this, options);

  this.checksum = new Buffer(4);
  this.checksum.writeInt32BE(0, 0);
  this.digest = 0;

  this.rawSize = 0;
}

inherits(ChecksumStream, Transform);

ChecksumStream.prototype._transform = function(chunk, encoding, callback) {
  if (chunk) {
    this.checksum = crc32(chunk, this.checksum);
    this.rawSize += chunk.length;
  }

  callback(null, chunk);
};

ChecksumStream.prototype._flush = function(callback) {
  this.digest = crc32.unsigned(0, this.checksum);

  callback();
};

module.exports = ChecksumStream;