var fs = require('fs');
var path = require('path');
var Stream = require('stream');
var utils = module.exports = {};

utils.lo = require('lodash');

utils.crc32 = require('./crc32');

utils.cleanBuffer = function(length) {
  var buffer = new Buffer(length);

  buffer.fill(0);

  return buffer;
};

utils.collectStream = function(stream, callback) {
  var collection = [];
  var size = 0;

  stream.on('error', callback);

  stream.on('data', function(chunk) {
    collection.push(chunk);
    size += chunk.length;
  });

  stream.on('end', function() {
    var buffer = new Buffer(size, 'utf8');
    var offset = 0;

    collection.forEach(function(data) {
      data.copy(buffer, offset);
      offset += data.length;
    });

    callback(null, buffer);
  });
};

utils.convertDateTimeDos = function(input) {
 return new Date(
  ((input >> 25) & 0x7f) + 1980,
  ((input >> 21) & 0x0f) - 1,
  (input >> 16) & 0x1f,
  (input >> 11) & 0x1f,
  (input >> 5) & 0x3f,
  (input & 0x1f) << 1);
};

utils.convertDateTimeOctal = function(input) {
  input = parseInt(input, 8) * 1000;

  return new Date(input);
};

utils.dosDateTime = function(d, utc) {
  d = (d instanceof Date) ? d : new Date();
  utc = utc || false;

  var year = (utc === true) ? d.getUTCFullYear() : d.getFullYear();

  if (year < 1980) {
    return (1<<21) | (1<<16);
  }

  var val = {
    year: year,
    month: (utc === true) ? d.getUTCMonth() : d.getMonth(),
    date: (utc === true) ? d.getUTCDate() : d.getDate(),
    hours: (utc === true) ? d.getUTCHours() : d.getHours(),
    minutes: (utc === true) ? d.getUTCMinutes() : d.getMinutes(),
    seconds: (utc === true) ? d.getUTCSeconds() : d.getSeconds()
  };

  return ((val.year-1980) << 25) | ((val.month+1) << 21) | (val.date << 16) |
    (val.hours << 11) | (val.minutes << 5) | (val.seconds / 2);
};

utils.isStream = function(source) {
  return source instanceof Stream.Stream
}

utils.octalDateTime = function(d) {
  d = (d instanceof Date) ? d : new Date();

  return Math.round(d / 1000).toString(8);
};

utils.padNumber = function(num, bytes, base) {
  num = num.toString(base || 8);
  return this.repeat('0', bytes - num.length) + num;
};

utils.repeat = function(pattern, count) {
  if (count < 1) {
    return '';
  }

  var result = '';

  while (count > 0) {
    if (count & 1) {
      result += pattern;
    }

    count >>= 1, pattern += pattern;
  }

  return result;
};

utils.unixifyPath = function(filepath) {
  if (process.platform === 'win32') {
    return filepath.replace(/\\/g, '/');
  } else {
    return filepath;
  }
};