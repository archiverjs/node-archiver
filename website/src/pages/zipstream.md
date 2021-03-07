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

### constructor

##### Parameters

- `options` - Object

The `options` object may contain the following properties:

- `comment` - *String* - Sets the zip archive comment.
- `forceLocalTime` - *Boolean* - Forces the archive to contain local file times instead of UTC.
- `forceZip64` - *Boolean* - Forces the archive to contain ZIP64 headers.
- `namePrependSlash` - *Boolean* - Prepends a forward slash to archive file paths.
- `store` - *Boolean* - Sets the compression method to STORE.
- `zlib` - *Object* - Passed to [zlib](https://nodejs.org/api/zlib.html#zlib_class_options) to control compression

---

### entry

Appends an entry given an input source (text string, buffer, or stream).

```js
entry(source, data, callback) → {this}
```

##### Parameters

- `source` - *Buffer | Stream | String* - The input source.
- `data` - *Object* - The entry data.
- `callback` - *Function*

The `data` object may contain the following properties:

- `name` - *String* - The entry name including internal path.
- `comment` - *String* - The entry comment.
- `date` - *String | Date* - The entry date.
- `mode` - *Number* - The entry permissions.
- `namePrependSlash` - *Boolean* - Prepends a forward slash to archive file paths.
- `store` - *Boolean* - The compression method to STORE.
- `type` - *String* - The entry type. Defaults to `directory` if name ends with trailing slash.

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
