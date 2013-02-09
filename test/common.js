var crypto = require('crypto');
var fs = require('fs');
var inherits = require('util').inherits;
var Stream = require('stream').Stream;

function HashStream() {
  Stream.call(this);

  this.writable = true;

  this.hash = crypto.createHash('sha1');
  this.digest = null;
}

inherits(HashStream, Stream);

HashStream.prototype.write = function(chunk) {
  this.hash.update(chunk);
};

HashStream.prototype.end = function() {
  this.digest = this.hash.digest('hex');
  this.emit('close');
};

module.exports.HashStream = HashStream;

function WriteHashStream(path, options) {
  fs.WriteStream.call(this, path, options);

  this.hash = crypto.createHash('sha1');
  this.digest = null;

  this.on('close', function() {
    this.digest = this.hash.digest('hex');
  });
}

inherits(WriteHashStream, fs.WriteStream);

WriteHashStream.prototype.write = function(chunk) {
  fs.WriteStream.prototype.write.call(this, chunk);
  this.hash.update(chunk);
};

module.exports.WriteHashStream = WriteHashStream;

function binaryBuffer(n) {
  var buffer = new Buffer(n);

  for (var i = 0; i < n; i++) {
    buffer.writeUInt8(i&255, i);
  }

  return buffer;
}

module.exports.binaryBuffer = binaryBuffer;