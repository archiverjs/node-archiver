var util = require('util');
var zlib = require('zlib');

var Archiver = require('./core.js');
var crc32 = require('../util/crc32');
var utils = require('../util/utils');

var zipArchiver = function(opt) {
  Archiver.call(this, opt);
};

util.inherits(zipArchiver, Archiver);

module.exports = zipArchiver;

// local file header
zipArchiver.prototype._pushLocalFileHeader = function(file) {
  var self = this;

  file.version = 20;
  file.bitflag = (1<<3) | (1<<11);
  file.method = file.store ? 0 : 8;
  if (!file.date) { file.date = new Date(); }
  file.moddate = utils.convertDate(file.date);
  file.offset = self.fileptr;

  var buf = new Buffer(1024);
  var len;

  buf.writeUInt32LE(0x04034b50, 0);         // local file header signature
  buf.writeUInt16LE(file.version, 4);       // version needed to extract
  buf.writeUInt16LE(file.bitflag, 6);       // general purpose bit flag
  buf.writeUInt16LE(file.method, 8);        // compression method
  buf.writeUInt32LE(file.moddate, 10);      // last mod file date and time
  buf.writeInt32LE(0, 14);                  // crc32
  buf.writeUInt32LE(0, 18);                 // compressed size
  buf.writeUInt32LE(0, 22);                 // uncompressed size

  buf.writeUInt16LE(0, 28);                 // extra field length
  len = buf.write(file.name, 30);           // file name
  buf.writeUInt16LE(len, 26);               // file name length

  len += 30;
  self.queue.push(buf.slice(0, len));
  self.fileptr += len;
};

zipArchiver.prototype._pushDataDescriptor = function(file) {
  var self = this;

  var buf = new Buffer(16);
  buf.writeUInt32LE(0x08074b50, 0);         // data descriptor record signature
  buf.writeInt32LE(file.crc32, 4);          // crc-32
  buf.writeUInt32LE(file.compressed, 8);    // compressed size
  buf.writeUInt32LE(file.uncompressed, 12); // uncompressed size

  self.queue.push(buf);
  self.fileptr += buf.length;
};

zipArchiver.prototype._pushCentralDirectory = function() {
  var self = this;
  var cdoffset = self.fileptr;

  var ptr = 0;
  var cdsize = 0;

  var len, buf;

  for (var i=0; i<self.files.length; i++) {
    var file = self.files[i];

    buf = new Buffer(1024);

    // central directory file header
    buf.writeUInt32LE(0x02014b50, 0);         // central file header signature
    buf.writeUInt16LE(file.version, 4);       // TODO version made by
    buf.writeUInt16LE(file.version, 6);       // version needed to extract
    buf.writeUInt16LE(file.bitflag, 8);       // general purpose bit flag
    buf.writeUInt16LE(file.method, 10);       // compression method
    buf.writeUInt32LE(file.moddate, 12);      // last mod file time and date
    buf.writeInt32LE(file.crc32, 16);         // crc-32
    buf.writeUInt32LE(file.compressed, 20);   // compressed size
    buf.writeUInt32LE(file.uncompressed, 24); // uncompressed size

    buf.writeUInt16LE(0, 30);                 // extra field length
    buf.writeUInt16LE(0, 32);                 // file comment length
    buf.writeUInt16LE(0, 34);                 // disk number where file starts
    buf.writeUInt16LE(0, 36);                 // internal file attributes
    buf.writeUInt32LE(0, 38);                 // external file attributes
    buf.writeUInt32LE(file.offset, 42);       // relative offset
    len = buf.write(file.name, 46);           // file name
    buf.writeUInt16LE(len, 28);               // file name length

    len += 46;
    ptr = ptr + len;
    self.queue.push(buf.slice(0, len));
  }

  cdsize = ptr;

  // end of central directory record
  len = 22;
  buf = new Buffer(len);

  buf.writeUInt32LE(0x06054b50, 0);           // end of central dir signature
  buf.writeUInt16LE(0, 4);                    // number of this disk
  buf.writeUInt16LE(0, 6);                    // disk where central directory starts
  buf.writeUInt16LE(self.files.length, 8);    // number of central directory records on this disk
  buf.writeUInt16LE(self.files.length, 10);   // total number of central directory records
  buf.writeUInt32LE(cdsize, 12);              // size of central directory in bytes
  buf.writeUInt32LE(cdoffset, 16);            // offset of start of central directory, relative to start of archive
  buf.writeUInt16LE(0, 20);                   // comment length

  ptr = ptr + len;

  self.queue.push(buf);
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
  file.uncompressed = 0;
  file.compressed = 0;

  function onEnd() {
    file.crc32 = checksum.digest();
    if (file.store) {
      file.compressed = file.uncompressed;
    }

    self.fileptr += file.compressed;
    self._pushDataDescriptor(file);

    self.files.push(file);
    self.busy = false;
    callback();
  }

  function update(chunk) {
    checksum.update(chunk);
    file.uncompressed += chunk.length;
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
    var deflate = zlib.createDeflateRaw(self.options);

    deflate.on('data', function(chunk) {
      file.compressed += chunk.length;
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