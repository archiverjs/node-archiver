/**
 * node-archiver
 *
 * Copyright (c) 2012-2013 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */

var inherits = require('util').inherits;

var Archiver = require('./core');
var headers = require('../headers/tar');
var util = require('../util');

var ArchiverTar = module.exports = function(options) {
  Archiver.call(this, options);

  options = this.options = util.defaults(options, {
    recordSize: 512,
    recordsPerBlock: 20
  });

  this.recordSize = options.recordSize;
  this.blockSize = options.recordsPerBlock * options.recordSize;
};

inherits(ArchiverTar, Archiver);

ArchiverTar.prototype._flush = function(callback) {
  var endBytes = this.blockSize - (this.archiver.pointer % this.blockSize);

  this._push(util.cleanBuffer(endBytes));

  callback();
};

ArchiverTar.prototype._normalizeFileData = function(data) {
  data = util.defaults(data, {
    name: null,
    date: null
  });

  data.name = util.sanitizeFilePath(data.name);
  data.date = util.dateify(data.date);
  data.size = 0;

  return data;
};

ArchiverTar.prototype._processFile = function(source, data, callback) {
  var self = this;
  self.archiver.processing = true;

  var file = self.archiver.file = data;

  if (file.name.length > 255) {
    callback(new Error('Filename "' + file.name + '" is too long even with prefix support [' + file.name.length + '/255]'));
    return;
  }

  file.offset = self.archiver.pointer;

  var sourceBuffer;
  var extraBytes;

  function onend() {
    file.size = sourceBuffer.length;
    extraBytes = self.recordSize - (sourceBuffer.length % self.recordSize || self.recordSize);

    self._push(headers.encode('file', file));
    self._push(sourceBuffer);
    self._push(util.cleanBuffer(extraBytes));

    self.archiver.files.push(file);
    self.archiver.processing = false;

    callback();
    self._processQueue();
  }

  if (Buffer.isBuffer(source)) {
    sourceBuffer = source;
    onend();
  } else if (util.isStream(source)) {
    util.collectStream(source, function(err, buffer) {
      if (err) {
        callback(err);
        return;
      }

      sourceBuffer = buffer;
      onend();
    });
  } else {
    callback(new Error('A valid Stream or Buffer instance is needed as input source'));
  }
};