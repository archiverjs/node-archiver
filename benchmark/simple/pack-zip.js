var fs = require('fs');

var mkdir = require('mkdirp');
var streamBench = require('stream-bench');

var archiver = require('../../lib/archiver');
var common = require('../common');

var binaryBuffer = common.binaryBuffer;

var archive = archiver('zip');
var file;

if (!process.argv[2]) {
  mkdir.sync('tmp');

  file = 'tmp/1mb.dat';
  fs.writeFileSync(file, binaryBuffer(1024 * 1024));
} else {
  file = process.argv[2];
}

archive
  .addFile(fs.createReadStream(file), { name: 'large file' })
  .finalize();

var bench = streamBench({
  logReport: true,
  interval:  500,
  dump:      true
});

archive.pipe(bench);