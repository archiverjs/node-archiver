function binaryBuffer(n) {
  var buffer = Buffer.alloc(n);

  for (var i = 0; i < n; i++) {
    buffer.writeUInt8(i & 255, i);
  }

  return buffer;
}

module.exports.binaryBuffer = binaryBuffer;
