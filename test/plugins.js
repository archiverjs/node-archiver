/*global before,describe,it */
var fs = require('fs');
var assert = require('chai').assert;
var mkdir = require('mkdirp');
var tar = require('tar');
var yauzl = require('yauzl');
var WriteStream = fs.createWriteStream;

var archiver = require('../lib/archiver');
var helpers = require('./helpers');
var binaryBuffer = helpers.binaryBuffer;

var testBuffer = binaryBuffer(1024 * 16);
var testDate = new Date('Jan 03 2013 14:26:38 GMT');
var testDate2 = new Date('Feb 10 2013 10:24:42 GMT');

var win32 = process.platform === 'win32';

describe('plugins', function() {
  before(function() {
    mkdir.sync('tmp');

    if (!win32) {
      fs.chmodSync('test/fixtures/executable.sh', 0777);
    }
  });

  describe('tar', function() {
    describe('#append', function() {
      var actual = [];
      var archive;
      var entries = {};

      before(function(done) {
        archive = archiver('tar');
        var testStream = tar.Parse();

        testStream.on('entry', function(entry) {
          actual.push(entry.path);
          entries[entry.path] = entry;
        });

        testStream.on('end', function() {
          done();
        });

        archive.pipe(testStream);

        archive
          .append(testBuffer, { name: 'buffer.txt', date: testDate })
          .append(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate })
          .append(null, { name: 'directory/', date: testDate })
          .finalize();
      });

      it('should append multiple entries', function() {
        assert.isArray(actual);
        assert.lengthOf(actual, 3);
      });

      it('should append buffer', function() {
        assert.property(entries, 'buffer.txt');
        assert.propertyVal(entries['buffer.txt'].props, 'path', 'buffer.txt');
        assert.propertyVal(entries['buffer.txt'].props, 'type', '0');
        assert.propertyVal(entries['buffer.txt'].props, 'mode', 420);
        assert.propertyVal(entries['buffer.txt'].props, 'size', 16384);
      });

      it('should append stream', function() {
        assert.property(entries, 'stream.txt');
        assert.propertyVal(entries['stream.txt'].props, 'path', 'stream.txt');
        assert.propertyVal(entries['stream.txt'].props, 'type', '0');
        assert.propertyVal(entries['stream.txt'].props, 'mode', 420);
        assert.propertyVal(entries['stream.txt'].props, 'size', 19);
      });

      it('should append directory', function() {
        assert.property(entries, 'directory/');
        assert.propertyVal(entries['directory/'].props, 'path', 'directory/');
        assert.propertyVal(entries['directory/'].props, 'type', '5');
        assert.propertyVal(entries['directory/'].props, 'mode', 493);
        assert.propertyVal(entries['directory/'].props, 'size', 0);
      });
    });
  });

  describe('zip', function() {
    describe('#append', function() {
      var actual = [];
      var archive;
      var entries = {};

      before(function(done) {
        archive = archiver('zip');
        var testStream = new WriteStream('tmp/plugin-zip-append.zip');

        testStream.on('close', function(entry) {
          yauzl.open('tmp/plugin-zip-append.zip', function(err, zip) {
            zip.on('entry', function(entry) {
              console.log(entry);
              actual.push(entry.fileName);
              entries[entry.fileName] = entry;
            });

            zip.on('close', function() {
              done();
            });
          });
        });

        archive.pipe(testStream);

        archive
          .append(testBuffer, { name: 'buffer.txt', date: testDate })
          .append(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate })
          .append(null, { name: 'directory/', date: testDate })
          .finalize();
      });

      it('should append multiple entries', function() {
        assert.isArray(actual);
        assert.lengthOf(actual, 3);
      });

      it('should append buffer', function() {
        assert.property(entries, 'buffer.txt');
        assert.propertyVal(entries['buffer.txt'], 'uncompressedSize', 16384);
      });

      it('should append stream', function() {
        assert.property(entries, 'stream.txt');
        assert.propertyVal(entries['stream.txt'], 'uncompressedSize', 19);
      });

      it('should append directory', function() {
        assert.property(entries, 'directory/');
        assert.propertyVal(entries['directory/'], 'uncompressedSize', 0);
      });
    });
  });
});