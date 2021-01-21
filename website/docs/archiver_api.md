---
id: "archiver"
title: ""
---

## The `Archiver` class

```js
new Archiver(format, options)
```

### constructor
##### Parameters
- `format` - The archive format to use.
- `options` - CoreOptions | TransformOptions

### `Archiver.prototype.abort`

```js
abort()
```

Aborts the archiving process, taking a best-effort approach, by:

* removing any pending queue tasks
* allowing any active queue workers to finish
* detaching internal module pipes
* ending both sides of the Transform stream

It will NOT drain any remaining sources.

### `Archiver.prototype.append`

TBD

### `Archiver.prototype.directory`

TBD

### `Archiver.prototype.file`

TBD

### `Archiver.prototype.finalize`

TBD

### `Archiver.prototype.glob`

TBD

### `Archiver.prototype.pointer`

TBD

### `Archiver.prototype.setFormat`

TBD

### `Archiver.prototype.setModule`

TBD

### `Archiver.prototype.symlink`

TBD
