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
var Queue = require('./queue');

var Archiver = module.exports = function(options) {
  options = this.options = util.defaults(options, {
    highWaterMark: 512 * 1024
  });

  Transform.call(this, options);

  this.catchEarlyExitAttached = false;
  this.moduleOutputPiped = false;

  this.archiver = {
    pointer: 0,
    file: {},
    files: [],
    module: false
  };

  this.queue = new Queue();
  this.queue.on('entry', this._onQueueEntry.bind(this));
  this.queue.on('end', this._onQueueEnd.bind(this));
};

inherits(Archiver, Transform);

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

Archiver.prototype._normalizeFileData = function(data) {
  data = util.defaults(data, {
    name: null,
    date: null
  });

  data.name = util.sanitizeFilePath(data.name);
  data.date = util.dateify(data.date);

  return data;
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

Archiver.prototype._onQueueEnd = function() {
  this.archiver.module.finalize();
};

Archiver.prototype._onQueueEntry = function(entry, queueCallback) {
  var nextCallback = function(err, file) {
    entry.callback(err);

    if (!err) {
      this.archiver.files.push(file);
      queueCallback();
    }
  }.bind(this);

  this.archiver.module.append(entry.source, entry.data, nextCallback);
};

Archiver.prototype._pipeModuleOutput = function() {
  this.archiver.module.pipe(this);

  this.moduleOutputPiped = true;
};

Archiver.prototype._processFile = function(source, data, callback) {
  callback(new Error('method not implemented'));
};

Archiver.prototype._transform = function(chunk, encoding, callback) {
  if (chunk) {
    this.archiver.pointer += chunk.length;
  }

  callback(null, chunk);
};

Archiver.prototype.append = function(source, data, callback) {
  data = this._normalizeFileData(data);

  if (!this.catchEarlyExitAttached) {
    this._catchEarlyExit();
  }

  if (!this.moduleOutputPiped) {
    if (!this.archiver.module) {
      callback(new Error('Archiver module not registered'));
      return this;
    }

    this._pipeModuleOutput();
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

  this.queue.add({
    data: data,
    source: source,
    callback: callback
  });

  return this;
};

Archiver.prototype.bulk = function(mapping) {
  if (!util.isArray(mapping)) {
    return this;
  }

  var self = this;
  var files = util.normalizeFilesArray(mapping);

  files.forEach(function(file){
    var isExpandedPair = file.orig.expand || false;
    var data = util.defaults({}, file.data);
    var src = file.src.filter(function(f) {
      return util.file.isFile(f);
    });

    src.forEach(function(filepath) {
      data.name = isExpandedPair ? file.dest : util.unixifyPath(file.dest || '', filepath);

      self.append(util.lazyReadStream(filepath), data);
    });
  });

  return this;
};

Archiver.prototype.file = function(filepath, data, callback) {
  filepath = String(filepath);

  if (typeof callback !== 'function') {
    callback = this._emitErrorCallback.bind(this);
  }

  if (util.file.exists(filepath)) {
    data = util.defaults(data, {
      name: util.sanitizeFilePath(filepath)
    });

    this.append(util.lazyReadStream(filepath), data, callback);
  } else {
    callback(new Error('Invalid file: ' + filepath));
  }

  return this;
};

Archiver.prototype.finalize = function(callback) {
  if (typeof callback === 'function') {
    this.once('end', function() {
      callback(null, this.archiver.pointer);
    }.bind(this));
  }

  this.queue.close();

  return this;
};

Archiver.prototype.setModule = function(module) {
  this.archiver.module = module;
};