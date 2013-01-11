var fs = require('fs');

var archiver = require('archiver');

var out = fs.createWriteStream('out.zip'); // or out.tar
var archive = archiver.createZip(); // or createTar

archive.on('error', function(err) {
  console.log(err);
});

archive.pipe(out);

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

      console.log(written + ' total bytes written');
    });
  });
});