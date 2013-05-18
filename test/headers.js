/*global before,describe,it */
var fs = require('fs');

var assert = require('chai').assert;

var common = require('./helpers/common');

var tar = require('../lib/headers/tar');
var zip = require('../lib/headers/zip');

var testDate = new Date('Jan 03 2013 14:26:38 GMT');

describe('headers', function() {

  describe('tar', function() {
    var fileObj = {
      name: 'test.txt',
      date: testDate,
      comment: '',
      gid: '0000000',
      mode: '0000777',
      mtime: '12071312436',
      uid: '0000000',
      type: '0',
      size: '00000000023'
    };

    var fileFixture = fs.readFileSync('test/fixtures/headers/tar-file.bin');

    describe('#encode(type, object)', function() {

      describe('type->file', function() {
        var actual = tar.encode('file', fileObj);

        it('should return an instance of Buffer', function() {
          assert.instanceOf(actual, Buffer);
        });

        it('should have a length of 512 bytes', function() {
          assert.lengthOf(actual, 512);
        });

        it('should match provided fixture', function() {
          assert.equal(actual.toString(), fileFixture.toString());
        });
      });

    });

    describe('#decode(type, buffer)', function() {

      describe('type->file', function() {
        var actual = tar.decode('file', fileFixture);

        it('should match provided checksum', function() {
          assert.equal(actual.checksum, '007425');
        });
      });

    });

  });


  describe('zip', function() {
    var fileObj = {
      name: 'test.txt',
      date: testDate,
      comment: '',
      mode: null,
      store: true,
      lastModifiedDate: 1109619539,
      versionMadeBy: 20,
      versionNeededToExtract: 20,
      flags: 2056,
      compressionMethod: 0,
      uncompressedSize: 0,
      compressedSize: 0,
      offset: 0
    };

    var fileDescriptorObj = {
      crc32: 585446183,
      uncompressedSize: 19,
      compressedSize: 19,
    };

    var centralHeaderObj = {
      name: 'test.txt',
      date: testDate,
      store: true,
      comment: '',
      mode: null,
      lastModifiedDate: 1109619539,
      versionMadeBy: 20,
      versionNeededToExtract: 20,
      flags: 2056,
      compressionMethod: 0,
      uncompressedSize: 19,
      compressedSize: 19,
      offset: 0,
      crc32: 585446183
    };

    var centralFooterObj = {
      directoryRecordsDisk: 1,
      directoryRecords: 1,
      directorySize: 56,
      directoryOffset: 73,
      comment: ''
    };

    var fileFixture = fs.readFileSync('test/fixtures/headers/zip-file.bin');
    var fileDescriptorFixture = fs.readFileSync('test/fixtures/headers/zip-filedescriptor.bin');
    var centralHeaderFixture = fs.readFileSync('test/fixtures/headers/zip-centralheader.bin');
    var centralFooterFixture = fs.readFileSync('test/fixtures/headers/zip-centralfooter.bin');

    describe('#encode(type, object)', function() {

      describe('type->file', function() {
        var actual = zip.encode('file', fileObj);

        it('should return an instance of Buffer', function() {
          assert.instanceOf(actual, Buffer);
        });

        it('should match provided fixture', function() {
          assert.deepEqual(actual, fileFixture);
        });
      });

      describe('type->fileDescriptor', function() {
        var actual = zip.encode('fileDescriptor', fileDescriptorObj);

        it('should return an instance of Buffer', function() {
          assert.instanceOf(actual, Buffer);
        });

        it('should match provided fixture', function() {
          assert.deepEqual(actual, fileDescriptorFixture);
        });
      });

      describe('type->centralHeader', function() {
        var actual = zip.encode('centralHeader', centralHeaderObj);

        it('should return an instance of Buffer', function() {
          assert.instanceOf(actual, Buffer);
        });

        it('should match provided fixture', function() {
          assert.deepEqual(actual, centralHeaderFixture);
        });
      });

      describe('type->centralFooter', function() {
        var actual = zip.encode('centralFooter', centralFooterObj);

        it('should return an instance of Buffer', function() {
          assert.instanceOf(actual, Buffer);
        });

        it('should match provided fixture', function() {
          assert.deepEqual(actual, centralFooterFixture);
        });
      });

    });

    describe('#decode(type, buffer)', function() {

    });

  });

});