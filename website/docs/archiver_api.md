---
id: "archiver"
title: "Archiver API"
sidebar_label: "Archiver"
---

## Archiver Class

```js
new Archiver(format, options)
```

### constructor

##### Parameters

- `format` - *String* - The archive format to use.
- `options` - *Object*

#### Options

The `options` object may include the following properties as well as all  [Stream.duplex options](https://nodejs.org/api/stream.html#stream_new_stream_duplex_options):

##### Core Options

- `statConcurrency` - *Number* (default 4) - Sets the number of workers used to process the internal fs stat queue.

##### ZIP Options

- `comment` - *String* - Sets the zip archive comment.
- `forceLocalTime` - *Boolean* - Forces the archive to contain local file times instead of UTC.
- `forceZip64` - *Boolean* - Forces the archive to contain ZIP64 headers.
- `namePrependSlash` - *Boolean* - Prepends a forward slash to archive file paths.
- `store` - *Boolean* - Sets the compression method to STORE.
- `zlib` - *Object* - Passed to [zlib](https://nodejs.org/api/zlib.html#zlib_class_options) to control compression.

##### TAR Options

- `gzip` - *Boolean* - Compress the tar archive using gzip.
- `gzipOptions` - *Object* - Passed to [zlib](https://nodejs.org/api/zlib.html#zlib_class_options) to control compression.

See [tar-stream](https://www.npmjs.com/package/tar-stream) documentation for additional properties.

---

### abort

```js
abort() → {this}
```

Aborts the archiving process, taking a best-effort approach, by:

* removing any pending queue tasks
* allowing any active queue workers to finish
* detaching internal module pipes
* ending both sides of the Transform stream

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

- `source` - *Buffer | Stream | String* - The input source.
- `data` - *Object* - [The entry data](#entry-data).

---

### directory

```js
directory(dirpath, destpath, data) → {this}
```

Appends a directory and its files, recursively, given its dirpath.

##### Parameters

- `dirpath` - *String* - The source directory path.
- `destpath` - *String* - The destination path within the archive.
- `data` - *Object* - [The entry data](#entry-data).

---

### file

```js
file(filepath, data) → {this}
```

Appends a file given its filepath using a [lazystream](https://github.com/jpommerening/node-lazystream) wrapper to prevent issues with open file limits.

When the instance has received, processed, and emitted the file, the entry event is fired.

##### Parameters

- `filepath` - *String* - The source filepath.
- `data` - *Object* - [The entry data](#entry-data).

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

- `pattern` - *String* - The [glob pattern](https://github.com/isaacs/minimatch) to match.
- `options` - *Object* - See [node-readdir-glob](https://github.com/yqnn/node-readdir-glob#options).
- `data` - *Object* - [The entry data](#entry-data).

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

- `format` - *String* - The name of the format.

---

### setModule

```js
setModule(module) → {this}
```

Sets the module used for archiving.

##### Parameters

- `module` - *Function* - The function for archiver to interact with.

---

### symlink

```js
symlink(filepath, target, mode) → {this}
```

Appends a symlink to the instance.

This does NOT interact with filesystem and is used for programmatically creating symlinks.

##### Parameters

- `filepath` - *String* - The symlink path (within archive).
- `target` - *String* - The target path (within archive).
- `mode` - *Number* - The entry permissions.

## Events

#### Event: entry

Fires when the entry's input has been processed and appended to the archive.

The `entry` event object contains the following properties:

- [Entry Data](#entry-data)

#### Event: progress

The `progress` event object contains the following properties:

- `entries` - *Object* - An object containing the following properties:
  - `total` - *Number* - The number of entries that have been appended.
  - `processed` - *Number* - The number of entries that have been processed.
- `fs` - Object - An object containing the following properties:
  - `totalBytes` - *Number* - The number of bytes that have been appended. Calculated asynchronously and might not be accurate: it growth while entries are added. (based on fs.Stats)
  - `processedBytes` - *Number* - The number of bytes that have been processed. (based on fs.Stats)

#### Event: error

The `error` event object contains the following properties:

- `message` - *String* - The message of the error.
- `code` - *String* - The error code assigned to this error.
- `data` - *Object* - Additional data provided for reporting or debugging (where available).

#### Event: warning

The `warning` event object contains the following properties:

- `message` - *String* - The message of the error.
- `code` - *String* - The error code assigned to this error.
- `data` - *Object* - Additional data provided for reporting or debugging (where available).

## Entry Data

The entry data object may contain the following properties:

#### Core Entry Properties

- `name` - *String* - Sets the entry name including internal path.
- `date` - *String | Date* - Sets the entry date.
- `mode` - *Number* - Sets the entry permissions.
- `prefix` - *String* - Sets a path prefix for the entry name. Useful when working with methods like [directory](#directory) or [glob](#glob).
- `stats` - *fs.Stats* - Sets the stat data for this entry allowing for reduction of fs.stat calls.

#### ZIP Entry Properties

- `namePrependSlash` - *Boolean* - Prepends a forward slash to archive file paths.
- `store` - *Boolean* - Sets the compression method to STORE.

## Format Registration

### registerFormat

```js
registerFormat(format, module)
```

Registers a format for use with archiver.

##### Parameters

- `format` - *String* - The name of the format.
- `module` - *Function* - The function for archiver to interact with.

#### module

```js
module(options)
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
isRegisteredFormat(format)
```

Check if the format is already registered.

##### Parameters

- `format` - *String* - The name of the format.
