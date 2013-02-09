var fs = require('fs');

var mkdir = require('mkdirp');

var archiver = require('../../lib/archiver');
var common = require('../common');

var HashStream = common.HashStream;
var WriteHashStream = common.WriteHashStream;
var binaryBuffer = common.binaryBuffer;

var date1 = new Date('Jan 03 2013 14:26:38 GMT');

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
      test.equals(testStream.digest, '21186aba17dc54480f7daa86427fe0a066128bd3', 'data hex values should match.');
      test.done();
    });

    archive.addFile(binaryBuffer(20000), {name: 'buffer.txt', date: date1}).finalize();
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
      test.equals(testStream.digest, '588e21c54fce8e990bc0599d14257dd7ebdcde89', 'data hex values should match.');
      test.done();
    });

    archive.addFile(fs.createReadStream('test/fixtures/test.txt'), {name: 'stream.txt', date: date1}).finalize();
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
      test.equals(testStream.digest, '064110e4e3df1e44466195124b765ee5538f2e5a', 'data hex values should match.');
      test.done();
    });

    archive.addFile('string', {name: 'string.txt', date: date1}).finalize();
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
      test.equals(testStream.digest, '6ba862d08622c841b48f1a6b6e26bbaa8b891ab5', 'data hex values should match.');
      test.done();
    });

    archive.addFile(binaryBuffer(20000), {name: 'buffer.txt', date: date1, comment: 'this is a file comment'}).finalize();
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
      test.equals(testStream.digest, '94e3afa8b5318d82cc9d2eda36562c31b67f1f4d', 'data hex values should match.');
      test.done();
    });

    archive.addFile(binaryBuffer(20000), {name: 'buffer.txt', date: date1, store: true}).finalize();
  }
};