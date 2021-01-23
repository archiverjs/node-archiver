---
id: "zipstream"
title: "ZipStream"
---

ZipStream is a streaming zip archive generator based on the ZipArchiveOutputStream prototype
found in the [compress-commons](https://www.npmjs.com/package/compress-commons) project.

It was originally created to be a successor to [zipstream](https://npmjs.org/package/zipstream).

## `ZipStream` Class

```js
new ZipStream(options)
```

### constructor

##### Parameters

- `options` - `Object`

### Methods

#### `entry`

Appends an entry given an input source (text string, buffer, or stream).

```js
entry(source, data, callback) → {this}
```

##### Parameters

- `source` - `Buffer | Stream | String`
- `data` - `Object`
- `callback` - `Function`
