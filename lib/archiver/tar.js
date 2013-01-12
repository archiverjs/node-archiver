/**
 * node-archiver
 *
 * Copyright (c) 2012-2013 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */

var inherits = require('util').inherits;

var Archiver = require('./core.js');
var headers = require('../headers/tar');
var utils = require('../util/utils');

var tarArchiver = module.exports = function(options) {
  var self = this;

  Archiver.call(self);

  options = options || {};

  options = self.options = utils.lo.defaults(options, {
    recordSize: 512,
    recordsPerBlock: 20
  });

  self.recordSize = options.recordSize;
  self.blockSize = options.recordsPerBlock * self.recordSize;
};

inherits(tarArchiver, Archiver);

tarArchiver.prototype._writeData = function(file, sourceBuffer) {
  var self = this;

  var fileSize = file.size;

  file.mode = utils.padNumber(file.mode, 7);
  file.uid = utils.padNumber(file.uid, 7);
  file.gid = utils.padNumber(file.gid, 7);
  file.size = utils.padNumber(fileSize, 11);
  file.mtime = utils.padNumber(file.mtime, 11);

  var headerBuffer = headers.file.toBuffer(file);

  self.queue.push(headerBuffer);
  self.fileptr += headerBuffer.length;

  self.queue.push(sourceBuffer);
  self.fileptr += sourceBuffer.length;

  var extraBytes = self.recordSize - (fileSize % self.recordSize || self.recordSize);
  var extraBytesBuffer = utils.cleanBuffer(extraBytes);
  self.queue.push(extraBytesBuffer);
  self.fileptr += extraBytesBuffer.length;

  self.files.push(file);

  self.busy = false;
};

tarArchiver.prototype.addFile = function(source, data, callback) {
  var self = this;

  if (utils.lo.isFunction(callback) === false) {
    callback = utils.fallCall;
  }

  if (self.busy) {
    callback(new Error('Previous file not finished'));
    return;
  }

  if (utils.lo.isString(source)) {
    source = new Buffer(source, 'utf8');
  }

  var file = utils.lo.defaults(data || {}, {
    name: null,
    comment: '',
    date: null,
    gid: 0,
    mode: null,
    mtime: null,
    uid: 0
  });

  if (utils.lo.isEmpty(file.name) || utils.lo.isString(file.name) === false) {
    callback(new Error('Name must be a valid string value'));
    return;
  }

  file.name = utils.unixifyPath(file.name);

  if (file.name.substring(0, 1) === '/') {
    file.name = file.name.substring(1);
  }

  file.type = '0';
  file.size = 0;

  if (utils.lo.isDate(file.date)) {
    file.date = file.date;
  } else if (utils.lo.isString(file.date)) {
    file.date = new Date(file.date);
  } else if (utils.lo.isNumber(file.mtime) === false) {
    file.date = new Date();
  }

  if (utils.lo.isNumber(file.mtime) === false) {
    file.mtime = utils.octalDateTime(file.date);
  }

  file.gid = utils.lo.isNumber(file.gid) ? file.gid : 0;
  file.mode = utils.lo.isNumber(file.mode) ? file.mode : parseInt('777', 8) & 0xfff;
  file.uid = utils.lo.isNumber(file.uid) ? file.uid : 0;

  self.busy = true;
  self.file = file;

  function onEnd() {
    self._writeData(file, source);

    callback();
  }

  function update(chunk) {
    file.size += chunk.length;
  }

  if (Buffer.isBuffer(source)) {
    update(source);

    process.nextTick(onEnd);
  } else {
    utils.collectStream(source, function(err, buffer) {
      if (err) {
        self.emit('error', new Error('Stream collection failed'));
        return;
      }

      update(buffer);
      source = buffer;

      process.nextTick(onEnd);
    });
  }

  process.nextTick(function() {
    self._read();
  });
};

tarArchiver.prototype.finalize = function(callback) {
  var self = this;

  if (utils.lo.isFunction(callback) === false) {
    callback = utils.fallCall;
  }

  if (self.files.length === 0) {
    callback(new Error('No files in archive'));
    return;
  }

  var endBytes = self.blockSize - (self.fileptr % self.blockSize);
  var endBytesBuffer = utils.cleanBuffer(endBytes);

  self.queue.push(endBytesBuffer);
  self.fileptr += endBytesBuffer.length;

  self.callback = callback;
  self.eof = true;
};