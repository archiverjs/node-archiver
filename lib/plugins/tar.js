import zlib from "node:zlib";
import engine from "tar-stream";
import { collectStream } from "../utils.js";

/**
 * TAR Format Plugin
 *
 * @module plugins/tar
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
export default class Tar {
  /**
   * @constructor
   * @param {TarOptions} options
   */
  constructor(options) {
    options = this.options = {
      gzip: false,
      ...options,
    };
    if (typeof options.gzipOptions !== "object") {
      options.gzipOptions = {};
    }
    this.engine = engine.pack(options);
    this.compressor = false;
    if (options.gzip) {
      this.compressor = zlib.createGzip(options.gzipOptions);
      this.compressor.on("error", this._onCompressorError.bind(this));
    }
  }
  /**
   * [_onCompressorError description]
   *
   * @private
   * @param  {Error} err
   * @return void
   */
  _onCompressorError(err) {
    this.engine.emit("error", err);
  }
  /**
   * [append description]
   *
   * @param  {(Buffer|Stream)} source
   * @param  {TarEntryData} data
   * @param  {Function} callback
   * @return void
   */
  append(source, data, callback) {
    var self = this;
    data.mtime = data.date;
    function append(err, sourceBuffer) {
      if (err) {
        callback(err);
        return;
      }
      self.engine.entry(data, sourceBuffer, function (err) {
        callback(err, data);
      });
    }
    if (data.sourceType === "buffer") {
      append(null, source);
    } else if (data.sourceType === "stream" && data.stats) {
      data.size = data.stats.size;
      var entry = self.engine.entry(data, function (err) {
        callback(err, data);
      });
      source.pipe(entry);
    } else if (data.sourceType === "stream") {
      collectStream(source, append);
    }
  }
  /**
   * [finalize description]
   *
   * @return void
   */
  finalize() {
    this.engine.finalize();
  }
  /**
   * [on description]
   *
   * @return this.engine
   */
  on() {
    return this.engine.on.apply(this.engine, arguments);
  }
  /**
   * [pipe description]
   *
   * @param  {String} destination
   * @param  {Object} options
   * @return this.engine
   */
  pipe(destination, options) {
    if (this.compressor) {
      return this.engine.pipe
        .apply(this.engine, [this.compressor])
        .pipe(destination, options);
    } else {
      return this.engine.pipe.apply(this.engine, arguments);
    }
  }
  /**
   * [unpipe description]
   *
   * @return this.engine
   */
  unpipe() {
    if (this.compressor) {
      return this.compressor.unpipe.apply(this.compressor, arguments);
    } else {
      return this.engine.unpipe.apply(this.engine, arguments);
    }
  }
}
