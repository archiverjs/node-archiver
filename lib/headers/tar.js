/**
 * node-archiver
 *
 * Copyright (c) 2012-2013 Chris Talkington, contributors.
 * Licensed under the MIT license.
 * https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT
 */
var path = require('path');
var inherits = require('util').inherits;

var util = require('../util');

function HeaderTar() {
  this.bufferSize = 0;
  this.fields = [];
}

function HeaderTarFile() {
  HeaderTar.call(this);

  this.bufferSize = 512;
  this.fields = [
    {field: 'name', len: 100, type: 'string'},
    {field: 'mode', len: 8, type: 'number'},
    {field: 'uid', len: 8, type: 'number'},
    {field: 'gid', len: 8, type: 'number'},
    {field: 'size',len: 12, type: 'number'},
    {field: 'mtime', len: 12, type: 'number'},
    {field: 'checksum', len: 8, type: 'number'},
    {field: 'type', len: 1, type: 'string', def: '0'},
    {field: 'linkName', len: 100, type: 'string'},
    {field: 'ustar', len: 6, type: 'string', def: 'ustar'},
    {field: 'ustarVersion', len: 2, type: 'string', def: '00'},
    {field: 'owner', len: 32, type: 'string', def: 'root'},
    {field: 'group', len: 32, type: 'string', def: 'root'},
    {field: 'devMajor', len: 8, type: 'number'},
    {field: 'devMinor', len: 8, type: 'number'},
    {field: 'prefix', len: 155, type: 'string'},
    {field: 'padding', len: 12, type: 'padding'}
  ];
}
inherits(HeaderTarFile, HeaderTar);

HeaderTarFile.prototype.toBuffer = function(data) {
  var self = this;
  var buf = util.cleanBuffer(self.bufferSize);
  var offset = 0;

  var val;
  var fallback;

  data = self._normalize(data);

  self.fields.forEach(function(value) {
    fallback = (value.type === 'number') ? 0 : '';
    val = data[value.field] || value.def || fallback;

    if (value.field === 'checksum') {
      val = util.repeat(' ', 8);
    } else if (value.type === 'number') {
      val = self._prepNumeric(val, value.len);
    } else if (value.type === 'string') {
      if (typeof val === 'number') {
        val = val.toString();
      }
    }

   buf.write(val, offset);

    offset += value.len;
  });

  var checksum = this._createChecksum(buf);

  for (var i = 0, length = 6; i < length; i += 1) {
    buf[i + 148] = checksum.charCodeAt(i);
  }

  buf[154] = 0;
  buf[155] = 0x20;

  return buf;
};

HeaderTarFile.prototype.toObject = function(buf) {
  var self = this;

  var data = {};
  var offset = 0;
  var result;

  self.fields.forEach(function(value) {
    result = buf.toString('utf8', offset, offset + value.len).replace(/\0+$/, '');

    if (value.field === 'ustar') {
      result = (result === 'ustar');
    } else if (value.field === 'mtime') {
      result = self._parseNumeric(result);
      data['date'] = util.convertDateTimeEpoch(result);
    } else if (value.type === 'number') {
      result = self._parseNumeric(result);
    }

    data[value.field] = result;

    offset += value.len;
  });

  delete data.padding;

  return data;
};

HeaderTarFile.prototype._normalize = function(data) {
  data.name = util.sanitizeFilePath(data.name);
  data.mode = typeof data.mode === 'number' ? data.mode : 0664;
  data.mode = data.mode & 0777;

  data.uid = typeof data.uid === 'number' ? data.uid : 0;
  data.gid = typeof data.gid === 'number' ? data.gid : 0;

  if (typeof data.mtime !== 'number') {
    data.date = util.dateify(data.date);
    data.mtime = util.epochDateTime(data.date);
  } else {
    data.date = util.convertDateTimeEpoch(data.mtime);
  }

  var pathParts = this._splitFilePath(data.name);
  data.name = pathParts[0];
  data.prefix = pathParts[1];

  return data;
};

HeaderTarFile.prototype._createChecksum = function(buf) {
  var checksum = 0;
  for (var i = 0, length = buf.length; i < length; i += 1) {
    checksum += buf[i];
  }

  checksum = checksum.toString(8);
  while (checksum.length < 6) {
    checksum = '0' + checksum;
  }

  return checksum;
};

var MAXNUM = {
  12: 077777777777,
  11: 07777777777,
  8: 07777777,
  7: 0777777
};

HeaderTarFile.prototype._prepNumeric = function(num, len) {
  num = num || 0;

  var max = MAXNUM[len] || 0;

  if (num > max || num < 0) {
    // need an extended header if negative or too big. someday just not today..
  }

  var str = Math.floor(num).toString(8);

  if (num < MAXNUM[len - 1]) {
    str += ' ';
  }

  if (str.length < len) {
    str = util.repeat('0', len - str.length) + str;
  }

  return str;
};

HeaderTarFile.prototype._parseNumeric = function(str) {
  var res = parseInt(str.trim(), 8);

  return isNaN(res) ? null : res;
};

HeaderTarFile.prototype._splitFilePath = function(filepath) {
  var fileName = filepath;
  var filePrefix = '';
  var sepIndex;

  if (filepath.length > 100 && filepath.length <= 255) {
    sepIndex = filepath.substring(0, 155).lastIndexOf('/');

    if (sepIndex !== -1) {
      filePrefix = filepath.substring(0, sepIndex);
      fileName = filepath.substring(sepIndex + 1);
    }
  }

  return [fileName, filePrefix];
};

var headers = {
  file: new HeaderTarFile()
};

var encode = exports.encode = function(type, data) {
  if (!headers[type] || typeof headers[type].toBuffer !== 'function') {
    throw new Error('Unknown encode type');
  }

  return headers[type].toBuffer(data);
};

var decode = exports.decode = function(type, buf) {
  if (!headers[type] || typeof headers[type].toObject !== 'function') {
    throw new Error('Unknown decode type');
  }

  return headers[type].toObject(buf);
};

exports.file = HeaderTarFile;