/**
 * node-archiver
 *
 * Copyright (c) 2012-2013 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */

require('../../compat/buffer');

var inherits = require('util').inherits;
var Transform = require('stream').Transform || require('readable-stream').Transform;
var PassThrough = require('stream').PassThrough || require('readable-stream').PassThrough;

var util = require('../../util');

var Archiver = module.exports = function(options) {
  options = this.options = util.defaults(options, {
    highWaterMark: 512 * 1024
  });

  Transform.call(this, options);

  this.catchEarlyExitAttached = false;

  this.archiver = {
    needsFinalized: false,
    processing: false,
    finalized: false,
    pointer: 0,
    file: {},
    files: [],
    queue: []
  };
};

inherits(Archiver, Transform);

Archiver.prototype._transform = function(chunk, encoding, callback) {
  if (chunk) {
    this.archiver.pointer += chunk.length;
  }

  this.push(chunk);

  callback();
};

Archiver.prototype._normalizeSource = function(source) {
  if (typeof source === 'string') {
    source = new Buffer(source, 'utf-8');
  } else if (util.isStream(source)) {
    source = this._normalizeStream(source);
  }

  return source;
};

Archiver.prototype._normalizeStream = function(source) {
  var normalized;

  if (!source._readableState) {
    normalized = new PassThrough();
    source.pipe(normalized);

    return normalized;
  }

  return source;
};

Archiver.prototype._catchEarlyExit = function() {
  var earlyExitCheck = function() {
    if (this._readableState.endEmitted === false) {
      throw new Error('Process exited before Archiver could finish emitting data');
    }
  }.bind(this);

  process.once('exit', earlyExitCheck);

  this.once('end', function() {
    process.removeListener('exit', earlyExitCheck);
  });

  this.catchEarlyExitAttached = true;
};

Archiver.prototype._emitErrorCallback = function(err, data) {
  if (err) {
    this.emit('error', err);
  }
};

Archiver.prototype._processFile = function(source, data, callback) {
  callback(new Error('method not implemented'));
};

Archiver.prototype._processQueue = function() {
  if (this.archiver.processing) {
    return;
  }

  if (this.archiver.queue.length === 0) {
    if (this.archiver.finalized) {
      this.archiver.module.finalize();
    } else if (this.archiver.needsFinalized) {
      this._finalize();
    }

    return;
  }

  var next = this.archiver.queue.shift();
  var nextCallback = function(err, file) {
    next.callback(err);

    if (!err) {
      this.archiver.files.push(file);
      this.archiver.processing = false;
      this._processQueue();
    }
  }.bind(this);

  this.archiver.processing = true;

  this.archiver.module.append(next.source, next.data, nextCallback);
};

Archiver.prototype._finalize = function() {
  this.archiver.needsFinalized = false;
  this.archiver.finalized = true;

  this._processQueue();
};

Archiver.prototype._normalizeFileData = function(data) {
  data = util.defaults(data, {
    name: null,
    date: null
  });

  data.name = util.sanitizeFilePath(data.name);
  data.date = util.dateify(data.date);

  return data;
};

Archiver.prototype.registerModule = function(Module) {
  this.archiver.module = new Module(this.options);

  this.archiver.module.pipe(this);
};

Archiver.prototype.append = function(source, data, callback) {
  data = this._normalizeFileData(data);

  if (!this.catchEarlyExitAttached) {
    this._catchEarlyExit();
  }

  if (typeof callback !== 'function') {
    callback = this._emitErrorCallback.bind(this);
  }

  if (typeof data.name !== 'string' || data.name.length === 0) {
    callback(new Error('File name is empty or not a valid string value'));
    return this;
  }

  source = this._normalizeSource(source);

  if (Buffer.isBuffer(source)) {
    data.sourceType = 'buffer';
  } else if (util.isStream(source)) {
    data.sourceType = 'stream';
  } else {
    callback(new Error('A valid Stream or Buffer instance is required as input source'));
    return this;
  }

  this.archiver.queue.push({
    data: data,
    source: source,
    callback: callback
  });

  this._processQueue();

  return this;
};

Archiver.prototype.addFile = Archiver.prototype.append;

Archiver.prototype.finalize = function(callback) {
  if (typeof callback === 'function') {
    this.once('end', function() {
      callback(null, this.archiver.pointer);
    }.bind(this));
  }

  this.archiver.needsFinalized = true;

  this._processQueue();

  return this;
};