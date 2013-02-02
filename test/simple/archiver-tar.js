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
    var expected = 'e87af3cdd4b01bb72ebab46baa97ee1eb814a1d3';

    var hasher = new HashStream();
    var archive = archiver.createTar();

    if (fileOutput) {
      rimraf.sync('tmp/buffer.tar');
      var out = fs.createWriteStream('tmp/buffer.tar');

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

    archive.addFile(binaryBuffer(20000), {name: 'buffer.txt', date: date1}, function(err) {
      if (err) {
        throw err;
      }

      archive.finalize();
    });
  },

  stream: function(test) {
    test.expect(1);

    var actual;
    var expected = 'da02a931d670f725c0de20ef30b112b53d149a3d';

    var hasher = new HashStream();
    var archive = archiver.createTar();

    if (fileOutput) {
      rimraf.sync('tmp/stream.tar');
      var out = fs.createWriteStream('tmp/stream.tar');

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

    archive.addFile(fs.createReadStream('test/fixtures/test.txt'), {name: 'stream.txt', date: date1}, function(err) {
      if (err) {
        throw err;
      }

      archive.finalize();
    });
  },

  string: function(test) {
    test.expect(1);

    var actual;
    var expected = '333f843838ba5ee7727b3cc8afa017cab3d70d72';

    var hasher = new HashStream();
    var archive = archiver.createTar();

    if (fileOutput) {
      rimraf.sync('tmp/string.tar');
      var out = fs.createWriteStream('tmp/string.tar');

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

    archive.addFile('string', {name: 'string.txt', date: date1}, function(err) {
      if (err) {
        throw err;
      }

      archive.finalize();
    });
  }
};