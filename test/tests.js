var crypto = require('crypto');
var fs = require('fs');

var archiver = require('../lib/archiver');

var fileOutput = true;

module.exports = {
  tarBuffer: function(test) {
    test.expect(1);

    var actual;
    var expected = 'fc9f19920f1ac82fca15f6b5d9f4d0bba4d4341f';

    var tar = archiver.createTar();

    var hash = crypto.createHash('sha1');
    var archive = archiver.createTar();

    if (fileOutput) {
      var out = fs.createWriteStream('tmp/buffer.tar');
      archive.pipe(out);
    }

    var buffer = new Buffer(20000);

    for (var i = 0; i < 20000; i++) {
      buffer.writeUInt8(i&255, i);
    }

    archive.addFile(buffer, {name: 'buffer.txt', mtime: 1354279637}, function() {
      archive.finalize();
    });

    archive.on('error', function(err) {
      throw err;
    });

    archive.on('data', function(data) {
      hash.update(data);
    });

    archive.on('end', function() {
      actual = hash.digest('hex');
      test.equals(actual, expected, 'data hex values should match.');
      test.done();
    });
  },

  tarString: function(test) {
    var actual;
    var expected = 'cce858ca0ed86f5ef3ca0fe790ac105551a54a8a';

    var tar = archiver.createTar();

    var hash = crypto.createHash('sha1');
    var archive = archiver.createTar();

    if (fileOutput) {
      var out = fs.createWriteStream('tmp/string.tar');
      archive.pipe(out);
    }

    archive.addFile('string', {name: 'string.txt', mtime: 1354279637}, function() {
      archive.finalize();
    });

    archive.on('error', function(err) {
      throw err;
    });

    archive.on('data', function(data) {
      hash.update(data);
    });

    archive.on('end', function() {
      actual = hash.digest('hex');
      test.equals(actual, expected, 'data hex values should match.');
      test.done();
    });
  },

  zipBuffer: function(test) {
    test.expect(1);

    var actual;
    var expected = 'e1f3b7b48a488f0aea0e1774a9a0dac7d5d3a642';

    var hash = crypto.createHash('sha1');
    var archive = archiver.createZip({level: 1});

    if (fileOutput) {
      var out = fs.createWriteStream('tmp/buffer.zip');
      archive.pipe(out);
    }

    var buffer = new Buffer(20000);

    for (var i = 0; i < 20000; i++) {
      buffer.writeUInt8(i&255, i);
    }

    archive.addFile(buffer, {name: 'buffer.txt', lastModifiedDate: 1049430016}, function() {
      archive.finalize();
    });

    archive.on('error', function(err) {
      throw err;
    });

    archive.on('data', function(data) {
      hash.update(data);
    });

    archive.on('end', function() {
      actual = hash.digest('hex');
      test.equals(actual, expected, 'data hex values should match.');
      test.done();
    });
  },

  zipStore: function(test) {
    test.expect(1);

    var actual;
    var expected = '1ea58034c99816b8028d42a4d49eb4f626335462';

    var hash = crypto.createHash('sha1');
    var archive = archiver.createZip();

    if (fileOutput) {
      var out = fs.createWriteStream('tmp/store.zip');
      archive.pipe(out);
    }

    // create a buffer and fill it
    var buffer = new Buffer(20000);

    for (var i = 0; i < 20000; i++) {
      buffer.writeUInt8(i&255, i);
    }

    archive.addFile(buffer, {name: 'buffer.txt', lastModifiedDate: 1049430016, store: true}, function() {
      archive.finalize();
    });

    archive.on('error', function(err) {
      throw err;
    });

    archive.on('data', function(data) {
      hash.update(data);
    });

    archive.on('end', function() {
      actual = hash.digest('hex');
      test.equals(actual, expected, 'data hex values should match.');
      test.done();
    });
  },

  zipString: function(test) {
    test.expect(1);

    var actual;
    var expected = 'c639c2cf6e664dc00c06cb2ebb70ed2e38521946';

    var hash = crypto.createHash('sha1');
    var archive = archiver.createZip({level: 1});

    var out = fs.createWriteStream('tmp/string.zip');
    archive.pipe(out);

    archive.addFile('string', {name: 'string.txt', lastModifiedDate: 1049430016}, function() {
      archive.finalize();
    });

    archive.on('error', function(err) {
      throw err;
    });

    archive.on('data', function(data) {
      hash.update(data);
    });

    archive.on('end', function() {
      actual = hash.digest('hex');
      test.equals(actual, expected, 'data hex values should match.');
      test.done();
    });
  }
};