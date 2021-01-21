---
id: "archiver"
title: "Archiver API"
sidebar_title: "API"
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

TBD

### `file`

TBD

### `finalize`

TBD

### `glob`

TBD

### `pointer`

TBD

### `setFormat`

TBD

### `setModule`

TBD

### `symlink`

TBD
