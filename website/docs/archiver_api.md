---
id: "archiver"
title: "Archiver API"
sidebar_label: "Archiver"
---

## Archiver Class

```js
new Archiver(format, options);
```

### constructor

##### Parameters

- `format` - _String_ - The archive format to use.
- `options` - _Object_

#### Options

The `options` object may include the following properties as well as all [Stream.duplex options](https://nodejs.org/api/stream.html#stream_new_stream_duplex_options):

##### Core Options

- `statConcurrency` - _Number_ (default 4) - Sets the number of workers used to process the internal fs stat queue.

##### ZIP Options

- `comment` - _String_ - Sets the zip archive comment.
- `forceLocalTime` - _Boolean_ - Forces the archive to contain local file times instead of UTC.
- `forceZip64` - _Boolean_ - Forces the archive to contain ZIP64 headers.
- `namePrependSlash` - _Boolean_ - Prepends a forward slash to archive file paths.
- `store` - _Boolean_ - Sets the compression method to STORE.
- `zlib` - _Object_ - Passed to [zlib](https://nodejs.org/api/zlib.html#zlib_class_options) to control compression.

##### TAR Options

- `gzip` - _Boolean_ - Compress the tar archive using gzip.
- `gzipOptions` - _Object_ - Passed to [zlib](https://nodejs.org/api/zlib.html#zlib_class_options) to control compression.

See [tar-stream](https://www.npmjs.com/package/tar-stream) documentation for additional properties.

---

### abort

```js
abort() → {this}
```

Aborts the archiving process, taking a best-effort approach, by:

- removing any pending queue tasks
- allowing any active queue workers to finish
- detaching internal module pipes
- ending both sides of the Transform stream

It will NOT drain any remaining sources.

##### Parameters

None

---

### append

```js
append(source, data) → {this}
```

Appends an input source (text string, buffer, or stream) to the instance.

When the instance has received, processed, and emitted the input, the entry event is fired.

##### Parameters

- `source` - _Buffer | Stream | String_ - The input source.
- `data` - _Object_ - [The entry data](#entry-data).

---

### directory

```js
directory(dirpath, destpath, data) → {this}
```

Appends a directory and its files, recursively, given its dirpath.

##### Parameters

- `dirpath` - _String_ - The source directory path.
- `destpath` - _String_ - The destination path within the archive.
- `data` - _Object_ - [The entry data](#entry-data).

---

### file

```js
file(filepath, data) → {this}
```

Appends a file given its filepath using a [lazystream](https://github.com/jpommerening/node-lazystream) wrapper to prevent issues with open file limits.

When the instance has received, processed, and emitted the file, the entry event is fired.

##### Parameters

- `filepath` - _String_ - The source filepath.
- `data` - _Object_ - [The entry data](#entry-data).

---

### finalize

```js
finalize() → {Promise}
```

Finalizes the instance and prevents further appending to the archive structure (queue will continue til drained).

The `end`, `close` or `finish` events on the destination stream may fire right after calling this method so you should set listeners beforehand to properly detect stream completion.

##### Parameters

None

---

### glob

```js
glob(pattern, options, data) → {this}
```

Appends multiple files that match a glob pattern.

##### Parameters

- `pattern` - _String_ - The [glob pattern](https://github.com/isaacs/minimatch) to match.
- `options` - _Object_ - Options passed to [node-readdir-glob](https://github.com/yqnn/node-readdir-glob#options), plus an optional `cwd` property that sets the directory to read (defaults to `'.'`).
- `data` - _Object_ - [The entry data](#entry-data).

---

### pointer

```js
pointer() → {Number}
```

Returns the current length (in bytes) that has been emitted.

##### Parameters

None

---

### setFormat

```js
setFormat(format) → {this}
```

Sets the module format name used for archiving.

##### Parameters

- `format` - _String_ - The name of the format.

---

### setModule

```js
setModule(module) → {this}
```

Sets the module used for archiving.

##### Parameters

- `module` - _Function_ - The function for archiver to interact with.

---

### symlink

```js
symlink(filepath, target, mode) → {this}
```

Appends a symlink to the instance.

This does NOT interact with filesystem and is used for programmatically creating symlinks.

##### Parameters

- `filepath` - _String_ - The symlink path (within archive).
- `target` - _String_ - The target path (within archive).
- `mode` - _Number_ - The entry permissions.

## Events

#### Event: entry

Fires when the entry's input has been processed and appended to the archive.

The `entry` event object contains the following properties:

- [Entry Data](#entry-data)

#### Event: progress

The `progress` event object contains the following properties:

- `entries` - _Object_ - An object containing the following properties:
  - `total` - _Number_ - The number of entries that have been appended.
  - `processed` - _Number_ - The number of entries that have been processed.
- `fs` - Object - An object containing the following properties:
  - `totalBytes` - _Number_ - The number of bytes that have been appended. Calculated asynchronously and might not be accurate: it growth while entries are added. (based on fs.Stats)
  - `processedBytes` - _Number_ - The number of bytes that have been processed. (based on fs.Stats)

#### Event: error

The `error` event object contains the following properties:

- `message` - _String_ - The message of the error.
- `code` - _String_ - The error code assigned to this error.
- `data` - _Object_ - Additional data provided for reporting or debugging (where available).

#### Event: warning

The `warning` event object contains the following properties:

- `message` - _String_ - The message of the error.
- `code` - _String_ - The error code assigned to this error.
- `data` - _Object_ - Additional data provided for reporting or debugging (where available).

## Entry Data

The entry data object may contain the following properties:

#### Core Entry Properties

- `name` - _String_ - Sets the entry name including internal path.
- `date` - _String | Date_ - Sets the entry date.
- `mode` - _Number_ - Sets the entry permissions.
- `prefix` - _String_ - Sets a path prefix for the entry name. Useful when working with methods like [directory](#directory) or [glob](#glob).
- `stats` - _fs.Stats_ - Sets the stat data for this entry allowing for reduction of fs.stat calls.

#### ZIP Entry Properties

- `namePrependSlash` - _Boolean_ - Prepends a forward slash to archive file paths.
- `store` - _Boolean_ - Sets the compression method to STORE.

## Format Registration

### registerFormat

```js
registerFormat(format, module);
```

Registers a format for use with archiver.

##### Parameters

- `format` - _String_ - The name of the format.
- `module` - _Function_ - The function for archiver to interact with.

#### module

```js
module(options);
```

The `module` function should consist of the following:

- a Readable Stream interface that contains the resulting archive data.
- a `module.prototype.append` function.
- a `module.prototype.finalize` function.

##### module.prototype.append

```js
module.prototype.append(source, data, callback) {
  // source: Buffer or Stream
  // data: entry (meta)data
  // callback: called when entry has been added to archive
  callback(err, data)
}
```

##### module.prototype.finalize

```js
module.prototype.finalize() {}
```

---

### isFormatRegistered

```js
isRegisteredFormat(format);
```

Check if the format is already registered.

##### Parameters

- `format` - _String_ - The name of the format.
