var fs = require('fs');

var mkdir = require('mkdirp');

var archiver = require('../../lib/archiver');
var common = require('../common');

var HashStream = common.HashStream;
var WriteHashStream = common.WriteHashStream;
var binaryBuffer = common.binaryBuffer;

var date1 = new Date('Jan 03 2013 14:26:38 GMT');
var date2 = new Date('Feb 10 2013 10:24:42 GMT');
mkdir.sync('tmp');

exports.input = {
  buffer: function(test) {
    test.expect(1);

    var hasher = new HashStream();
    var archive = archiver.createZip({
      forceUTC: true
    });

    var testStream = new WriteHashStream('tmp/buffer.zip');

    archive.pipe(testStream);

    testStream.on('close', function() {
      test.equals(testStream.digest, 'b18540ab929d83f8ed6d419e6f306fa381aa1f4e', 'data hex values should match.');
      test.done();
    });

    archive.append(binaryBuffer(20000), {name: 'buffer.txt', date: date1}).finalize();
  },

  stream: function(test) {
    test.expect(1);

    var hasher = new HashStream();
    var archive = archiver.createZip({
      forceUTC: true
    });

    var testStream = new WriteHashStream('tmp/stream.zip');

    archive.pipe(testStream);

    testStream.on('close', function() {
      test.equals(testStream.digest, '7cf00d9442bf640be1a84cb6e96c24342349d953', 'data hex values should match.');
      test.done();
    });

    archive.append(fs.createReadStream('test/fixtures/test.txt'), {name: 'stream.txt', date: date1}).finalize();
  },

  string: function(test) {
    test.expect(1);

    var actual;
    var expected = '';

    var hasher = new HashStream();
    var archive = archiver.createZip({
      forceUTC: true
    });

    var testStream = new WriteHashStream('tmp/string.zip');

    archive.pipe(testStream);

    testStream.on('close', function() {
      test.equals(testStream.digest, '3de2c37ba3745618257f6816fe979ee565e24aa0', 'data hex values should match.');
      test.done();
    });

    archive.append('string', {name: 'string.txt', date: date1}).finalize();
  },

  multiple: function(test) {
    test.expect(1);

    var archive = archiver('zip', {
      forceUTC: true
    });
    var testStream = new WriteHashStream('tmp/multiple.zip');

    archive.pipe(testStream);

    testStream.on('close', function() {
      test.equals(testStream.digest, 'failing', 'data hex values should match.');
      test.done();
    });

    archive
      .append('string', {name: 'string.txt', date: date1})
      .append(binaryBuffer(20000), {name: 'buffer.txt', date: date2})
      .append(fs.createReadStream('test/fixtures/test.txt'), {name: 'stream.txt', date: date1, store: true})
      .finalize();
  }
};

exports.feature = {
  comments: function(test) {
    test.expect(1);

    var hasher = new HashStream();
    var archive = archiver.createZip({
      comment: 'this is a zip comment',
      forceUTC: true
    });

    var testStream = new WriteHashStream('tmp/comments.zip');

    archive.pipe(testStream);

    testStream.on('close', function() {
      test.equals(testStream.digest, 'b09223a2a00d21d84fd4d9a57a3a7fa451125146', 'data hex values should match.');
      test.done();
    });

    archive.append(binaryBuffer(20000), {name: 'buffer.txt', date: date1, comment: 'this is a file comment'}).finalize();
  },

  store: function(test) {
    test.expect(1);

    var hasher = new HashStream();
    var archive = archiver.createZip({
      forceUTC: true
    });

    var testStream = new WriteHashStream('tmp/store.zip');

    archive.pipe(testStream);

    testStream.on('close', function() {
      test.equals(testStream.digest, '09305770a3272cbcd7c151ee267cb1b0075dd29e', 'data hex values should match.');
      test.done();
    });

    archive.append(binaryBuffer(20000), {name: 'buffer.txt', date: date1, store: true}).finalize();
  }
};