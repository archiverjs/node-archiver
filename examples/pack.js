var fs = require('fs');

var archiver = require('archiver');

var out = fs.createWriteStream('out.zip'); // or out.tar
var archive = archiver.createZip(); // or createTar

archive.pipe(out);

archive.addFile(fs.createReadStream('file1.js'), {name: 'file1.js'}, function() {
  archive.addFile(fs.createReadStream('file2.js'), {name: 'file2.js'}, function() {
    archive.finalize(function(written) {
      console.log(written + ' total bytes written');
    });
  });
});