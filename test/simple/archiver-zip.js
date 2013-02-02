var fs = require('fs');

var mkdir = require('mkdirp');
var rimraf = require('rimraf');

var archiver = require('../../lib/archiver');
var common = require('../common');

var HashStream = common.HashStream;
var binaryBuffer = common.binaryBuffer;

var fileOutput = false;

var date1 = new Date('Jan 03 2013 14:26:38 GMT');

mkdir('tmp');

exports.input = {
  buffer: function(test) {
    test.expect(1);

    var actual;
    var expected = '21186aba17dc54480f7daa86427fe0a066128bd3';

    var hasher = new HashStream();
    var archive = archiver.createZip({
      forceUTC: true
    });

    if (fileOutput) {
      rimraf.sync('tmp/buffer.zip');
      var out = fs.createWriteStream('tmp/buffer.zip');

      archive.on('data', function(chunk) {
        out.write(chunk);
      });

      archive.on('end', function() {
        out.end();
      });
    }

    archive.pipe(hasher);

    hasher.on('close', function() {
      actual = hasher.digest;
      test.equals(actual, expected, 'data hex values should match.');
      test.done();
    });

    archive.addFile(binaryBuffer(20000), {name: 'buffer.txt', date: date1}).finalize();
  },

  stream: function(test) {
    test.expect(1);

    var actual;
    var expected = '588e21c54fce8e990bc0599d14257dd7ebdcde89';

    var hasher = new HashStream();
    var archive = archiver.createZip({
      forceUTC: true
    });

    if (fileOutput) {
      rimraf.sync('tmp/stream.zip');
      var out = fs.createWriteStream('tmp/stream.zip');

      archive.on('data', function(chunk) {
        out.write(chunk);
      });

      archive.on('end', function() {
        out.end();
      });
    }

    archive.pipe(hasher);

    hasher.on('close', function() {
      actual = hasher.digest;
      test.equals(actual, expected, 'data hex values should match.');
      test.done();
    });

    archive.addFile(fs.createReadStream('test/fixtures/test.txt'), {name: 'stream.txt', date: date1}).finalize();
  },

  string: function(test) {
    test.expect(1);

    var actual;
    var expected = '064110e4e3df1e44466195124b765ee5538f2e5a';

    var hasher = new HashStream();
    var archive = archiver.createZip({
      forceUTC: true
    });

    if (fileOutput) {
      rimraf.sync('tmp/string.zip');
      var out = fs.createWriteStream('tmp/string.zip');

      archive.on('data', function(chunk) {
        out.write(chunk);
      });

      archive.on('end', function() {
        out.end();
      });
    }

    archive.pipe(hasher);

    hasher.on('close', function() {
      actual = hasher.digest;
      test.equals(actual, expected, 'data hex values should match.');
      test.done();
    });

    archive.addFile('string', {name: 'string.txt', date: date1}).finalize();
  }
};

exports.feature = {
  comments: function(test) {
    test.expect(1);

    var actual;
    var expected = '6ba862d08622c841b48f1a6b6e26bbaa8b891ab5';

    var hasher = new HashStream();
    var archive = archiver.createZip({
      comment: 'this is a zip comment',
      forceUTC: true
    });

    if (fileOutput) {
      rimraf.sync('tmp/comments.zip');
      var out = fs.createWriteStream('tmp/comments.zip');

      archive.on('data', function(chunk) {
        out.write(chunk);
      });

      archive.on('end', function() {
        out.end();
      });
    }

    archive.pipe(hasher);

    hasher.on('close', function() {
      actual = hasher.digest;
      test.equals(actual, expected, 'data hex values should match.');
      test.done();
    });

    archive.addFile(binaryBuffer(20000), {name: 'buffer.txt', date: date1, comment: 'this is a file comment'}).finalize();
  },

  store: function(test) {
    test.expect(1);

    var actual;
    var expected = '94e3afa8b5318d82cc9d2eda36562c31b67f1f4d';

    var hasher = new HashStream();
    var archive = archiver.createZip({
      forceUTC: true
    });

    if (fileOutput) {
      rimraf.sync('tmp/store.zip');
      var out = fs.createWriteStream('tmp/store.zip');

      archive.on('data', function(chunk) {
        out.write(chunk);
      });

      archive.on('end', function() {
        out.end();
      });
    }

    archive.pipe(hasher);

    hasher.on('close', function() {
      actual = hasher.digest;
      test.equals(actual, expected, 'data hex values should match.');
      test.done();
    });

    archive.addFile(binaryBuffer(20000), {name: 'buffer.txt', date: date1, store: true}).finalize();
  }
};