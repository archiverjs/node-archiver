###Basic Usage

```js
archive.bulk([
  {src: ['src/bb.js', 'src/bbb.js'], dest: 'dest/b/', nonull: true},
  {src: ['src/bb1.js', 'src/bbb1.js'], dest: 'dest/b1/', filter: 'isFile'}
]);
```

### Supported Properties

#### Expand Properties
When you want to process many individual files, a few additional properties may be used to build a files list dynamically.

`expand` Set to `true` to enable the following options:

* `cwd` All `src` matches are relative to (but don't include) this path.
* `src` Pattern(s) to match, relative to the `cwd`.
* `dest` Destination path prefix.
* `ext` Replace any existing extension with this value in generated `dest` paths.
* `extDot` Used to indicate where the period indicating the extension is located. Can take either `'first'` (extension begins after the first period in the file name) or `'last'` (extension begins after the last period), and is set by default to `'first'`
* `flatten` Remove all path parts from generated `dest` paths.
* `rename` This function is called for each matched `src` file, (after extension renaming and flattening). The `dest`
and matched `src` path are passed in, and this function must return a new `dest` value.  If the same `dest` is returned
more than once, each `src` which used it will be added to an array of sources for it.

#### Files Array Format
This format supports multiple src-dest file mappings, while also allowing additional properties per mapping:

* `filter` Either a valid [fs.Stats method name](http://nodejs.org/docs/latest/api/fs.html#fs_class_fs_stats) or a function that is passed the matched `src` filepath and returns `true` or `false`.
* `nonull` If set to `true` then the operation will include non-matching patterns.
* `dot` Allow patterns to match filenames starting with a period, even if the pattern does not explicitly have a period in that spot.
* `matchBase` If set, patterns without slashes will be matched against the basename of the path if it contains slashes. For example, a?b would match the path `/xyz/123/acb`, but not `/xyz/acb/123`.
* `expand` Process a dynamic src-dest file mapping, see [Expand Properties](BULK.md#expand-properties) for more information.
* Other properties will be passed into the underlying libs as matching options. See the [node-glob][] and [minimatch][] documentation for more options.


### Globbing patterns
It is often impractical to specify all source filepaths individually, so `bulk()` supports filename expansion (also know as globbing) via the built-in [node-glob][] and [minimatch][] libraries.

While this isn't a comprehensive tutorial on globbing patterns, know that in a filepath:

* `*` matches any number of characters, but not `/`
* `?` matches a single character, but not `/`
* `**` matches any number of characters, including `/`, as long as it's the only thing in a path part
* `{}` allows for a comma-separated list of "or" expressions
* `!` at the beginning of a pattern will negate the match

All most people need to know is that `foo/*.js` will match all files ending with `.js` in the `foo/` subdirectory, but `foo/**/*.js` will match all files ending with `.js` in the `foo/` subdirectory _and all of its subdirectories_.

Also, in order to simplify otherwise complicated globbing patterns, `bulk()` allows arrays of file paths or globbing patterns to be specified. Patterns are processed in-order, with `!`-prefixed matches excluding matched files from the result set. The result set is uniqued.

For example:

```js
// You can specify single files:
{src: 'foo/this.js', dest: ...}
// Or arrays of files:
{src: ['foo/this.js', 'foo/that.js', 'foo/the-other.js'], dest: ...}
// Or you can generalize with a glob pattern:
{src: 'foo/th*.js', dest: ...}

// This single node-glob pattern:
{src: 'foo/{a,b}*.js', dest: ...}
// Could also be written like this:
{src: ['foo/a*.js', 'foo/b*.js'], dest: ...}

// All .js files, in foo/, in alpha order:
{src: ['foo/*.js'], dest: ...}
// Here, bar.js is first, followed by the remaining files, in alpha order:
{src: ['foo/bar.js', 'foo/*.js'], dest: ...}

// All files except for bar.js, in alpha order:
{src: ['foo/*.js', '!foo/bar.js'], dest: ...}
// All files in alpha order, but with bar.js at the end.
{src: ['foo/*.js', '!foo/bar.js', 'foo/bar.js'], dest: ...}
```

For more on glob pattern syntax, see the [node-glob][] and [minimatch][] documentation.

### Notes
Some properties/logic may need extended testing as the `bulk()` is very much a patchwork of code from [gruntjs]().

The following is known not to work:

* multiple src files to single dest file (ie concat)

*special thanks to [gruntjs]() team for the logic and docs behind the `bulk()` feature.*

[gruntjs]: http://gruntjs.com
[node-glob]: https://github.com/isaacs/node-glob
[minimatch]: https://github.com/isaacs/minimatch
