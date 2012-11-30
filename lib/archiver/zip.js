var inherits = require('util').inherits;
var zlib = require('zlib');

var lodash = require('lodash');

var Archiver = require('./core.js');
var crc32 = require('../util/crc32');
var utils = require('../util/utils');

var zipArchiver = module.exports = function(options) {
  var self = this;

  Archiver.call(self);

  options = self.options = lodash.defaults(options || {}, {
    zlib: {
      level: 6
    }
  });

  if (lodash.isNumber(options.level)) {
    options.zlib.level = options.level;
    delete options.level;
  }
};

inherits(zipArchiver, Archiver);

var fileHeader = {
  format: [
    {'field': 'signature', 'length': 4, 'type': 'UInt32LE', 'default': 0x04034b50},
    {'field': 'versionNeededToExtract', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'flags', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'compressionMethod', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'lastModifiedDate', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'crc32', 'length': 4, 'type': 'Int32LE', 'default': 0},
    {'field': 'compressedSize', 'length': 4, 'type': 'UInt32LE', 'default': 0},
    {'field': 'uncompressedSize', 'length': 4, 'type': 'UInt32LE', 'default': 0},
    {'field': 'filenameLength', 'length': 2, 'type': 'UInt16LE', 'default': 0},
    {'field': 'extraFieldLength', 'length': 2, 'type': 'UInt16LE', 'default': 0},
    {'field': 'name', 'length': -1, 'type': 'string'},
    {'field': 'extraField', 'length': -1, 'type': 'string'}
  ],

  create: function(data) {
    var buffer = new Buffer(1024);
    var offset = 0;
    var val;
    var fallback;

    this.format.forEach(function(value) {
      fallback = (value.type === 'string') ? '' : 0;
      val = data[value.field] || value.default || fallback;

      if (value.field === 'name') {
        value.length = buffer.write(val, offset);
        buffer.writeUInt16LE(value.length, 26);
      } else if (value.field === 'extraField') {
        value.length = (val.length > 0) ? buffer.write(val, offset) : 0;
        buffer.writeUInt16LE(value.length, 28);
      } else if (value.type === 'UInt32LE') {
        buffer.writeUInt32LE(val, offset);
      } else if (value.type === 'Int32LE') {
        buffer.writeInt32LE(val, offset);
      } else if (value.type === 'UInt16LE') {
        buffer.writeUInt16LE(val, offset);
      } else {
        buffer.write(val, offset);
      }

      offset += value.length;
    });

    return buffer.slice(0, offset);
  }
};

