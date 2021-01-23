---
id: "zipstream"
title: "ZipStream"
---

# ZipStream

ZipStream is a streaming zip archive generator based on the ZipArchiveOutputStream prototype
found in the [compress-commons](https://www.npmjs.com/package/compress-commons) project.

It was originally created to be a successor to [zipstream](https://npmjs.org/package/zipstream).

## Installation

ZipStream is available on [npm](https://www.npmjs.com/package/zip-stream).

`$ npm install zip-stream`

## ZipStream Class

```js
new ZipStream(options)
```

### Methods

#### constructor

##### Parameters

- `options` - `Object`

#### `entry`

Appends an entry given an input source (text string, buffer, or stream).

```js
entry(source, data, callback) → {this}
```

##### Parameters

- `source` - `Buffer | Stream | String`
- `data` - `Object`
- `callback` - `Function`

#### `finalize`

```js
finalize() → {void}
```

Finalizes the instance and prevents further appending to the archive structure (queue will continue til drained).

##### Parameters

None

#### `getBytesWritten`

```js
getBytesWritten() → {Number}
```

##### Parameters

None
