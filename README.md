# Archiver v1.2.0

[![Build Status](https://travis-ci.org/archiverjs/node-archiver.svg?branch=master)](https://travis-ci.org/archiverjs/node-archiver) [![Build status](https://ci.appveyor.com/api/projects/status/38kqu3yp159nodxe/branch/master?svg=true)](https://ci.appveyor.com/project/ctalkington/node-archiver/branch/master)

a streaming interface for archive generation

Visit the [API documentation](http://archiverjs.com/docs) for a list of all methods available.

## Install

```bash
npm install archiver --save
```

## Quick Start

```js
var fs = require('fs');
var archiver = require('archiver');

var output = fs.createWriteStream(__dirname + '/example-output.zip');
var archive = archiver('zip');

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

var file1 = __dirname + '/file1.txt';
var file2 = __dirname + '/file2.txt';

archive
  .append(fs.createReadStream(file1), { name: 'file1.txt' })
  .append(fs.createReadStream(file2), { name: 'file2.txt' })
  .finalize();
```

## Formats

Archiver ships with out of the box support for TAR and ZIP archives.

You can register additional formats with `registerFormat`.

_Formats will be changing in the next few releases to implement a middleware approach._