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
var DeflateRawChecksum = require('../../util/DeflateRawChecksum');
var ChecksumStream = require('../../util/ChecksumStream');

var Zip = module.exports = function(options) {
  options = this.options = util.defaults(options, {
    comment: '',
    forceUTC: false,
    zlib: {
      level: 1
    }
  });

  Transform.call(this, options);

  if (options.level && options.level >= 0) {
    options.zlib.level = options.level;
    delete options.level;
  }

  this.pointer = 0;
  this.files = [];
};

inherits(Zip, Transform);

Zip.prototype._transform = function(chunk, encoding, callback) {
  if (chunk) {
    this.pointer += chunk.length;
  }

  this.push(chunk);

  callback();
};

Zip.prototype._buildCentralDirectory = function() {
  var files = this.files;
  var comment = this.options.comment;
  var cdoffset = this.pointer;
  var cdsize = 0;

  var centralDirectoryBuffer;
  for (var i = 0; i < files.length; i++) {
    var file = files[i];

    centralDirectoryBuffer = headers.encode('centralDirectory', file);
    this.write(centralDirectoryBuffer);
    cdsize += centralDirectoryBuffer.length;
  }

  var centralDirectoryFooterData = {
    directoryRecordsDisk: files.length,
    directoryRecords: files.length,
    centralDirectorySize: cdsize,
    centralDirectoryOffset: cdoffset,
    comment: comment
  };

  this.write(headers.encode('centralFooter', centralDirectoryFooterData));
};

Zip.prototype._normalizeFileData = function(data) {
  data = util.defaults(data, {
    name: null,
    date: null,
    store: false,
    comment: ''
  });

  data.name = util.sanitizeFilePath(data.name);
  data.date = util.dateify(data.date);

  if (typeof data.lastModifiedDate !== 'number') {
    data.lastModifiedDate = util.dosDateTime(data.date, this.options.forceUTC);
  }

  if (this.options.zlib && this.options.zlib.level === 0) {
    data.store = true;
  }

  data.flags = (1<<3) | (1<<11);
  data.compressionMethod = data.store ? 0 : 8;
  data.uncompressedSize = 0;
  data.compressedSize = 0;

  return data;
};

Zip.prototype.finalize = function(callback) {
  callback = callback || function() {};

  this._buildCentralDirectory();
  this.end();

  callback();
};

Zip.prototype.append = function(source, data, callback) {
  var self = this;
  var file;

  data = file = self._normalizeFileData(data);
  file.offset = self.pointer;

  self.files.push(file);
  self.write(headers.encode('file', file));

  var deflate;
  var checksumr;

  function onend() {
    self.write(headers.encode('fileDescriptor', file));

    callback(null, file);
  }

  if (file.store === false) {
    deflate = new DeflateRawChecksum(self.options.zlib);

    deflate.on('error', callback);

    deflate.on('end', function() {
      file.crc32 = deflate.digest;
      file.uncompressedSize = deflate.rawSize;
      file.compressedSize = deflate.compressedSize;

      onend();
    });

    // archiver and deflate are having disagreements
    // over piping at this point in time so archiver
    // had to be the adult and move on with hopes of
    // making up in the future :) - 20130818
    // deflate.pipe(self, { end: false });

    deflate.on('data', function(data) {
      self.write(data);
    });
  } else {
    checksumr = new ChecksumStream();

    checksumr.on('error', callback);

    checksumr.on('end', function () {
      file.uncompressedSize = checksumr.rawSize;
      file.compressedSize = checksumr.rawSize;
      file.crc32 = checksumr.digest;

      onend();
    });

    checksumr.pipe(self, { end: false });
  }

  if (file.sourceType === 'buffer') {
    if (file.store) {
      file.uncompressedSize += source.length;
      file.compressedSize = file.uncompressedSize;
      file.crc32 = util.crc32(source).digest();

      self.write(source);
      onend();
    } else {
      deflate.end(source);
    }
  } else if (file.sourceType === 'stream') {
    if (file.store) {
      source.pipe(checksumr);
    } else {
      source.pipe(deflate);
    }
  }
};