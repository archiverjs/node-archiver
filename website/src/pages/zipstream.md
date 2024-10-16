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
new ZipStream(options);
```

### constructor

##### Parameters

- `options` - Object

The `options` object may contain the following properties:

- `comment` - _String_ - Sets the zip archive comment.
- `forceLocalTime` - _Boolean_ - Forces the archive to contain local file times instead of UTC.
- `forceZip64` - _Boolean_ - Forces the archive to contain ZIP64 headers.
- `namePrependSlash` - _Boolean_ - Prepends a forward slash to archive file paths.
- `store` - _Boolean_ - Sets the compression method to STORE.
- `zlib` - _Object_ - Passed to [zlib](https://nodejs.org/api/zlib.html#zlib_class_options) to control compression

---

### entry

Appends an entry given an input source (text string, buffer, or stream).

```js
entry(source, data, callback) → {this}
```

##### Parameters

- `source` - _Buffer | Stream | String_ - The input source.
- `data` - _Object_ - The entry data.
- `callback` - _Function_

The `data` object may contain the following properties:

- `name` - _String_ - The entry name including internal path.
- `comment` - _String_ - The entry comment.
- `date` - _String | Date_ - The entry date.
- `mode` - _Number_ - The entry permissions.
- `namePrependSlash` - _Boolean_ - Prepends a forward slash to archive file paths.
- `store` - _Boolean_ - The compression method to STORE.
- `type` - _String_ - The entry type. Defaults to `directory` if name ends with trailing slash.

---

### finalize

```js
finalize() → {void}
```

Finalizes the instance and prevents further appending to the archive structure (queue will continue til drained).

##### Parameters

None

---

### getBytesWritten

```js
getBytesWritten() → {Number}
```

##### Parameters

None
