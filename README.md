# Archiver v0.6.1 [![Build Status](https://secure.travis-ci.org/ctalkington/node-archiver.png?branch=master)](http://travis-ci.org/ctalkington/node-archiver)

Creates Archives (Zip, Tar) via Node Streams.

## Install

```bash
npm install archiver --save
```

You can also use `npm install https://github.com/ctalkington/node-archiver/archive/master.tar.gz` to test upcoming versions.

## Archiver

#### create(format, options)

Creates an Archiver instance based on the format (zip, tar, etc) passed. Parameters can be passed directly to `Archiver` constructor for convenience.

#### registerFormat(format, module)

Registers an archive format. Format modules are essentially transform streams with a few required methods. They will be further documented once a formal spec is in place.

### Instance Methods

#### append(input, data)

Appends an input source (text string, buffer, or stream) to the instance. When the instance has received, processed, and emitted the input, the `entry` event is fired.

Replaced `#addFile` in v0.5.

```js
archive.append('string', { name:'string.txt' });
archive.append(new Buffer('string'), { name:'buffer.txt' });
archive.append(fs.createReadStream('mydir/file.txt'), { name:'stream.txt' });
```

#### bulk(mappings)

Appends multiple files from passed array of src-dest file mappings, based on [Grunt's "Files Array" format](http://gruntjs.com/configuring-tasks#files-array-format). A lazystream wrapper is used to prevent issues with open file limits.

[Globbing patterns](http://gruntjs.com/configuring-tasks#globbing-patterns) and [multiple properties](http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically) are supported through use of the [file-utils](https://github.com/SBoudrias/file-utils) package, based on Grunt's file utilities. Please note that multiple src files to single dest file (ie concat) is not supported.

The `data` property can be set (per src-dest mapping) to define file data for matched files.

```js
archive.bulk([
  { src: ['mydir/**'], data: { date: new Date() } },
  { expand: true, cwd: 'mydir', src: ['**'], dest: 'newdir' }
]);
```

#### file(filepath, data)

Appends a file given its filepath. Uses a lazystream wrapper to prevent issues with open file limits. When the instance has received, processed, and emitted the file, the `entry` event is fired.

```js
archive.file('mydir/file.txt', { name:'file.txt' });
```

#### finalize()

Finalizes the instance. You should listen for the `end`/`close`/`finish` of the destination stream to properly detect completion.

#### pointer()

Returns the current byte length emitted by archiver. Use this in your end callback to log generated size.

## Events

Each instance is a node `Transform` stream and inherits all its events. Events listed here are custom.

#### entry

Fired when the input has been received, processed, and emitted. Passes file data as first argument.

## Zip

### Options

#### comment `string`

Sets the zip comment.

#### forceUTC `boolean`

If true, forces the file date and time to UTC. Helps with testing across timezones.

#### store `boolean`

If true, all file contents will be archived without compression by default.

#### zlib `object`

Passed to node's [zlib](http://nodejs.org/api/zlib.html#zlib_options) module to control compression. Options may vary by node version.

### File Data

#### name `string` `required`

Sets the file name including internal path.

#### date `string|Date`

Sets the file date. This can be any valid date string or instance. Defaults to current time in locale.

#### store `boolean`

If true, file contents will be archived without compression.

#### comment `string`

Sets the file comment.

#### mode `number`

Sets the file permissions. (experimental)

## Tar

### Options

#### recordSize `number`

Sets the size (in bytes) of each record in a block, default is 512 (for advanced users only).

#### recordsPerBlock `number`

Sets the number of records in a block, default is 20 (for advanced users only).

### File Data

#### name `string` `required`

Sets the file name including internal path.

#### date `string|Date`

Sets the file date. This can be any valid date string or instance. Defaults to current time in locale.

#### mode `number`

Sets the file permissions. Defaults to 0664.

## Things of Interest

- [Examples](https://github.com/ctalkington/node-archiver/blob/master/examples)
- [Changelog](https://github.com/ctalkington/node-archiver/releases)
- [Archive Formats](https://github.com/ctalkington/node-archiver/blob/master/formats)
- [Contributing](https://github.com/ctalkington/node-archiver/blob/master/CONTRIBUTING.md)
- [MIT License](https://github.com/ctalkington/node-archiver/blob/master/LICENSE-MIT)

## Credits

Concept inspired by Antoine van Wel's [node-zipstream](https://github.com/wellawaretech/node-zipstream).

Tar inspired by isaacs's [node-tar](https://github.com/isaacs/node-tar).
