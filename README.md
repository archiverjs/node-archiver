# Archiver v1.0.0

[![Build Status](https://travis-ci.org/archiverjs/node-archiver.svg?branch=master)](https://travis-ci.org/archiverjs/node-archiver) [![Build status](https://ci.appveyor.com/api/projects/status/38kqu3yp159nodxe/branch/master?svg=true)](https://ci.appveyor.com/project/ctalkington/node-archiver/branch/master)

a streaming interface for archive generation

Visit the [API documentation](http://archiverjs.com/docs) for a list of all methods available.

## Install

```bash
npm install archiver --save
```

## Usage

```js
var archiver = require('archiver');
var archive = archiver.create('zip', {}); // or archiver('zip', {});
```

### Creating a simple archive 

```js
var fs = require('fs')
var toDisk = fs.createWriteStream('myarchive.tar')

archiver
  .directory('some/dir/on/disk', '/')
  .file('dontforgetme.txt', '/iwont')
  .finalize()
  .pipe(toDisk)
```

## Formats

Archiver ships with out of the box support for TAR and ZIP archives.

You can register additional formats with `registerFormat`.

_Formats will be changing in the next few releases to implement a middleware approach._
