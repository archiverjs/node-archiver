var fs = require('fs');

var archiver = require('archiver');
var async = require('async');

var out = fs.createWriteStream('out.zip'); // or out.tar
var archive = archiver.create('zip');

archive.on('error', function(err) {
  throw err;
});

archive.pipe(out);

var a = __dirname + '/file1.txt';
var b = __dirname + '/file2.txt';

async.forEachSeries([a, b], function(file, cb) {
  archive.append(fs.createReadStream(file), { name: file }, cb);
}, function(err) {
  if (err) {
    throw err;
  }

  archive.finalize(function(err, written) {
    if (err) {
      throw err;
    }

    console.log(written + ' total bytes written');
  });
});
