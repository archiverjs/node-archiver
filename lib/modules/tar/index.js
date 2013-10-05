/**
 * node-archiver
 *
 * Copyright (c) 2012-2013 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */

var inherits = require('util').inherits;
var Transform = require('stream').Transform || require('readable-stream').Transform;

var headers = require('./headers');
var util = require('../../util');

var Tar = module.exports = function(options) {
  options = this.options = util.defaults(options, {
    recordSize: 512,
    recordsPerBlock: 20
  });

  Transform.call(this, options);

  this.pointer = 0;
  this.files = [];

  this.recordSize = options.recordSize;
  this.blockSize = options.recordsPerBlock * options.recordSize;
};

inherits(Tar, Transform);

Tar.prototype._transform = function(chunk, encoding, callback) {
  if (chunk) {
    this.pointer += chunk.length;
  }

  this.push(chunk);

  callback();
};

Tar.prototype.finalize = function(callback) {
  callback = callback || function() {};

  var endBytes = this.blockSize - (this.pointer % this.blockSize);

  this.write(util.cleanBuffer(endBytes));

  this.end();

  callback();
};


Tar.prototype.append = function(source, data, callback) {
  var self = this;

  var file = data;
  file.offset = self.pointer;

  if (file.name.length > 255) {
    callback(new Error('Filename "' + file.name + '" is too long even with prefix support [' + file.name.length + '/255]'));
    return;
  }

  function onend(err, sourceBuffer) {
    if (err) {
      callback(err);
      return;
    }

    sourceBuffer = sourceBuffer || false;
    file.size = sourceBuffer.length || 0;

    var extraBytes = self.recordSize - (file.size % self.recordSize || self.recordSize);

    self.write(headers.encode('file', file));

    if (file.size > 0) {
      self.write(sourceBuffer);
    }

    self.write(util.cleanBuffer(extraBytes));

    callback(null, file);
  }

  if (file.sourceType === 'buffer') {
    onend(null, source);
  } else if (file.sourceType === 'stream') {
    util.collectStream(source, onend);
  }
};