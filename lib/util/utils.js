var utils = module.exports = {};

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

utils.convertDate = function(d) {
  d = (d instanceof Date) ? d : new Date();

  var year = d.getFullYear();

  if (year < 1980) {
    return (1<<21) | (1<<16);
  }

  return ((year-1980) << 25) | ((d.getMonth()+1) << 21) | (d.getDate() << 16) |
    (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
};

utils.convertDateOctal = function(d) {
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