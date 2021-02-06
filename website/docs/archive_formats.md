---
id: "archive-formats"
title: "Archive Formats"
sidebar_label: "Archive Formats"
---

## Built-in Formats

Archiver supports the following formats out of the box.

### ZIP

The [zip-stream](https://www.npmjs.com/package/zip-stream) package is used to produce ZIP archives.

### TAR

The [tar-stream](https://www.npmjs.com/package/tar-stream) package is used to produce TAR archives.

GZIP compression is also suppported.

### JSON

The JSON format is designed primarily for debugging and just collects and stringifys the entry data into JSON.

## Custom Formats

Archiver also supports the registration of custom archive formats.

The [API](/docs/archiver/#format-registration) for this is rather simple at this point but may change over time.
