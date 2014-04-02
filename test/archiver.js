/*global before,describe,it */
var fs = require('fs');
var PassThrough = require('stream').PassThrough || require('readable-stream/passthrough');
var WriteStream = fs.createWriteStream;

var assert = require('chai').assert;
var mkdir = require('mkdirp');

var common = require('./helpers/common');
var HashStream = common.HashStream;
var UnBufferedStream = common.UnBufferedStream;
var WriteHashStream = common.WriteHashStream;
var binaryBuffer = common.binaryBuffer;

var archiver = require('../lib/archiver');

var testDate = new Date('Jan 03 2013 14:26:38 GMT');
var testDate2 = new Date('Feb 10 2013 10:24:42 GMT');

describe('archiver', function() {
  before(function() {
    mkdir.sync('tmp');
  });

  describe('core', function() {
    describe('#file', function() {
      var actual;

      before(function(done) {
        var archive = archiver('json');
        var testStream = new WriteStream('tmp/file.json');

        testStream.on('close', function() {
          actual = common.readJSON('tmp/file.json');
          done();
        });

        archive.pipe(testStream);

        archive
          .file('test/fixtures/test.txt', { name: 'test.txt', date: testDate })
          .file('test/fixtures/test.txt')
          .finalize();
      });

      it('should append filepath', function() {
        assert.isArray(actual);
        assert.propertyVal(actual[0], 'name', 'test.txt');
        assert.propertyVal(actual[0], 'date', '2013-01-03T14:26:38.000Z');
        assert.propertyVal(actual[0], 'crc32', 585446183);
        assert.propertyVal(actual[0], 'size', 19);
      });

      it('should fallback to filepath when no name is set', function() {
        assert.isArray(actual);
        assert.propertyVal(actual[1], 'name', 'test/fixtures/test.txt');
      });
    });

    describe('#bulk', function() {
      var actual;

      before(function(done) {
        var archive = archiver('json');
        var testStream = new WriteStream('tmp/bulk.json');

        testStream.on('close', function() {
          actual = common.readJSON('tmp/bulk.json');
          done();
        });

        archive.pipe(testStream);

        archive
          .bulk([
            { expand: true, cwd: 'test/fixtures/directory/', src: '**', data: { prop: 'value' } }
          ])
          .finalize();
      });

      it('should append multiple entries', function() {
        assert.isArray(actual);
        assert.lengthOf(actual, 5);
        assert.propertyVal(actual[0], 'name', 'level0.txt');
        assert.propertyVal(actual[1], 'name', 'subdir/');
        assert.propertyVal(actual[2], 'name', 'subdir/level1.txt');
        assert.propertyVal(actual[3], 'name', 'subdir/subsub/');
        assert.propertyVal(actual[4], 'name', 'subdir/subsub/level2.txt');
      });

      it('should support passing data properties', function() {
        assert.propertyVal(actual[0], 'prop', 'value');
      });
    });
  });
});