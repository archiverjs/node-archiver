var inherits = require('util').inherits;
var zlib = require('zlib');

var Archiver = require('./core.js');
var utils = require('../util/utils');

var zipArchiver = module.exports = function(options) {
  var self = this;

  Archiver.call(self);

  options = self.options = utils.lo.defaults(options || {}, {
    comment: '',
    forceUTC: false,
    zlib: {
      level: 6
    }
  });

  if (utils.lo.isNumber(options.level)) {
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
    {'field': 'compressedSize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'uncompressedSize', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'filenameLength', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'extraFieldLength', 'length': 2, 'type': 'UInt16LE'},
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
    {'field': 'filenameLength', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'extraFieldLength', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'commentLength', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'diskNumberStart', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'internalFileAttributes', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'externalFileAttributes', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'offset', 'length': 4, 'type': 'UInt32LE'},
    {'field': 'name', 'length': -1, 'type': 'string'},
    {'field': 'extraField', 'length': -1, 'type': 'string'},
    {'field': 'comment', 'length': -1, 'type': 'string'}
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
      } else if (value.field === 'comment') {
        value.length = (val.length > 0) ? buffer.write(val, offset) : 0;
        buffer.writeUInt16LE(value.length, 32);
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
    {'field': 'commentLength', 'length': 2, 'type': 'UInt16LE'},
    {'field': 'comment', 'length': -1, 'type': 'string'}
  ],

  create: function(data) {
    var buffer = new Buffer(512);
    var offset = 0;
    var val;
    var fallback;

    this.format.forEach(function(value) {
      fallback = (value.type === 'string') ? '' : 0;
      val = data[value.field] || value.default || fallback;

      if (value.field === 'comment') {
        value.length = (val.length > 0) ? buffer.write(val, offset) : 0;
        buffer.writeUInt16LE(value.length, 20);
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

// local file header
zipArchiver.prototype._pushLocalFileHeader = function(file) {
  var self = this;

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
    directoryOffset: cdoffset,
    comment: self.options.comment
  };

  var centralDirectoryFooterBuffer = centralDirectoryFooter.create(centralDirectoryFooterData);

  self.queue.push(centralDirectoryFooterBuffer);
  ptr += centralDirectoryFooterBuffer.length;
  self.fileptr += ptr;
};

zipArchiver.prototype.addFile = function(source, data, callback) {
  var self = this;
  // console.log("(addFile)", data.name, "busy:", self.busy, "paused:", self.paused, "stream:", utils.isStream(source), source);

  if (self.busy) {
    // We cannot process this addFile call now, because an other file is being read.
    // This means we should store the function call to addFile in self.queue_of_files_to_add 
    // and process it later after the current file is finished.
    // console.log("(addFile) push function call to queue", self.queue_of_files_to_add.length);

    if (utils.isStream(source)) {
      // Streams must be paused before inserting them into the queue, otherwise
      // the Stream handle might already be closed when we need it.
      source.pause();
    }

    self.queue_of_files_to_add.push([].slice.call(arguments));
    return;
  }

  if (utils.lo.isString(source)) {
    source = new Buffer(source, 'utf-8');
  }

  var file = utils.lo.defaults(data || {}, {
    name: null,
    comment: '',
    date: null,
    mode: null,
    store: false,
    lastModifiedDate: null
  });

  if (utils.lo.isEmpty(file.name) || utils.lo.isString(file.name) === false) {
    self.emit('error', 'file name is empty or not a valid string value');
    return;
  }

  file.name = utils.unixifyPath(file.name);

  if (file.name.substring(0, 1) === '/') {
    file.name = file.name.substring(1);
  }

  if (utils.lo.isDate(file.date)) {
    file.date = file.date;
  } else if (utils.lo.isString(file.date)) {
    file.date = new Date(file.date);
  } else if (utils.lo.isNumber(file.lastModifiedDate) === false) {
    file.date = new Date();
  }

  if (utils.lo.isNumber(file.lastModifiedDate) === false) {
    file.lastModifiedDate = utils.dosDateTime(file.date, self.options.forceUTC);
  }

  file.versionMadeBy = 20;
  file.versionNeededToExtract = 20;
  file.flags = (1<<3) | (1<<11);
  file.compressionMethod = file.store ? 0 : 8;
  file.uncompressedSize = 0;
  file.compressedSize = 0;

  self.busy = true;
  self.file = file;
  self._pushLocalFileHeader(file);

  var checksum = utils.crc32.createCRC32();

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

    if (self.queue_of_files_to_add.length > 0) {
      // Process backlog which may have accumulated because we can only add one file at a time
      // console.log("(addFile) process queue with length", self.queue_of_files_to_add.length);
     
      var addFile_arguments = self.queue_of_files_to_add.shift();
      zipArchiver.prototype.addFile.apply(self, addFile_arguments);
    }
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
    } else if (utils.isStream(source)) {

      // When Stream has been paused, resume it
      if (source.paused) {
        source.resume();
      }

      source.on('data', function(chunk) {
        update(chunk);
        self.queue.push(chunk);
      });

      source.on('error', function(err) {
        self.emit('error', 'Error when processing Stream: '+err);
      });

      source.on('end', onEnd);
    } else {
        self.emit('error', 'A valid Stream or Buffer instance is needed as input source. I have received: '+source);
        return;
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
    } else if (utils.isStream(source)) {
      // When Stream has been paused, resume it
      if (source.paused) {
        source.resume();
      }

      source.on('data', function(chunk) {
        update(chunk);
        deflate.write(chunk); //TODO check for false & wait for drain
      });

      source.on('error', function(err) {
        self.emit('error', 'Error when processing Stream: '+err);
      });

      source.on('end', function() {
        deflate.end();
      });
    } else {
        self.emit('error', 'A valid Stream or Buffer instance is needed as input source. I have received: '+source);
        return;
    }
  }

  process.nextTick(function() {
    self._read();
  });
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