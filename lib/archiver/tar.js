var inherits = require('util').inherits;

var Archiver = require('./core.js');
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

var header = {
  format: [
    {'field': 'name', 'length': 100, 'type': 'string'},
    {'field': 'mode', 'length': 8, 'type': 'number'},
    {'field': 'uid', 'length': 8, 'type': 'number'},
    {'field': 'gid', 'length': 8, 'type': 'number'},
    {'field': 'size','length': 12, 'type': 'number'},
    {'field': 'mtime', 'length': 12, 'type': 'number'},
    {'field': 'checksum', 'length': 8, 'type': 'string', 'default': utils.repeat(' ', 8)},
    {'field': 'type', 'length': 1, 'type': 'number'},
    {'field': 'linkName', 'length': 100, 'type': 'string'},
    {'field': 'ustar', 'length': 8, 'type': 'string', 'default': 'ustar '},
    {'field': 'owner', 'length': 32, 'type': 'string'},
    {'field': 'group', 'length': 32, 'type': 'string'},
    {'field': 'majorNumber', 'length': 8, 'type': 'number'},
    {'field': 'minorNumber', 'length': 8, 'type': 'number'},
    {'field': 'filenamePrefix', 'length': 155, 'type': 'string'},
    {'field': 'padding', 'length': 12}
  ],

  create: function(data) {
    var buffer = utils.cleanBuffer(512);
    var offset = 0;

    var val;

    this.format.forEach(function(value) {
      val = data[value.field] || value.default || '';

      buffer.write(val, offset);
      offset += value.length;
    });

    var checksum = this.createChecksum(buffer);

    for (var i = 0, length = 6; i < length; i += 1) {
      buffer[i + 148] = checksum.charCodeAt(i);
    }

    buffer[154] = 0;
    buffer[155] = 0x20;

    return buffer;
  },

  createChecksum: function(buffer) {
    var checksum = 0;
    for (var i = 0, length = buffer.length; i < length; i += 1) {
      checksum += buffer[i];
    }

    checksum = checksum.toString(8);
    while (checksum.length < 6) {
      checksum = '0' + checksum;
    }

    return checksum;
  },

  read: function(buffer) {
    var data = {};
    var offset = 0;

    this.format.forEach(function(value) {
      data[value.field] = buffer.toString('utf8', offset, offset + (value.length - 1)).replace(/\u0000.*/, '');
      offset += value.length;
    });

    delete data.padding;

    return data;
  }
};

tarArchiver.prototype._writeData = function(file, sourceBuffer) {
  var self = this;

  var fileSize = file.size;

  file.mode = utils.padNumber(file.mode, 7);
  file.uid = utils.padNumber(file.uid, 7);
  file.gid = utils.padNumber(file.gid, 7);
  file.size = utils.padNumber(fileSize, 11);
  file.mtime = utils.padNumber(file.mtime, 11);

  var headerBuffer = header.create(file);

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

  if (self.busy) {
    self.emit('error', 'previous file not finished');
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
    self.emit('error', 'file name is empty or not a valid string value');
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
    utils.collectStream(source, function(error, buffer) {
      if (error) {
        self.emit('error', 'stream collection failed');
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

  if (self.files.length === 0) {
    self.emit('error', 'no files in tar');
    return;
  }

  var endBytes = self.blockSize - (self.fileptr % self.blockSize);
  var endBytesBuffer = utils.cleanBuffer(endBytes);

  self.queue.push(endBytesBuffer);
  self.fileptr += endBytesBuffer.length;

  self.callback = callback;
  self.eof = true;
};