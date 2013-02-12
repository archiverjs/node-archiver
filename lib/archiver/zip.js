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
  var self = this;

  Archiver.call(self);

  options = self.options = util.lo.defaults(options || {}, {
    comment: '',
    forceUTC: false
  });
};

inherits(zipArchiver, Archiver);

zipArchiver.prototype._buildLocalFileHeader = function() {
  var self = this;

  return headers.file.toBuffer(self.archiver.file);
};

zipArchiver.prototype._buildDataDescriptorHeader = function() {
  var self = this;

  return headers.descriptor.toBuffer(self.archiver.file);
};

zipArchiver.prototype._buildCentralDirectory = function() {
  var self = this;
  var cdoffset = self.archiver.pointer;

  var ptr = 0;
  var cdsize = 0;

  var centralDirectoryBuffers = [];
  var centralDirectoryBuffer;

  for (var i = 0; i < self.archiver.files.length; i++) {
    var file = self.archiver.files[i];

    centralDirectoryBuffer = headers.centralHeader.toBuffer(file);
    centralDirectoryBuffers.push(centralDirectoryBuffer);
    ptr += centralDirectoryBuffer.length;
  }

  cdsize = ptr;

  var centralDirectoryFooterData = {
    directoryRecordsDisk: self.archiver.files.length,
    directoryRecords: self.archiver.files.length,
    directorySize: cdsize,
    directoryOffset: cdoffset,
    comment: self.options.comment
  };

  var centralDirectoryFooterBuffer = headers.centralFooter.toBuffer(centralDirectoryFooterData);

  centralDirectoryBuffers.push(centralDirectoryFooterBuffer);
  ptr += centralDirectoryFooterBuffer.length;

  return Buffer.concat(centralDirectoryBuffers, ptr);
};

zipArchiver.prototype._processFile = function(source, data, callback) {
  var self = this;
  self.archiver.processing = true;

  var file = util.lo.defaults(data || {}, {
    name: null,
    comment: '',
    date: null,
    mode: null,
    store: false,
    lastModifiedDate: null
  });

  if ('' == file.name) {
    callback(new Error('File name is empty or not a valid string value'));
    return;
  }

  file.name = util.sanitizeFilePath(file.name);
  file.date = util.dateify(file.date);

  if ('number' != typeof file.lastModifiedDate) {
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

  file.offset = self.archiver.pointer;
  self._push(self._buildLocalFileHeader());

  function maybeDeflate(chunk, cb) {
    cb = cb || function(){};
    checksum.update(chunk);

    file.uncompressedSize += chunk.length;

    if (file.store) {
      self._push(chunk);

      cb();
    } else {
      zlib.deflateRaw(chunk, function(err, result) {
        if (err) {
          onerror(err);
          return;
        }

        self._push(result);
        file.compressedSize += result.length;

        cb();
      });
    }
  }

  function onerror(err) {
    callback(err);
  }

  function onend() {
    file.crc32 = checksum.digest();

    if (file.store) {
      file.compressedSize = file.uncompressedSize;
    }

    self._push(self._buildDataDescriptorHeader());

    self.archiver.files.push(file);
    self.archiver.processing = false;

    callback();
    self._processQueue();
  }

  if (Buffer.isBuffer(source)) {
    maybeDeflate(source, onend);
  } else if (util.isStream(source)) {
    source.on('error', onerror);
    source.on('data', maybeDeflate);
    source.on('end', onend);

    if (typeof source.resume === 'function') {
      source.resume();
    }
  } else {
    callback(new Error('A valid Stream or Buffer instance is needed as input source'));
  }
};

zipArchiver.prototype._finalize = function() {
  var self = this;

  var centralDirectoryBuffer = self._buildCentralDirectory();

  self.archiver.finalize = false;
  self.archiver.finalized = true;

  self._push(centralDirectoryBuffer);
};
