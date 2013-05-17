/*global describe,it */
var fs = require('fs');
var assert = require('chai').assert;

var common = require('./helpers/common');
var adjustDateByOffset = common.adjustDateByOffset;
var binaryBuffer = common.binaryBuffer;
var BinaryStream = common.BinaryStream;
var DeadEndStream = common.DeadEndStream;

var ChecksumStream = require('../lib/util/ChecksumStream');
var DeflateRawChecksum = require('../lib/util/DeflateRawChecksum');
var crc32 = require('../lib/util/crc32');
var utils = require('../lib/util');

var testBuffer = binaryBuffer(20000);

var testDate = new Date('Jan 03 2013 14:26:38 GMT');
var testDateOctal = 12071312436;
var testDateDos = 1109619539;

var testDate2 = new Date('Jan 03 2013 12:24:36 GMT-0400');
var testDateOctal2 = 12071330304;
var testDateDos2 = 1109623570;

var testTimezoneOffset = testDate.getTimezoneOffset();

describe('utils', function() {

  describe('ChecksumStream', function() {

    it('should checksum data while transforming data', function(done) {
      var binary = new BinaryStream(20000);
      var checksum = new ChecksumStream();
      var deadend = new DeadEndStream();

      checksum.on('end', function() {
        assert.equal(checksum.digest, -270675091);

        done();
      });

      checksum.pipe(deadend);
      binary.pipe(checksum);
    });

    it('should calculate data size while transforming data', function(done) {
      var binary = new BinaryStream(20000);
      var checksum = new ChecksumStream();
      var deadend = new DeadEndStream();

      checksum.on('end', function() {
        assert.equal(checksum.rawSize, 20000);

        done();
      });

      checksum.pipe(deadend);
      binary.pipe(checksum);
    });

  });


  describe('crc32', function() {

    describe('CRC32', function() {

      describe('#update(data)', function() {

        it('should update crc32 based on data', function() {
          var actual = crc32.createCRC32().update('testing checksum');

          assert.equal(actual.crc, 323269802);
        });

      });

      describe('#digest()', function() {

        it('should return crc32 digest', function() {
          var actual = crc32.createCRC32().update('testing checksum').digest();

          assert.equal(actual, -323269803);
        });

      });

    });

    describe('createCRC32()', function() {

      it('should create new instance of CRC32', function() {
        assert.instanceOf(crc32.createCRC32(), crc32.CRC32);
      });

    });

  });


  describe('DeflateRawChecksum', function() {

    it('should checksum data while writing', function(done) {
      var deflate = new DeflateRawChecksum();

      deflate.on('end', function() {
        assert.equal(deflate.digest, -270675091);

        done();
      });

      deflate.write(testBuffer);
      deflate.end();
    });

    it('should calculate data size while writing', function(done) {
      var deflate = new DeflateRawChecksum();

      deflate.on('end', function() {
        assert.equal(deflate.rawSize, 20000);

        done();
      });

      deflate.write(testBuffer);
      deflate.end();
    });

  });


  describe('index', function() {

    describe('convertDateTimeDos(input)', function() {

      it('should convert DOS input into Date instance', function() {
        var actual = adjustDateByOffset(utils.convertDateTimeDos(testDateDos), testTimezoneOffset);
        assert.deepEqual(actual, testDate);
      });

    });

    describe('convertDateTimeOctal(input)', function() {

      it('should convert octal input into Date instance', function() {
        assert.deepEqual(utils.convertDateTimeOctal(testDateOctal), testDate);
      });

    });

    describe('defaults(object)', function() {

      it('should default when object key is missing', function() {
        var actual = utils.defaults({ value1: true }, {
          value2: true
        });

        assert.deepEqual(actual, {
          value1: true,
          value2: true
        });
      });


      it('should default when object key contains null value', function() {
        var actual = utils.defaults({ value1: null }, {
          value1: true,
          value2: true
        });

        assert.deepEqual(actual, {
          value1: true,
          value2: true
        });
      });

    });

  });

});