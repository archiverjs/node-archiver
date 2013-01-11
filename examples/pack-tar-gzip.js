var fs = require('fs');
var zlib = require('zlib');

var archiver = require('archiver');

var out = fs.createWriteStream('out.tar.gz');
var gzipper = zlib.createGzip();
var archive = archiver.createTar();

archive.on('error', function(err) {
  throw err;
});

archive.pipe(gzipper).pipe(out);

archive.addFile(fs.createReadStream('file1.js'), {name: 'file1.js'}, function(err) {
  if (err) {
    throw err;
  }

  archive.addFile(fs.createReadStream('file2.js'), {name: 'file2.js'}, function(err) {
    if (err) {
      throw err;
    }

    archive.finalize(function(err, written) {
      if (err) {
        throw err;
      }

      console.log(written + ' total bytes written'); // this wont be accurate since gzip happens after tar
    });
  });
});