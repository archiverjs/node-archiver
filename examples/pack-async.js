var fs = require('fs');

var archiver = require('archiver');
var async = require('async');

var out = fs.createWriteStream('out.zip');
var archive = archiver.createZip();

archive.pipe(out);

archive.on('error', function(err) {
  console.log(err);
  // then handle exit process or such
});

async.forEachSeries(['file1.js', 'file2.js'], function(file, next) {
  archive.addFile(fs.createReadStream(file), { name: file }, function() {
    next();
  });
}, function(err) {
  archive.finalize(function(written) {
    console.log(written + ' total bytes written');
  });
});