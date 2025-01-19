import { Transform } from "node:stream";
import crc32 from "buffer-crc32";
import { collectStream } from "../utils.js";

/**
 * JSON Format Plugin
 *
 * @module plugins/json
 * @license [MIT]{@link https://github.com/archiverjs/node-archiver/blob/master/LICENSE}
 * @copyright (c) 2012-2014 Chris Talkington, contributors.
 */
export default class Json extends Transform {
  /**
   * @constructor
   * @param {(JsonOptions|TransformOptions)} options
   */
  constructor(options) {
    super({ ...options });
    this.files = [];
  }
  /**
   * [_transform description]
   *
   * @private
   * @param  {Buffer}   chunk
   * @param  {String}   encoding
   * @param  {Function} callback
   * @return void
   */
  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }
  /**
   * [_writeStringified description]
   *
   * @private
   * @return void
   */
  _writeStringified() {
    var fileString = JSON.stringify(this.files);
    this.write(fileString);
  }
  /**
   * [append description]
   *
   * @param  {(Buffer|Stream)}   source
   * @param  {EntryData}   data
   * @param  {Function} callback
   * @return void
   */
  append(source, data, callback) {
    var self = this;
    data.crc32 = 0;
    function onend(err, sourceBuffer) {
      if (err) {
        callback(err);
        return;
      }
      data.size = sourceBuffer.length || 0;
      data.crc32 = crc32.unsigned(sourceBuffer);
      self.files.push(data);
      callback(null, data);
    }
    if (data.sourceType === "buffer") {
      onend(null, source);
    } else if (data.sourceType === "stream") {
      collectStream(source, onend);
    }
  }
  /**
   * [finalize description]
   *
   * @return void
   */
  finalize() {
    this._writeStringified();
    this.end();
  }
}
