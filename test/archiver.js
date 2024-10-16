import {
  WriteStream,
  chmodSync,
  createReadStream,
  createWriteStream,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { PassThrough } from "readable-stream";
import { Readable } from "readable-stream";
import { assert } from "chai";
import { mkdirp } from "mkdirp";
import {
  binaryBuffer,
  readJSON,
  UnBufferedStream,
  WriteHashStream,
} from "./helpers/index.js";
import { JsonArchive } from "../index.js";

var testBuffer = binaryBuffer(1024 * 16);
var testDate = new Date("Jan 03 2013 14:26:38 GMT");
var testDate2 = new Date("Feb 10 2013 10:24:42 GMT");
var win32 = process.platform === "win32";

describe("archiver", function () {
  before(function () {
    mkdirp.sync("tmp");
    if (!win32) {
      chmodSync("test/fixtures/executable.sh", 511); // 0777
      chmodSync("test/fixtures/directory/subdir/", 493); // 0755
      symlinkSync(
        "test/fixtures/directory/level0.txt",
        "test/fixtures/directory/subdir/level0link.txt",
      );
      symlinkSync(
        "test/fixtures/directory/subdir/subsub/",
        "test/fixtures/directory/subdir/subsublink",
      );
    } else {
      writeFileSync(
        "test/fixtures/directory/subdir/level0link.txt",
        "../level0.txt",
      );
      writeFileSync("test/fixtures/directory/subdir/subsublink", "subsub");
    }
  });
  after(function () {
    unlinkSync("test/fixtures/directory/subdir/level0link.txt");
    unlinkSync("test/fixtures/directory/subdir/subsublink");
  });
  describe("core", function () {
    var archive = new JsonArchive();
    describe("#_normalizeEntryData", function () {
      it("should support prefix of the entry name", function () {
        var prefix1 = archive._normalizeEntryData({
          name: "entry.txt",
          prefix: "prefix/",
        });
        assert.propertyVal(prefix1, "name", "prefix/entry.txt");
        var prefix2 = archive._normalizeEntryData({
          name: "entry.txt",
          prefix: "",
        });
        assert.propertyVal(prefix2, "name", "entry.txt");
      });
      it("should support special bits on unix", function () {
        if (!win32) {
          var mode = archive._normalizeEntryData({
            name: "executable.sh",
            mode: statSync("test/fixtures/executable.sh").mode,
          });
          assert.propertyVal(mode, "mode", 511);
        }
      });
    });
  });
  describe("api", function () {
    describe("#abort", function () {
      let archive;
      before(function (done) {
        archive = new JsonArchive();
        const testStream = new WriteStream("tmp/abort.json");
        testStream.on("close", function () {
          done();
        });
        archive.pipe(testStream);
        archive
          .append(testBuffer, { name: "buffer.txt", date: testDate })
          .append(createReadStream("test/fixtures/test.txt"), {
            name: "stream.txt",
            date: testDate,
          })
          .file("test/fixtures/test.txt")
          .abort();
      });
      it("should have a state of aborted", function () {
        assert.property(archive, "_state");
        assert.propertyVal(archive._state, "aborted", true);
      });
    });
    describe("#append", function () {
      var actual;
      var archive;
      var entries = {};
      before(function (done) {
        archive = new JsonArchive();
        var testStream = new WriteStream("tmp/append.json");
        testStream.on("close", function () {
          actual = readJSON("tmp/append.json");
          actual.forEach(function (entry) {
            entries[entry.name] = entry;
          });
          done();
        });
        archive.pipe(testStream);
        archive
          .append(testBuffer, { name: "buffer.txt", date: testDate })
          .append(createReadStream("test/fixtures/test.txt"), {
            name: "stream.txt",
            date: testDate,
          })
          .append(Readable.from(["test"]), {
            name: "stream-like.txt",
            date: testDate,
          })
          .append(null, { name: "directory/", date: testDate })
          .finalize();
      });
      it("should append multiple entries", function () {
        assert.isArray(actual);
        assert.lengthOf(actual, 4);
      });
      it("should append buffer", function () {
        assert.property(entries, "buffer.txt");
        assert.propertyVal(entries["buffer.txt"], "name", "buffer.txt");
        assert.propertyVal(entries["buffer.txt"], "type", "file");
        assert.propertyVal(
          entries["buffer.txt"],
          "date",
          "2013-01-03T14:26:38.000Z",
        );
        assert.propertyVal(entries["buffer.txt"], "mode", 420);
        assert.propertyVal(entries["buffer.txt"], "crc32", 3893830384);
        assert.propertyVal(entries["buffer.txt"], "size", 16384);
      });
      it("should append stream", function () {
        assert.property(entries, "stream.txt");
        assert.propertyVal(entries["stream.txt"], "name", "stream.txt");
        assert.propertyVal(entries["stream.txt"], "type", "file");
        assert.propertyVal(
          entries["stream.txt"],
          "date",
          "2013-01-03T14:26:38.000Z",
        );
        assert.propertyVal(entries["stream.txt"], "mode", 420);
        assert.propertyVal(entries["stream.txt"], "crc32", 585446183);
        assert.propertyVal(entries["stream.txt"], "size", 19);
      });
      it("should append stream-like source", function () {
        assert.property(entries, "stream-like.txt");
        assert.propertyVal(
          entries["stream-like.txt"],
          "name",
          "stream-like.txt",
        );
        assert.propertyVal(entries["stream-like.txt"], "type", "file");
        assert.propertyVal(
          entries["stream-like.txt"],
          "date",
          "2013-01-03T14:26:38.000Z",
        );
        assert.propertyVal(entries["stream-like.txt"], "mode", 420);
        assert.propertyVal(entries["stream-like.txt"], "crc32", 3632233996);
        assert.propertyVal(entries["stream-like.txt"], "size", 4);
      });
      it("should append directory", function () {
        assert.property(entries, "directory/");
        assert.propertyVal(entries["directory/"], "name", "directory/");
        assert.propertyVal(entries["directory/"], "type", "directory");
        assert.propertyVal(
          entries["directory/"],
          "date",
          "2013-01-03T14:26:38.000Z",
        );
        assert.propertyVal(entries["directory/"], "mode", 493);
        assert.propertyVal(entries["directory/"], "crc32", 0);
        assert.propertyVal(entries["directory/"], "size", 0);
      });
    });
    describe("#directory", function () {
      var actual;
      var archive;
      var entries = {};
      before(function (done) {
        archive = new JsonArchive();
        var testStream = new WriteStream("tmp/directory.json");
        testStream.on("close", function () {
          actual = readJSON("tmp/directory.json");
          actual.forEach(function (entry) {
            entries[entry.name] = entry;
          });
          done();
        });
        archive.pipe(testStream);
        archive
          .directory("test/fixtures/directory", null, { date: testDate })
          .directory("test/fixtures/directory", "Win\\DS\\", { date: testDate })
          .directory("test/fixtures/directory", "directory", function (data) {
            if (data.name === "ignore.txt") {
              return false;
            }
            data.funcProp = true;
            return data;
          })
          .finalize();
      });
      it("should append multiple entries", function () {
        assert.isArray(actual);
        assert.property(entries, "test/fixtures/directory/level0.txt");
        assert.property(entries, "test/fixtures/directory/subdir/");
        assert.property(entries, "test/fixtures/directory/subdir/level1.txt");
        assert.property(entries, "test/fixtures/directory/subdir/subsub/");
        assert.property(
          entries,
          "test/fixtures/directory/subdir/subsub/level2.txt",
        );
        assert.propertyVal(
          entries["test/fixtures/directory/level0.txt"],
          "date",
          "2013-01-03T14:26:38.000Z",
        );
        assert.propertyVal(
          entries["test/fixtures/directory/subdir/"],
          "date",
          "2013-01-03T14:26:38.000Z",
        );
        assert.property(entries, "directory/level0.txt");
        assert.property(entries, "directory/subdir/");
        assert.property(entries, "directory/subdir/level1.txt");
        assert.property(entries, "directory/subdir/subsub/");
        assert.property(entries, "directory/subdir/subsub/level2.txt");
      });
      it("should support setting data properties via function", function () {
        assert.property(entries, "directory/level0.txt");
        assert.propertyVal(entries["directory/level0.txt"], "funcProp", true);
      });
      it("should support ignoring matches via function", function () {
        assert.notProperty(entries, "directory/ignore.txt");
      });
      it("should find dot files", function () {
        assert.property(entries, "directory/.dotfile");
      });
      it("should retain symlinks", function () {
        assert.property(
          entries,
          "test/fixtures/directory/subdir/level0link.txt",
        );
        assert.property(entries, "directory/subdir/level0link.txt");
      });
      it("should retain directory symlink", function () {
        assert.property(entries, "test/fixtures/directory/subdir/subsublink");
        assert.property(entries, "directory/subdir/subsublink");
      });
      it("should handle windows path separators in prefix", function () {
        assert.property(entries, "Win/DS/level0.txt");
      });
    });
    describe("#file", function () {
      var actual;
      var archive;
      var entries = {};
      before(function (done) {
        archive = new JsonArchive();
        var testStream = new WriteStream("tmp/file.json");
        testStream.on("close", function () {
          actual = readJSON("tmp/file.json");
          actual.forEach(function (entry) {
            entries[entry.name] = entry;
          });
          done();
        });
        archive.pipe(testStream);
        archive
          .file("test/fixtures/test.txt", { name: "test.txt", date: testDate })
          .file("test/fixtures/test.txt")
          .file("test/fixtures/executable.sh", { mode: win32 ? 511 : null }) // 0777
          .finalize();
      });
      it("should append multiple entries", function () {
        assert.isArray(actual);
        assert.lengthOf(actual, 3);
      });
      it("should append filepath", function () {
        assert.property(entries, "test.txt");
        assert.propertyVal(entries["test.txt"], "name", "test.txt");
        assert.propertyVal(
          entries["test.txt"],
          "date",
          "2013-01-03T14:26:38.000Z",
        );
        assert.propertyVal(entries["test.txt"], "crc32", 585446183);
        assert.propertyVal(entries["test.txt"], "size", 19);
      });
      it("should fallback to filepath when no name is set", function () {
        assert.property(entries, "test/fixtures/test.txt");
      });
      it("should fallback to file stats when applicable", function () {
        assert.property(entries, "test/fixtures/executable.sh");
        assert.propertyVal(
          entries["test/fixtures/executable.sh"],
          "name",
          "test/fixtures/executable.sh",
        );
        assert.propertyVal(entries["test/fixtures/executable.sh"], "mode", 511);
        assert.propertyVal(
          entries["test/fixtures/executable.sh"],
          "crc32",
          3957348457,
        );
        assert.propertyVal(entries["test/fixtures/executable.sh"], "size", 11);
      });
    });
    describe("#glob", function () {
      var actual;
      var archive;
      var entries = {};
      before(function (done) {
        archive = new JsonArchive();
        var testStream = new WriteStream("tmp/glob.json");
        testStream.on("close", function () {
          actual = readJSON("tmp/glob.json");
          actual.forEach(function (entry) {
            entries[entry.name] = entry;
          });
          done();
        });
        archive.pipe(testStream);
        archive
          .glob("test/fixtures/test.txt", null)
          .glob("test/fixtures/empty.txt", null)
          .glob("test/fixtures/executable.sh", null)
          .glob("test/fixtures/directory/**/*", {
            ignore: "test/fixtures/directory/subdir/**/*",
            nodir: true,
          })
          .glob("**/*", { cwd: "test/fixtures/directory/subdir/" })
          .finalize();
      });
      it("should append multiple entries", function () {
        assert.isArray(actual);
        assert.property(entries, "test/fixtures/test.txt");
        assert.property(entries, "test/fixtures/executable.sh");
        assert.property(entries, "test/fixtures/empty.txt");
        assert.property(entries, "test/fixtures/directory/level0.txt");
        assert.property(entries, "level1.txt");
        assert.property(entries, "subsub/level2.txt");
      });
    });
    describe("#promise", function () {
      var archive;
      it("should use a promise", function (done) {
        archive = new JsonArchive();
        var testStream = new WriteStream("tmp/promise.json");
        archive.pipe(testStream);
        archive
          .append(testBuffer, { name: "buffer.txt", date: testDate })
          .append(createReadStream("test/fixtures/test.txt"), {
            name: "stream.txt",
            date: testDate,
          })
          .append(null, { name: "directory/", date: testDate })
          .finalize()
          .then(function () {
            done();
          });
      });
    });
    describe("#errors", function () {
      var archive;
      it("should allow continue on stat failing", function (done) {
        archive = new JsonArchive();
        var testStream = new WriteStream("tmp/errors-stat.json");
        testStream.on("close", function () {
          done();
        });
        archive.pipe(testStream);
        archive
          .file("test/fixtures/test.txt")
          .file("test/fixtures/test-missing.txt")
          .file("test/fixtures/empty.txt")
          .finalize();
      });
      it("should allow continue on with several stat failings", function (done) {
        archive = new JsonArchive();
        var testStream = new WriteStream("tmp/errors-stat.json");
        testStream.on("close", function () {
          done();
        });
        archive.pipe(testStream);
        archive.file("test/fixtures/test.txt");
        for (var i = 1; i <= 20; i++)
          archive.file("test/fixtures/test-missing.txt");
        archive.finalize();
      });
    });
  });
  describe("#symlink", function () {
    var actual;
    var archive;
    var entries = {};
    before(function (done) {
      archive = new JsonArchive();
      var testStream = new WriteStream("tmp/symlink.json");
      testStream.on("close", function () {
        actual = readJSON("tmp/symlink.json");
        actual.forEach(function (entry) {
          entries[entry.name] = entry;
        });
        done();
      });
      archive.pipe(testStream);
      archive
        .append("file-a", { name: "file-a" })
        .symlink("directory-a/symlink-to-file-a", "../file-a")
        .symlink(
          "directory-b/directory-c/symlink-to-directory-a",
          "../../directory-a",
          493,
        )
        .finalize();
    });
    it("should append multiple entries", () => {
      assert.isArray(actual);
      assert.property(entries, "file-a");
      assert.property(entries, "directory-a/symlink-to-file-a");
      assert.property(
        entries,
        "directory-b/directory-c/symlink-to-directory-a",
      );
      assert.propertyVal(
        entries["directory-b/directory-c/symlink-to-directory-a"],
        "mode",
        493,
      );
    });
  });
});
