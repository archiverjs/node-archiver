var crypto = require('crypto');
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

function binaryBuffer(n) {
  var buffer = new Buffer(n);

  for (var i = 0; i < n; i++) {
    buffer.writeUInt8(i&255, i);
  }

  return buffer;
}

module.exports.binaryBuffer = binaryBuffer;