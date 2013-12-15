var inherits = require('util').inherits;
var Transform = require('stream').Transform || require('readable-stream').Transform;

var util = require('../../util');

var Json = module.exports = function(options) {
  options = this.options = util.defaults(options, {
    recordSize: 512,
    recordsPerBlock: 20
  });

  Transform.call(this, options);

  this.offset = 0;
  this.files = [];

  this.recordSize = options.recordSize;
  this.blockSize = options.recordsPerBlock * options.recordSize;
};

inherits(Json, Transform);

Json.prototype._transform = function(chunk, encoding, callback) {
  callback(null, chunk);
};

Json.prototype._writeStringified = function() {
  var fileString = JSON.stringify(this.files);
  this.write(fileString);
};

Json.prototype.append = function(source, data, callback) {
  var self = this;

  var file = data;
  file.offset = self.offset;
  file.crc32 = null;

  function onend(err, sourceBuffer) {
    if (err) {
      callback(err);
      return;
    }

    sourceBuffer = sourceBuffer || false;
    file.size = sourceBuffer.length || 0;


    if (file.size > 0) {
      file.crc32 = util.crc32(sourceBuffer).digest();
    }

    self.files.push(file);

    callback(null, file);
  }

  if (file.sourceType === 'buffer') {
    onend(null, source);
  } else if (file.sourceType === 'stream') {
    util.collectStream(source, onend);
  }
};

Json.prototype.finalize = function(callback) {
  callback = callback || function() {};

  this._writeStringified();

  this.end();

  callback();
};

Json.prototype.write = function(chunk, cb) {
  if (chunk) {
    this.offset += chunk.length;
  }

  return Transform.prototype.write.call(this, chunk, cb);
};