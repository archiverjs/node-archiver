# Archiver v0.21.0 [![Build Status](https://travis-ci.org/archiverjs/node-archiver.svg?branch=master)](https://travis-ci.org/archiverjs/node-archiver) [![Build status](https://ci.appveyor.com/api/projects/status/38kqu3yp159nodxe/branch/master?svg=true)](https://ci.appveyor.com/project/ctalkington/node-archiver/branch/master)

a streaming interface for archive generation

## Install

```bash
npm install archiver --save
```

## Usage

```js
var archiver = require('archiver');
var archive = archiver.create('zip', {}); // or archiver('zip', {});
```

## API

Visit the [API documentation](http://archiverjs.com/docs) for a list of all methods available.

## Custom Formats

Archiver ships with out of the box support for TAR and ZIP archives.

You can register additional formats with `registerFormat`.

_Formats will be changing in the next few releases to implement a middleware approach._

## Libraries

Archiver makes use of several libraries/modules to avoid duplication of efforts.

- [zip-stream](https://npmjs.org/package/zip-stream)
- [tar-stream](https://npmjs.org/package/tar-stream)

## Things of Interest

- [Examples](https://github.com/archiverjs/node-archiver/blob/master/examples)
- [Changelog](https://github.com/archiverjs/node-archiver/releases)
- [Contributing](https://github.com/archiverjs/node-archiver/blob/master/CONTRIBUTING.md)
- [MIT License](https://github.com/archiverjs/node-archiver/blob/master/LICENSE-MIT)