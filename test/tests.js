var crypto = require('crypto');

var archive = require('../lib/archive');

module.exports = {
  buffer: function(test) {
    test.expect(1);

    var hash = crypto.createHash('sha1');
    var zip = archive.createZip({level: 1});

    // create a buffer and fill it
    var buf = new Buffer(20000);

    for (var i = 0; i < 20000; i++) {
      buf.writeUInt8(i&255, i);
    }

    zip.addFile(buf, {name: 'buffer.out', date: new Date('April 13, 2011 UTC')}, function() {
      zip.finalize();
    });

    zip.on('data', function(data) {
      hash.update(data);
    });

    zip.on('end', function() {
      var digest = hash.digest('hex');
      test.equals(digest, 'db7dab1aa8193fbd9fb0c2af99e091f485f60af1', 'data hex values should match.');
      test.done();
    });
  },

  store: function(test) {
    test.expect(1);

    var hash = crypto.createHash('sha1');
    var zip = archive.createZip({level: 1});

    // create a buffer and fill it
    var buf = new Buffer(20000);

    for (var i = 0; i < 20000; i++) {
      buf.writeUInt8(i&255, i);
    }

    zip.addFile(buf, {name: 'buffer.out', date: new Date('April 13, 2011 UTC'), store: true}, function() {
      zip.finalize();
    });

    zip.on('data', function(data) {
      hash.update(data);
    });

    zip.on('end', function() {
      var digest = hash.digest('hex');
      test.equals(digest, '57b4c651df09406db0267094aa0d58485cb381e2', 'data hex values should match.');
      test.done();
    });
  }
};