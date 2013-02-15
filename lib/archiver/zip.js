/**
 * node-archiver
 *
 * Copyright (c) 2012-2013 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */

var inherits = require('util').inherits;
var zlib = require('zlib');

var Archiver = require('./core');
var headers = require('../headers/zip');
var util = require('../util');

var zipArchiver = module.exports = function(options) {
  Archiver.call(this);

  options = this.options = util.defaults(options, {
    comment: '',
    forceUTC: false,
    zlib: {
      level: 1
    }
  });
};

inherits(zipArchiver, Archiver);

zipArchiver.prototype._buildCentralDirectory = function() {
  var files = this.archiver.files;
  var comment = this.options.comment;

  var cdoffset = this.archiver.pointer;

  var ptr = 0;
  var cdsize = 0;

  var centralDirectoryBuffers = [];
  var centralDirectoryBuffer;

  for (var i = 0; i < files.length; i++) {
    var file = files[i];

    centralDirectoryBuffer = headers.centralHeader.toBuffer(file);
    centralDirectoryBuffers.push(centralDirectoryBuffer);
    ptr += centralDirectoryBuffer.length;
  }

  cdsize = ptr;

  var centralDirectoryFooterData = {
    directoryRecordsDisk: files.length,
    directoryRecords: files.length,
    directorySize: cdsize,
    directoryOffset: cdoffset,
    comment: comment
  };

  var centralDirectoryFooterBuffer = headers.centralFooter.toBuffer(centralDirectoryFooterData);

  centralDirectoryBuffers.push(centralDirectoryFooterBuffer);
  ptr += centralDirectoryFooterBuffer.length;

  return Buffer.concat(centralDirectoryBuffers, ptr);
};

zipArchiver.prototype._processFile = function(source, data, callback) {
  var self = this;
  self.archiver.processing = true;

  var file = util.defaults(data, {
    name: null,
    comment: '',
    date: null,
    mode: null,
    store: false,
    lastModifiedDate: null
  });

  if (typeof file.name !== 'string' || file.name.length === 0) {
    callback(new Error('File name is empty or not a valid string value'));
    return;
  }

  file.name = util.sanitizeFilePath(file.name);
  file.date = util.dateify(file.date);

  if (typeof file.lastModifiedDate !== 'number') {
    file.lastModifiedDate = util.dosDateTime(file.date, self.options.forceUTC);
  }

  file.versionMadeBy = 20;
  file.versionNeededToExtract = 20;
  file.flags = (1<<3) | (1<<11);
  file.compressionMethod = file.store ? 0 : 8;
  file.uncompressedSize = 0;
  file.compressedSize = 0;

  self.archiver.file = file;

  var checksum = util.crc32.createCRC32();
  var deflate;

  file.offset = self.archiver.pointer;
  self._push(headers.file.toBuffer(file));

  function onend() {
    file.crc32 = checksum.digest();

    if (file.store) {
      file.compressedSize = file.uncompressedSize;
    }

    self._push(headers.descriptor.toBuffer(file));

    self.archiver.files.push(file);
    self.archiver.processing = false;

    callback();
    self._processQueue();
  }

  var deflating = false;
  var deflateQueue = [];
  var dataComplete = false;

  function maybeDeflateQueue() {
    if (deflating === false && deflateQueue.length === 0 && dataComplete) {
      onend();
      return;
    } else if (deflating) {
      return;
    }

    deflating = true;

    zlib.deflateRaw(deflateQueue.shift(), function(err, result) {
      if (err) {
        callback(err);
        return;
      }

      file.compressedSize += result.length;
      self._push(result);
      deflating = false;

      maybeDeflateQueue();
    });
  }

  function maybeDeflate(chunk) {
    checksum.update(chunk);

    file.uncompressedSize += chunk.length;

    if (file.store) {
      self._push(chunk);

      if (dataComplete) {
        onend();
      }
    } else {
      deflateQueue.push(chunk);

      maybeDeflateQueue();
    }
  }

  if (Buffer.isBuffer(source)) {
    dataComplete = true;
    maybeDeflate(source);
  } else if (util.isStream(source)) {
    source.on('error', callback);
    source.on('data', maybeDeflate);

    source.on('end', function() {
      dataComplete = true;

      if (file.store === true) {
        onend();
      } else {
        maybeDeflateQueue();
      }
    });

    if (typeof source.resume === 'function') {
      source.resume();
    }
  } else {
    callback(new Error('A valid Stream or Buffer instance is needed as input source'));
  }
};

zipArchiver.prototype._finalize = function() {
  this.archiver.finalize = false;
  this.archiver.finalized = true;

  this._push(this._buildCentralDirectory());
};