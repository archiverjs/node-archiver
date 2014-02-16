/**
 * node-archiver
 *
 * Copyright (c) 2012-2014 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */
var inherits = require('util').inherits;
var Transform = require('stream').Transform || require('readable-stream').Transform;
var PassThrough = require('stream').PassThrough || require('readable-stream').PassThrough;

var util = require('../../util');
var Queue = require('./queue');

var Archiver = module.exports = function(options) {
  options = this.options = util.defaults(options, {
    highWaterMark: 1024 * 1024
  });

  Transform.call(this, options);

  this._moduleOutputPiped = false;

  this._pointer = 0;
  this._files = [];
  this._module = false;

  this._queue = new Queue();
  this._queue.on('error', this._onQueueError.bind(this));
  this._queue.on('entry', this._onQueueEntry.bind(this));
  this._queue.once('end', this._onQueueEnd.bind(this));
};

inherits(Archiver, Transform);

Archiver.prototype._normalizeFileData = function(data) {
  data = util.defaults(data, {
    name: null,
    date: null
  });

  if (data.name) {
    data.name = util.sanitizePath(data.name);
  }

  data.date = util.dateify(data.date);

  return data;
};

Archiver.prototype._normalizeSource = function(source) {
  if (typeof source === 'string') {
    return new Buffer(source);
  } else if (util.isStream(source) && !source._readableState) {
    var normalized = new PassThrough();
    source.pipe(normalized);

    return normalized;
  }

  return source;
};

Archiver.prototype._onQueueEnd = function() {
  if (typeof this._module.finalize === 'function') {
    this._module.finalize();
  } else if (typeof this._module.end === 'function') {
    this._module.end();
  } else {
    this.emit('error', new Error('format module missing finalize and end method'));
  }
};

Archiver.prototype._onQueueEntry = function(entry) {
  var nextCallback = function(err, file) {
    if (err) {
      this.emit('error', err);
      return;
    }

    file = file || entry.data;

    this.emit('entry', file);
    this._files.push(file);
    this._queue.next();
  }.bind(this);

  this._module.append(entry.source, entry.data, nextCallback);
};

Archiver.prototype._onQueueError = function(err) {
  this.emit('error', err);
};

Archiver.prototype._pipeModuleOutput = function() {
  this._module.pipe(this);

  this._moduleOutputPiped = true;
};

Archiver.prototype._processFile = function(source, data, callback) {
  this.emit('error', new Error('method not implemented'));
};

Archiver.prototype._transform = function(chunk, encoding, callback) {
  if (chunk) {
    this._pointer += chunk.length;
  }

  callback(null, chunk);
};

Archiver.prototype.append = function(source, data) {
  data = this._normalizeFileData(data);

  if (typeof data.name !== 'string' || data.name.length === 0) {
    this.emit('error', new Error('filename must be a non-empty string value'));
    return this;
  }

  source = this._normalizeSource(source);

  if (Buffer.isBuffer(source)) {
    data.sourceType = 'buffer';
  } else if (util.isStream(source)) {
    data.sourceType = 'stream';
  } else {
    this.emit('error', new Error('input source must be valid Stream or Buffer instance'));
    return this;
  }

  this._queue.add({
    data: data,
    source: source
  });

  return this;
};

Archiver.prototype.bulk = function(mappings) {
  if (!Array.isArray(mappings)) {
    mappings = [mappings];
  }

  var self = this;
  var files = util.normalizeFilesArray(mappings);

  files.forEach(function(file){
    var isExpandedPair = file.orig.expand || false;
    var data = file.data || {};
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

Archiver.prototype.file = function(filepath, data) {
  data = this._normalizeFileData(data);
  filepath = String(filepath);

  if (typeof filepath !== 'string' || filepath.length === 0) {
    this.emit('error', new Error('filepath must be a non-empty string value'));
    return this;
  }

  if (util.file.isFile(filepath)) {
    if (typeof data.name !== 'string' || data.name.length === 0) {
      data.name = filepath;
    }

    this.append(util.lazyReadStream(filepath), data);
  } else {
    this.emit('error', new Error('invalid file: ' + filepath));
  }

  return this;
};

Archiver.prototype.finalize = function(callback) {
  this._queue.close();

  return this;
};

Archiver.prototype.setModule = function(module) {
  if (this._moduleOutputPiped) {
    this.emit('error', new Error('format module already set'));
    return;
  }

  this._module = module;
  this._pipeModuleOutput();
};

Archiver.prototype.pointer = function() {
  return this._pointer;
};