var dataDescriptorHeader = {
  format: [
    {'field': 'signature', 'length': 4, 'type': 'UInt32LE', 'default': 0x08074b50},
    {'field': 'crc32', 'length': 4, 'type': 'Int32LE'},
    {'field': 'compressedSize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'uncompressedSize', 'length': 4, 'type': 'UInt32LE'}
  ],

  create: function(data) {
    var buffer = new Buffer(16);
    var offset = 0;
    var val;

    this.format.forEach(function(value) {
      val = data[value.field] || value.default || 0;

      if (value.type === 'UInt32LE') {
        buffer.writeUInt32LE(val, offset);
      } else if (value.type === 'Int32LE') {
        buffer.writeInt32LE(val, offset);
      }

      offset += value.length;
    });

    return buffer;
  }
};

var centralDirectoryHeader = {
  format: [
    {'field': 'signature', 'length': 4, 'type': 'UInt32LE', 'default': 0x02014b50},
    {'field': 'versionMadeBy', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'versionNeededToExtract', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'flags', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'compressionMethod', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'lastModifiedDate', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'crc32', 'length': 4, 'type': 'Int32LE'},
    {'field': 'compressedSize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'uncompressedSize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'filenameLength', 'length': 2, 'type': 'UInt16LE', 'default': 0},
    {'field': 'extraFieldLength', 'length': 2, 'type': 'UInt16LE', 'default': 0},
    {'field': 'commentLength', 'length': 2, 'type': 'UInt16LE', 'default': 0},
    {'field': 'diskNumberStart', 'length': 2, 'type': 'UInt16LE', 'default': 0},
    {'field': 'internalFileAttributes', 'length': 2, 'type': 'UInt16LE', 'default': 0},
    {'field': 'externalFileAttributes', 'length': 4, 'type': 'UInt32LE', 'default': 0},
    {'field': 'offset', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'name', 'length': -1, 'type': 'string'},
    {'field': 'extraField', 'length': -1, 'type': 'string'}
  ],

  create: function(data) {
    var buffer = new Buffer(1024);
    var offset = 0;
    var val;
    var fallback;

    var nameLength;

    this.format.forEach(function(value) {
      fallback = (value.type === 'string') ? '' : 0;
      val = data[value.field] || value.default || fallback;

      if (value.field === 'name') {
        value.length = buffer.write(val, offset);
        buffer.writeUInt16LE(value.length, 28);
      } else if (value.field === 'extraField') {
        value.length =  (val.length > 0) ? buffer.write(val, offset) : 0;
        buffer.writeUInt16LE(value.length, 30);
      } else if (value.type === 'UInt32LE') {
        buffer.writeUInt32LE(val, offset);
      } else if (value.type === 'Int32LE') {
        buffer.writeInt32LE(val, offset);
      } else if (value.type === 'UInt16LE') {
        buffer.writeUInt16LE(val, offset);
      } else {
        buffer.write(val, offset);
      }

      offset += value.length;
    });

    return buffer.slice(0, offset);
  }
};

var centralDirectoryFooter = {
  format: [
    {'field': 'signature', 'length': 4, 'type': 'UInt32LE', 'default': 0x06054b50},
    {'field': 'diskNumber', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'diskNumberStart', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'directoryRecordsDisk', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'directoryRecords', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'directorySize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'directoryOffset', 'length': 4, 'type': 'UInt32LE'},,
    {'field': 'commentLength', 'length': 2, 'type': 'UInt16LE'}
  ],

  create: function(data) {
    var buffer = new Buffer(512);
    var offset = 0;
    var val;
    var fallback;

    this.format.forEach(function(value) {
      fallback = (value.type === 'string') ? '' : 0;
      val = data[value.field] || value.default || fallback;

      if (value.type === 'UInt32LE') {
        buffer.writeUInt32LE(val, offset);
      } else if (value.type === 'Int32LE') {
        buffer.writeInt32LE(val, offset);
      } else if (value.type === 'UInt16LE') {
        buffer.writeUInt16LE(val, offset);
      } else {
        buffer.write(val, offset);
      }

      offset += value.length;
    });

    return buffer.slice(0, offset);
  }
};

// local file header
zipArchiver.prototype._pushLocalFileHeader = function(file) {
  var self = this;

  var date = (typeof file.date === 'string') ? new Date(file.date) : new Date();

  file.versionMadeBy = 20;
  file.versionNeededToExtract = 20;
  file.flags = (1<<3) | (1<<11);
  file.compressionMethod = file.store ? 0 : 8;
  file.lastModifiedDate = (typeof file.lastModifiedDate === 'number') ? file.lastModifiedDate : utils.convertDate(date);

  if (typeof file.lastModifiedDate !== 'number') {
    file.date = (file.date.length > 0) ? new Date(file.date) : new Date();
    file.lastModifiedDate = utils.convertDate(file.date);
  }

  file.offset = self.fileptr;

  var fileHeaderBuffer = fileHeader.create(file);

  self.queue.push(fileHeaderBuffer);
  self.fileptr += fileHeaderBuffer.length;
};

zipArchiver.prototype._pushDataDescriptor = function(file) {
  var self = this;

  var dataDescriptorBuffer = dataDescriptorHeader.create(file);

  self.queue.push(dataDescriptorBuffer);
  self.fileptr += dataDescriptorBuffer.length;
};

zipArchiver.prototype._pushCentralDirectory = function() {
  var self = this;
  var cdoffset = self.fileptr;

  var ptr = 0;
  var cdsize = 0;

  var centralDirectoryBuffer;

  for (var i = 0; i < self.files.length; i++) {
    var file = self.files[i];

    centralDirectoryBuffer = centralDirectoryHeader.create(file);

    self.queue.push(centralDirectoryBuffer);
    ptr += centralDirectoryBuffer.length;
  }

  cdsize = ptr;

  var centralDirectoryFooterData = {
    directoryRecordsDisk: self.files.length,
    directoryRecords: self.files.length,
    directorySize: cdsize,
    directoryOffset: cdoffset
  };

  var centralDirectoryFooterBuffer = centralDirectoryFooter.create(centralDirectoryFooterData);

  self.queue.push(centralDirectoryFooterBuffer);
  ptr += centralDirectoryFooterBuffer.length;
  self.fileptr += ptr;
};

zipArchiver.prototype.addFile = function(source, file, callback) {
  var self = this;

  if (self.busy) {
    self.emit('error', 'previous file not finished');
    return;
  }

  if (typeof source === 'string') {
    source = new Buffer(source, 'utf-8');
  }

  file.name = utils.unixifyPath(file.name);

  if (file.name.substring(0, 1) === '/') {
    file.name = file.name.substring(1);
  }

  self.busy = true;
  self.file = file;
  self._pushLocalFileHeader(file);

  var checksum = crc32.createCRC32();
  file.uncompressedSize = 0;
  file.compressedSize = 0;

  function onEnd() {
    file.crc32 = checksum.digest();
    if (file.store) {
      file.compressedSize = file.uncompressedSize;
    }

    self.fileptr += file.compressedSize;
    self._pushDataDescriptor(file);

    self.files.push(file);
    self.busy = false;
    callback();
  }

  function update(chunk) {
    checksum.update(chunk);
    file.uncompressedSize += chunk.length;
  }

  if (file.store) {
    if (Buffer.isBuffer(source)) {
      update(source);

      self.queue.push(source);
      process.nextTick(onEnd);
    } else {
      // Assume stream
      source.on('data', function(chunk) {
        update(chunk);
        self.queue.push(chunk);
      });

      source.on('end', onEnd);
    }
  } else {
    var deflate = zlib.createDeflateRaw(self.zlib);

    deflate.on('data', function(chunk) {
      file.compressedSize += chunk.length;
      self.queue.push(chunk);
    });

    deflate.on('end', onEnd);

    if (Buffer.isBuffer(source)) {
      update(source);
      deflate.write(source);
      deflate.end();
    } else {
      // Assume stream
      source.on('data', function(chunk) {
        update(chunk);
        deflate.write(chunk); //TODO check for false & wait for drain
      });
      source.on('end', function() {
        deflate.end();
      });
    }
  }

  process.nextTick(function() {
    self._read();
  });
};

zipArchiver.prototype._addFileStore = function(source, file, callback) {
  // placeholder
};

zipArchiver.prototype._addFileDeflate = function(source, file, callback) {
  // placeholder
};

zipArchiver.prototype.finalize = function(callback) {
  var self = this;

  if (self.files.length === 0) {
    self.emit('error', 'no files in zip');
    return;
  }

  self.callback = callback;
  self._pushCentralDirectory();
  self.eof = true;
};