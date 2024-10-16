import engine from "zip-stream";

/**
 * ZIP Format Plugin
 *
 * @module plugins/zip
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
export default class Zip {
  /**
   * @constructor
   * @param {ZipOptions} [options]
   * @param {String} [options.comment] Sets the zip archive comment.
   * @param {Boolean} [options.forceLocalTime=false] Forces the archive to contain local file times instead of UTC.
   * @param {Boolean} [options.forceZip64=false] Forces the archive to contain ZIP64 headers.
   * @param {Boolean} [options.namePrependSlash=false] Prepends a forward slash to archive file paths.
   * @param {Boolean} [options.store=false] Sets the compression method to STORE.
   * @param {Object} [options.zlib] Passed to [zlib]{@link https://nodejs.org/api/zlib.html#zlib_class_options}
   */
  constructor(options) {
    options = this.options = {
      comment: "",
      forceUTC: false,
      namePrependSlash: false,
      store: false,
      ...options,
    };
    this.engine = new engine(options);
  }
  /**
   * @param  {(Buffer|Stream)} source
   * @param  {ZipEntryData} data
   * @param  {String} data.name Sets the entry name including internal path.
   * @param  {(String|Date)} [data.date=NOW()] Sets the entry date.
   * @param  {Number} [data.mode=D:0755/F:0644] Sets the entry permissions.
   * @param  {String} [data.prefix] Sets a path prefix for the entry name. Useful
   * when working with methods like `directory` or `glob`.
   * @param  {fs.Stats} [data.stats] Sets the fs stat data for this entry allowing
   * for reduction of fs stat calls when stat data is already known.
   * @param  {Boolean} [data.store=ZipOptions.store] Sets the compression method to STORE.
   * @param  {Function} callback
   * @return void
   */
  append(source, data, callback) {
    this.engine.entry(source, data, callback);
  }
  /**
   * @return void
   */
  finalize() {
    this.engine.finalize();
  }
  /**
   * @return this.engine
   */
  on() {
    return this.engine.on.apply(this.engine, arguments);
  }
  /**
   * @return this.engine
   */
  pipe() {
    return this.engine.pipe.apply(this.engine, arguments);
  }
  /**
   * @return this.engine
   */
  unpipe() {
    return this.engine.unpipe.apply(this.engine, arguments);
  }
}
