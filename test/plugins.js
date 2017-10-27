/*global before,describe,it */
var fs = require('fs');
var assert = require('chai').assert;
var mkdir = require('mkdirp');
var tar = require('tar');
var yauzl = require('yauzl');
var WriteStream = fs.createWriteStream;

var archiver = require('../');
var helpers = require('./helpers');
var binaryBuffer = helpers.binaryBuffer;

var testBuffer = binaryBuffer(1024 * 16);
var testDate = new Date('Jan 03 2013 14:26:38 GMT');
var testDate2 = new Date('Feb 10 2013 10:24:42 GMT');

var win32 = process.platform === 'win32';

describe('plugins', function() {
  before(function() {
    mkdir.sync('tmp');

    if (!win32) {
      fs.chmodSync('test/fixtures/executable.sh', 0777);
      fs.chmodSync('test/fixtures/directory/subdir/', 0755);
      fs.symlinkSync('../level0.txt', 'test/fixtures/directory/subdir/level0link.txt');
      fs.symlinkSync('subsub/', 'test/fixtures/directory/subdir/subsublink');
    } else {
      fs.writeFileSync('test/fixtures/directory/subdir/level0link.txt', '../level0.txt');
      fs.writeFileSync('test/fixtures/directory/subdir/subsublink', 'subsub');
    }
  });

  after(function() {
    fs.unlinkSync('test/fixtures/directory/subdir/level0link.txt');
    fs.unlinkSync('test/fixtures/directory/subdir/subsublink');
  });

  describe('tar', function() {
    var actual = [];
    var archive;
    var entries = {};

    before(function(done) {
      archive = archiver('tar');
      var testStream = new tar.Parse();

      testStream.on('entry', function(entry) {
        actual.push(entry.path);
        entries[entry.path] = {
          type: entry.type,
          path: entry.path,
          mode: entry.mode,
          uid: entry.uid,
          gid: entry.gid,
          uname: entry.uname,
          gname: entry.gname,
          size: entry.size,
          mtime: entry.mtime,
          atime: entry.atime,
          ctime: entry.ctime,
          linkpath: entry.linkpath
        };
        entry.resume();
      });

      testStream.on('end', function() {
        done();
      });

      archive.pipe(testStream);

      archive
        .append(testBuffer, { name: 'buffer.txt', date: testDate })
        .append(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate })
        .append(null, { name: 'folder/', date: testDate })
        .directory('test/fixtures/directory', 'directory')
        .symlink('manual-link.txt', 'manual-link-target.txt')
        .finalize();
    });

    it('should append multiple entries', function() {
      assert.isArray(actual);
      assert.isAbove(actual.length, 10);
    });

    it('should append buffer', function() {
      assert.property(entries, 'buffer.txt');
      assert.propertyVal(entries['buffer.txt'], 'path', 'buffer.txt');
      assert.propertyVal(entries['buffer.txt'], 'type', 'File');
      assert.propertyVal(entries['buffer.txt'], 'mode', 420);
      assert.propertyVal(entries['buffer.txt'], 'size', 16384);
    });

    it('should append stream', function() {
      assert.property(entries, 'stream.txt');
      assert.propertyVal(entries['stream.txt'], 'path', 'stream.txt');
      assert.propertyVal(entries['stream.txt'], 'type', 'File');
      assert.propertyVal(entries['stream.txt'], 'mode', 420);
      assert.propertyVal(entries['stream.txt'], 'size', 19);
    });

    it('should append folder', function() {
      assert.property(entries, 'folder/');
      assert.propertyVal(entries['folder/'], 'path', 'folder/');
      assert.propertyVal(entries['folder/'], 'type', 'Directory');
      assert.propertyVal(entries['folder/'], 'mode', 493);
      assert.propertyVal(entries['folder/'], 'size', 0);
    });

    it('should append manual symlink', function() {
      assert.property(entries, 'manual-link.txt');
      assert.propertyVal(entries['manual-link.txt'], 'type', 'SymbolicLink');
      assert.propertyVal(entries['manual-link.txt'], 'linkpath', 'manual-link-target.txt');
    });

    it('should append via directory', function() {
      assert.property(entries, 'directory/subdir/level1.txt');
      assert.property(entries, 'directory/subdir/level0link.txt');
    });

    it('should retain symlinks via directory', function() {
      if (win32) {
        this.skip();
      }

      assert.property(entries, 'directory/subdir/level0link.txt');
      assert.propertyVal(entries['directory/subdir/level0link.txt'], 'type', 'SymbolicLink');
      assert.propertyVal(entries['directory/subdir/level0link.txt'], 'linkpath', '../level0.txt');

      assert.property(entries, 'directory/subdir/subsublink');
      assert.propertyVal(entries['directory/subdir/subsublink'], 'type', 'SymbolicLink');
      assert.propertyVal(entries['directory/subdir/subsublink'], 'linkpath', 'subsub');
    });
  });

  describe('zip', function() {
    var actual = [];
    var archive;
    var entries = {};
    var zipComment = '';

    before(function(done) {
      archive = archiver('zip', { comment: 'archive comment' });
      var testStream = new WriteStream('tmp/plugin.zip');

      testStream.on('close', function(entry) {
        yauzl.open('tmp/plugin.zip', function(err, zip) {
          zip.on('entry', function(entry) {
            actual.push(entry.fileName);
            entries[entry.fileName] = entry;
          });

          zip.on('close', function() {
            done();
          });

          zipComment = zip.comment;
        });
      });

      archive.pipe(testStream);

      archive
        .append(testBuffer, { name: 'buffer.txt', date: testDate, comment: 'entry comment' })
        .append(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate })
        .file('test/fixtures/executable.sh', { name: 'executable.sh', mode: win32 ? 0777 : null })
        .directory('test/fixtures/directory', 'directory')
        .symlink('manual-link.txt', 'manual-link-target.txt')
        .finalize();
    });

    it('should append multiple entries', function() {
      assert.isArray(actual);
      assert.isAbove(actual.length, 10);
    });

    it('should append buffer', function() {
      assert.property(entries, 'buffer.txt');
      assert.propertyVal(entries['buffer.txt'], 'uncompressedSize', 16384);
      assert.propertyVal(entries['buffer.txt'], 'crc32', 3893830384);
    });

    it('should append stream', function() {
      assert.property(entries, 'stream.txt');
      assert.propertyVal(entries['stream.txt'], 'uncompressedSize', 19);
      assert.propertyVal(entries['stream.txt'], 'crc32', 585446183);
    });

    it('should append via file', function() {
      assert.property(entries, 'executable.sh');
      assert.propertyVal(entries['executable.sh'], 'uncompressedSize', 11);
      assert.propertyVal(entries['executable.sh'], 'crc32', 3957348457);
    });

    it('should append via directory', function() {
      assert.property(entries, 'directory/subdir/level1.txt');
      assert.propertyVal(entries['directory/subdir/level1.txt'], 'uncompressedSize', 6);
      assert.propertyVal(entries['directory/subdir/level1.txt'], 'crc32', 133711013);
    });

    it('should append manual symlink', function() {
        assert.property(entries, 'manual-link.txt');
        assert.propertyVal(entries['manual-link.txt'], 'crc32', 1121667014);
        assert.propertyVal(entries['manual-link.txt'], 'externalFileAttributes', 2684354592);
    });

    it('should allow for custom unix mode', function() {
      assert.property(entries, 'executable.sh');
      assert.propertyVal(entries['executable.sh'], 'externalFileAttributes', 2180972576);
      assert.equal((entries['executable.sh'].externalFileAttributes >>> 16) & 0xFFF, 511);

      assert.property(entries, 'directory/subdir/');
      assert.propertyVal(entries['directory/subdir/'], 'externalFileAttributes', 1106051088);
      assert.equal((entries['directory/subdir/'].externalFileAttributes >>> 16) & 0xFFF, 493);
    });

    it('should allow for entry comments', function() {
      assert.property(entries, 'buffer.txt');
      assert.propertyVal(entries['buffer.txt'], 'fileComment', 'entry comment');
    });

    it('should allow for archive comment', function() {
      assert.equal('archive comment', zipComment);
    });
  });
});
