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
    var expected = 'b18540ab929d83f8ed6d419e6f306fa381aa1f4e';

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
    var expected = 'd7e3970142a06d4a87fbd6458284eeaf8f5de907';

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
    var expected = '3de2c37ba3745618257f6816fe979ee565e24aa0';

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

    archive.addFile('string', {name: 'string.txt', date: date1}, function(err) {
      if (err) {
        throw err;
      }

      archive.finalize();
    });
  }
};

exports.feature = {
  comments: function(test) {
    test.expect(1);

    var actual;
    var expected = 'b09223a2a00d21d84fd4d9a57a3a7fa451125146';

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

    archive.addFile(binaryBuffer(20000), {name: 'buffer.txt', date: date1, comment: 'this is a file comment'}, function(err) {
      if (err) {
        throw err;
      }

      archive.finalize();
    });
  },

  store: function(test) {
    test.expect(1);

    var actual;
    var expected = '09305770a3272cbcd7c151ee267cb1b0075dd29e';

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

    archive.addFile(binaryBuffer(20000), {name: 'buffer.txt', date: date1, store: true}, function(err) {
      if (err) {
        throw err;
      }

      archive.finalize();
    });
  }
};