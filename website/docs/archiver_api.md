---
id: "archiver"
title: "Archiver API"
sidebar_label: "Archiver"
---

## The `Archiver` class

```js
new Archiver(format, options)
```

### constructor
##### Parameters
- `format` - The archive format to use.
- `options` - CoreOptions | TransformOptions

### `abort`

```js
abort() → {this}
```

Aborts the archiving process, taking a best-effort approach, by:

* removing any pending queue tasks
* allowing any active queue workers to finish
* detaching internal module pipes
* ending both sides of the Transform stream

It will NOT drain any remaining sources.

### `append`

```js
append(source, data) → {this}
```

Appends an input source (text string, buffer, or stream) to the instance.

When the instance has received, processed, and emitted the input, the entry event is fired.

##### Parameters
- `source` - Buffer | Stream | String
- `data` - EntryData

### `directory`

```js
directory(dirpath, destpath, data) → {this}
```

Appends a directory and its files, recursively, given its dirpath.

##### Parameters

TBD

### `file`

```js
file(filepath, data) → {this}
```

TBD

##### Parameters

TBD

### `finalize`

```js
finalize() → {Promise}
```

TBD

##### Parameters

TBD

### `glob`

```js
glob(pattern, options, data) → {this}
```

TBD

##### Parameters

TBD

### `pointer`

```js
pointer() → {Number}
```

TBD

##### Parameters

TBD

### `setFormat`

```js
setFormat(format) → {this}
```

TBD

##### Parameters

TBD

### `setModule`

```js
setModule(module) → {this}
```

TBD

##### Parameters

TBD

### `symlink`

```js
symlink(filepath, target, mode) → {this}
```

TBD

##### Parameters

TBD
