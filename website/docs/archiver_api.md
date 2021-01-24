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
- `format` - String -  The archive format to use.
- `options` - CoreOptions | TransformOptions

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

- `source` - Buffer | Stream | String - The input source.
- `data` - EntryData

---

### directory

```js
directory(dirpath, destpath, data) → {this}
```

Appends a directory and its files, recursively, given its dirpath.

##### Parameters

- `dirpath` - String - The source directory path.
- `destpath` - String - The destination path within the archive.
- `data` - EntryData

---

### file

```js
file(filepath, data) → {this}
```

Appends a file given its filepath using a [lazystream](https://github.com/jpommerening/node-lazystream) wrapper to prevent issues with open file limits.

When the instance has received, processed, and emitted the file, the entry event is fired.

##### Parameters

- `filepath` - String - The source filepath.
- `data` - EntryData

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

- `pattern` - String - The [glob pattern](https://github.com/isaacs/minimatch) to match.
- `options` - Object - See [node-readdir-glob](https://github.com/yqnn/node-readdir-glob#options).
- `data` - EntryData

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

- `format` - String - The name of the format.

---

### setModule

```js
setModule(module) → {this}
```

Sets the module used for archiving.

##### Parameters

- `module` - Function - The function for archiver to interact with.

---

### symlink

```js
symlink(filepath, target, mode) → {this}
```

Appends a symlink to the instance.

This does NOT interact with filesystem and is used for programmatically creating symlinks.

##### Parameters

- `filepath` - String - The symlink path (within archive).
- `target` - String - The target path (within archive).
- `mode` - Number - The entry permissions.

## Format Registration

### registerFormat

```js
registerFormat(format, module)
```

Registers a format for use with archiver.

##### Parameters

- `format` - String - The name of the format.
- `module` - Function - The function for archiver to interact with.

##### module

```js
module(options)
```

The `module` function should consist of the following:

- a Readable Stream interface that contains the resulting archive data.
- a `module.prototype.append` function.
- a `module.prototype.finalize` function.

###### module.prototype.append

```js
module.prototype.append(source, data, callback) {
  // source: Buffer or Stream
  // data: entry (meta)data
  // callback: called when entry has been added to archive
  callback(err, data)
}
```

###### module.prototype.finalize

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

- `format` - String - The name of the format.
