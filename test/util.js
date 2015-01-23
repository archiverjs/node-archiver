/*global describe,it */
var fs = require('fs');
var assert = require('chai').assert;

var Stream = require('stream').Stream;
var Readable = require('readable-stream').Readable;
var Writable = require('readable-stream').Writable;
var PassThrough = require('readable-stream').PassThrough;

var helpers = require('./helpers');
var adjustDateByOffset = helpers.adjustDateByOffset;
var binaryBuffer = helpers.binaryBuffer;
var BinaryStream = helpers.BinaryStream;
var DeadEndStream = helpers.DeadEndStream;
var UnBufferedStream = helpers.UnBufferedStream;

var utils = require('../lib/util');

var testBuffer = binaryBuffer(20000);

var testDateString = 'Jan 03 2013 14:26:38 GMT';
var testDate = new Date(testDateString);
var testDateEpoch = 1357223198;
var testDateOctal = 12071312436;

var testTimezoneOffset = testDate.getTimezoneOffset();

describe('utils', function() {

  describe('index', function() {

    describe('dateify(dateish)', function() {
      it('should return an instance of Date', function() {
        assert.instanceOf(utils.dateify(testDate), Date);
        assert.instanceOf(utils.dateify(testDateString), Date);
        assert.instanceOf(utils.dateify(null), Date);
      });

      it('should passthrough an instance of Date', function() {
        assert.deepEqual(utils.dateify(testDate), testDate);
      });

      it('should convert dateish string to an instance of Date', function() {
        assert.deepEqual(utils.dateify(testDateString), testDate);
      });
    });

    describe('defaults(object, source, guard)', function() {
      it('should default when object key is missing', function() {
        var actual = utils.defaults({ value1: true }, {
          value2: true
        });

        assert.deepEqual(actual, {
          value1: true,
          value2: true
        });
      });
    });

    describe('isStream(source)', function() {
      it('should return false if source is not a stream', function() {
        assert.notOk(utils.isStream('string'));
        assert.notOk(utils.isStream(new Buffer(2)));
      });

      it('should return true if source is a stream', function() {
        assert.ok(utils.isStream(new Stream()));

        assert.ok(utils.isStream(new Readable()));
        assert.ok(utils.isStream(new Writable()));
        assert.ok(utils.isStream(new PassThrough()));

        assert.ok(utils.isStream(new UnBufferedStream()));
        assert.ok(utils.isStream(new DeadEndStream()));
      });
    });

    describe('normalizeInputSource(source)', function() {
      it('should normalize strings to an instanceOf Buffer', function() {
        var normalized = utils.normalizeInputSource('some string');

        assert.instanceOf(normalized, Buffer);
      });

      it('should normalize older unbuffered streams', function() {
        var noBufferStream = new UnBufferedStream();
        var normalized = utils.normalizeInputSource(noBufferStream);

        assert.instanceOf(normalized, PassThrough);
      });
    });

    describe('sanitizePath(filepath)', function() {
      it('should sanitize filepath', function() {
        assert.equal(utils.sanitizePath('\\this/path//file.txt'), 'this/path/file.txt');
        assert.equal(utils.sanitizePath('/this/path/file.txt'), 'this/path/file.txt');
        assert.equal(utils.sanitizePath('c:\\this\\path\\file.txt'), 'c/this/path/file.txt');
        assert.equal(utils.sanitizePath('./this\\path\\file.txt'), 'this/path/file.txt');
        assert.equal(utils.sanitizePath('../this\\path\\file.txt'), 'this/path/file.txt');
      });
    });

    describe('trailingSlashIt(str)', function() {
      it('should add trailing slash when missing', function() {
        assert.equal(utils.trailingSlashIt('this/path'), 'this/path/');
        assert.equal(utils.trailingSlashIt('this/path/'), 'this/path/');
      });
    });

    describe('unixifyPath(filepath)', function() {
      it('should unixify filepath', function() {
        assert.equal(utils.unixifyPath('this\\path\\file.txt'), 'this/path/file.txt');
      });
    });

    describe('walkdir(dirpath, base, callback)', function() {
      it('should walk a directory', function(done) {
        utils.walkdir('test/fixtures/directory', function(err, results) {
          if (err) {
            return done(err);
          }

          assert.isArray(results);

          done();
        });
      });
    });

  });

});