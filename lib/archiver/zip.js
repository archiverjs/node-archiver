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

function DeflateRawChecksum(options) {
  zlib.DeflateRaw.call(this, options);

  this.checksum = util.crc32.createCRC32();
  this.digest = null;

  this.rawSize = 0;

  this.on('end', function() {
    this.digest = this.checksum.digest();
  });
}

inherits(DeflateRawChecksum, zlib.DeflateRaw);

DeflateRawChecksum.prototype.write = function(chunk, cb) {
  zlib.DeflateRaw.prototype.write.call(this, chunk, cb);

  if (chunk) {
    this.checksum.update(chunk);
    this.rawSize += chunk.length;
  }
};

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

  if (file.store === false) {
    deflate = new DeflateRawChecksum(self.options.zlib);

    deflate.on('data', function(chunk) {
      file.compressedSize += chunk.length;
      self._push(chunk);
    });

    deflate.on('end', function() {
      file.crc32 = deflate.digest;
      file.uncompressedSize = deflate.rawSize;
      onend();
    });
  }

  function onend() {
    if (file.store) {
      file.crc32 = checksum.digest();
      file.compressedSize = file.uncompressedSize;
    }

    self._push(headers.descriptor.toBuffer(file));

    self.archiver.files.push(file);
    self.archiver.processing = false;

    callback();
    self._processQueue();
  }

  if (Buffer.isBuffer(source)) {
    if (file.store) {
      self._push(source);
      onend();
    } else {
      deflate.write(source);
      deflate.end();
    }
  } else if (util.isStream(source)) {
    if (file.store) {
      source.on('error', callback);

      source.on('data', function(chunk) {
        self._push(source);
      });

      source.on('end', onend);
    }

    if (typeof source.resume === 'function') {
      source.resume();
    }

    if (file.store === false) {
      source.pipe(deflate);
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