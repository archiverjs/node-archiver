# Archiver [![Build Status](https://secure.travis-ci.org/ctalkington/node-archiver.png?branch=master)](http://travis-ci.org/ctalkington/node-archiver)

Creates Archives (ZIP) via Node Streams. Depends on Node's build-in zlib module for compression available since version 0.6.3.

## Install

```bash
npm install archiver
```

You can also use `npm install archiver@devel` to test upcoming versions.

## API

#### createZip(options)

Creates an Archiver ZIP object. Options are passed to zlib.

#### archive.addFile(inputStream, options, callback)

Adds a file to the Archiver stream. At this moment, options must contain `name`. If the `store` option is set to true, the file will be added uncompressed.

#### archive.finalize(callback(written))

Finalizes the Archiver stream. When everything is done, callback is called with the total number of bytes in the archive.

## Example
```javascript
var fs = require('fs');

var archiver = require('archiver');

var out = fs.createWriteStream('out.zip');
var zip = archiver.createZip({ level: 1 });

zip.pipe(out);

zip.addFile(fs.createReadStream('file1.js'), { name: 'file1.js' }, function() {
  zip.addFile(fs.createReadStream('file2.js'), { name: 'file2.js' }, function() {
    zip.finalize(function(written) { console.log(written + ' total bytes written'); });
  });
});
```

## Contributing

see [CONTRIBUTING](https://github.com/ctalkington/node-archiver/blob/master/CONTRIBUTING.md)

## Changelog

see [CHANGELOG](https://github.com/ctalkington/node-archiver/blob/master/CHANGELOG)

## Credits
Originally inspired by Antoine van Wel's [node-zipstream](https://github.com/wellawaretech/node-zipstream).