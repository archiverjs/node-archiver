# Archiver v0.3.0-alpha [![Build Status](https://secure.travis-ci.org/ctalkington/node-archiver.png?branch=master)](http://travis-ci.org/ctalkington/node-archiver)

Creates Archives (Zip, Tar) via Node Streams. Depends on Node's build-in zlib module for compression available since version 0.6.3.

## Install

```bash
npm install archiver --save
```

You can also use `npm install https://github.com/ctalkington/node-archiver/archive/master.tar.gz` to test upcoming versions.


## Core

### Methods

#### create(type, options)

Creates an Archiver instance based on the type (ie zip/tar) passed.

#### createZip(options)

Creates an Archiver Zip instance.

#### createTar(options)

Creates an Archiver Tar instance.

### Instance Methods

#### addFile(input, data, callback(err))

Adds a file to the instance's stream. Input can be in the form of a text string, buffer, or stream. When instance's stream has received, processed, and emitted (as data) the input, callback is fired.

#### finalize(callback(err, bytesWritten))

Finalizes the instance's stream. When stream has closed, callback is fired.

## Zip

### Options

#### comment `string`

Sets zip comment.

#### forceUTC `boolean`

If true, forces file date and time to UTC. Helps with testing across timezones.

#### zlib `object`

Passed to node's [zlib](http://nodejs.org/api/zlib.html#zlib_options) module to control compression. Options may vary by node version.

### File Data

#### name `string` `required`

Sets file name.

#### date `string`

Sets file date.

#### store `boolean`

If true, zip contents will be stored without compression.

#### comment `string`

Sets file comment.

## Tar (beta)

### Options

#### recordSize `number`

Sets the size (in bytes) of each record in a block, default is 512 (for advanced users only).

#### recordsPerBlock `number`

Sets number of records in a block, default is 20 (for advanced users only).

### File Data

#### name `string` `required`

Sets file name.

#### date `string`

Sets file date.

## Examples

Here are a few examples to get you started.

* [basic packing](https://github.com/ctalkington/node-archiver/blob/master/examples/pack.js)
* [basic packing with async module](https://github.com/ctalkington/node-archiver/blob/master/examples/pack-async.js)
* [tar packing wtih gzip](https://github.com/ctalkington/node-archiver/blob/master/examples/pack-tar-gzip.js)

Take a peek at the [examples](https://github.com/ctalkington/node-archiver/blob/master/example) folder for a complete listing.

## Contributing

see [CONTRIBUTING](https://github.com/ctalkington/node-archiver/blob/master/CONTRIBUTING.md)

## Changelog

see [CHANGELOG](https://github.com/ctalkington/node-archiver/blob/master/CHANGELOG)

## Credits
Originally inspired by Antoine van Wel's [node-zipstream](https://github.com/wellawaretech/node-zipstream).