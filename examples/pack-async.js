var fs = require('fs');

var archiver = require('archiver');
var async = require('async');

var out = fs.createWriteStream('out.zip');
var archive = archiver.createZip();

archive.on('error', function(err) {
  console.log(err);
});

archive.pipe(out);

async.forEachSeries(['file1.js', 'file2.js'], function(file, next) {
  archive.addFile(fs.createReadStream(file), { name: file }, function(err) {
    next(err);
  });
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