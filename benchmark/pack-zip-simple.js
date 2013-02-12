var archiver    = require('../')
  , streamBench = require('stream-bench')
  , fs          = require('fs')

var archive = archiver.create('zip')

archive
  .addFile(fs.createReadStream(process.argv[2]), { name: 'large file' })
  .finalize()

var bench = streamBench({
  logReport: true,
  interval:  500,
  dump:      true
})

archive.pipe(bench)
