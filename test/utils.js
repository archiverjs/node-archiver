import { EventEmitter } from "events";
import { Readable } from "readable-stream";
import { assert } from "chai";
import {
  collectStream,
  dateify,
  normalizeInputSource,
  sanitizePath,
  trailingSlashIt,
} from "../lib/utils.js";

describe("utils", function () {
  describe("collectStream", function () {
    it("should collect data chunks from a stream into a buffer", function (done) {
      var source = new Readable({
        read() {
          this.push(Buffer.from("hello "));
          this.push(Buffer.from("world"));
          this.push(null);
        },
      });

      collectStream(source, function (err, buf) {
        assert.isNull(err);
        assert.instanceOf(buf, Buffer);
        assert.equal(buf.toString(), "hello world");
        done();
      });
    });

    it("should handle stream error events", function (done) {
      var source = new EventEmitter();

      collectStream(source, function (err, buf) {
        assert.isNotNull(err);
        assert.equal(err.message, "stream error");
        assert.isUndefined(buf);
        done();
      });

      source.emit("error", new Error("stream error"));
    });

    it("should not invoke callback twice if stream emits error and then end", function (done) {
      var source = new EventEmitter();
      var callCount = 0;

      collectStream(source, function (err) {
        callCount++;
        assert.equal(callCount, 1, "callback should only be called once");
        assert.isNotNull(err);
        assert.equal(err.message, "stream error");

        // Wait slightly to ensure subsequent 'end' event does not trigger callback again
        setTimeout(function () {
          assert.equal(callCount, 1);
          done();
        }, 50);
      });

      source.emit("error", new Error("stream error"));
      source.emit("end");
    });
  });

  describe("dateify", function () {
    it("should return Date instance", function () {
      var d = dateify("2020-01-01T00:00:00.000Z");
      assert.instanceOf(d, Date);
      assert.equal(d.toISOString(), "2020-01-01T00:00:00.000Z");
    });
  });

  describe("sanitizePath", function () {
    it("should strip drive letters and leading slashes", function () {
      assert.equal(sanitizePath("c:/test/path.txt"), "test/path.txt");
      assert.equal(sanitizePath("/root/file.txt"), "root/file.txt");
      assert.equal(sanitizePath("../relative/file.txt"), "relative/file.txt");
    });
  });

  describe("trailingSlashIt", function () {
    it("should add trailing slash if missing", function () {
      assert.equal(trailingSlashIt("foo/bar"), "foo/bar/");
      assert.equal(trailingSlashIt("foo/bar/"), "foo/bar/");
    });
  });
});
