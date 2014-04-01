/**
 * node-archiver
 *
 * Copyright (c) 2012-2014 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */
var inherits = require('util').inherits;
var Transform = require('stream').Transform || require('readable-stream').Transform;
var zlib = require('zlib');

var headers = require('./headers');
var util = require('../../util');

var Tar = module.exports = function(options) {
  options = this.options = util.defaults(options, {
    recordSize: 512,
    recordsPerBlock: 20,
    gzip: false
  });

  if (typeof options.gzipOptions !== 'object') {
    options.gzipOptions = {};
  }

  Transform.call(this, options);

  this.supports = {
    directory: true
  };

  this.compressor = false;
  this.offset = 0;
  this.files = [];

  this.recordSize = options.recordSize;
  this.blockSize = options.recordsPerBlock * options.recordSize;

  if (options.gzip) {
    this.compressor = zlib.createGzip(options.gzipOptions);
    this.compressor.on('error', this._onCompressorError.bind(this));
  }
};

inherits(Tar, Transform);

Tar.prototype._onCompressorError = function(err) {
  this.emit('error', err);
};

Tar.prototype._transform = function(chunk, encoding, callback) {
  callback(null, chunk);
};

Tar.prototype._writeEndBytes = function() {
  var endBytes = this.blockSize - (this.offset % this.blockSize);

  this.write(util.cleanBuffer(endBytes));
};

Tar.prototype.append = function(source, data, callback) {
  var self = this;

  data.offset = self.offset;

  if (data.name.length > 255) {
    callback(new Error('entry name "' + data.name + '" is too long even with prefix support [' + data.name.length + '/255]'));
    return;
  }

  function onend(err, sourceBuffer) {
    if (err) {
      callback(err);
      return;
    }

    sourceBuffer = sourceBuffer || false;
    data.size = sourceBuffer.length || 0;

    var extraBytes = self.recordSize - (data.size % self.recordSize || self.recordSize);

    self.write(headers.encode('file', data));

    if (data.size > 0) {
      self.write(sourceBuffer);
    }

    self.write(util.cleanBuffer(extraBytes));
    self.files.push(data);

    callback(null, data);
  }

  if (data.sourceType === 'buffer') {
    onend(null, source);
  } else if (data.sourceType === 'stream') {
    util.collectStream(source, onend);
  }
};

Tar.prototype.finalize = function(callback) {
  callback = callback || function() {};

  this._writeEndBytes();

  this.end();

  callback();
};

Tar.prototype.write = function(chunk, cb) {
  if (chunk) {
    this.offset += chunk.length;
  }

  return Transform.prototype.write.call(this, chunk, cb);
};

Tar.prototype.pipe = function(destination, options) {
  if (this.compressor) {
    return Transform.prototype.pipe.call(this, this.compressor).pipe(destination, options);
  } else {
    return Transform.prototype.pipe.call(this, destination, options);
  }
};