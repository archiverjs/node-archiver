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

var tarArchiver = module.exports = function(options) {
  var self = this;

  Archiver.call(self);

  options = options || {};

  options = self.options = util.lo.defaults(options, {
    recordSize: 512,
    recordsPerBlock: 20
  });

  self.recordSize = options.recordSize;
  self.blockSize = options.recordsPerBlock * self.recordSize;
};

inherits(tarArchiver, Archiver);

tarArchiver.prototype._buildLocalFileHeader = function() {
  var self = this;

  return headers.file.toBuffer(self.archiver.file);
};

tarArchiver.prototype._buildFileExtraBytes = function() {
  var self = this;
  var extraBytes = self.recordSize - (self.archiver.file.sizeOriginal % self.recordSize || self.recordSize);

  return util.cleanBuffer(extraBytes);
};

tarArchiver.prototype._processFile = function(source, data, callback) {
  var self = this;
  self.archiver.processing = true;

  var file = util.lo.defaults(data || {}, {
    name: null,
    comment: '',
    date: null,
    gid: 0,
    mode: null,
    mtime: null,
    uid: 0
  });

  if ('' == file.name) {
    callback(new Error('File name is empty or not a valid string value'));
    return;
  }

  file.name = util.sanitizeFilePath(file.name);
  file.type = '0';
  file.size = 0;

  file.date = util.dateify(file.date);

  if ('number' != typeof file.mtime) {
    file.mtime = util.octalDateTime(file.date);
  }

  file.gid = 'number' == typeof file.gid ? file.gid : 0;
  file.mode ='number' == typeof file.mode ? file.mode : parseInt('777', 8) & 0xfff;
  file.uid = 'number' == typeof file.uid ? file.uid : 0;

  file.mode = util.padNumber(file.mode, 7);
  file.uid = util.padNumber(file.uid, 7);
  file.gid = util.padNumber(file.gid, 7);
  file.mtime = util.padNumber(file.mtime, 11);

  self.archiver.file = file;

  var sourceBuffer;
  var fileBuffer;

  var fileHeaderBuffer;
  var extraBytesBuffer;

  file.offset = self.archiver.pointer;

  function onend(err) {
    if (err) {
      callback(err);
      return;
    }

    file.size = util.padNumber(sourceBuffer.length, 11);
    file.sizeOriginal = sourceBuffer.length;

    fileHeaderBuffer = self._buildLocalFileHeader();
    self._push(fileHeaderBuffer);

    self._push(sourceBuffer);

    extraBytesBuffer = self._buildFileExtraBytes();
    self._push(extraBytesBuffer);

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

tarArchiver.prototype._finalize = function() {
  var self = this;

  var endBytes = self.blockSize - (self.archiver.pointer % self.blockSize);
  var endBytesBuffer = util.cleanBuffer(endBytes);

  self.archiver.finalize = false;
  self.archiver.finalized = true;

  self._push(endBytesBuffer);
};
