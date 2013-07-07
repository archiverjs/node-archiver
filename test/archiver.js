/*global before,describe,it */
var fs = require('fs');

var assert = require('chai').assert;
var mkdir = require('mkdirp');

var common = require('./helpers/common');
var HashStream = common.HashStream;
var UnBufferedStream = common.UnBufferedStream;
var WriteHashStream = common.WriteHashStream;
var binaryBuffer = common.binaryBuffer;

var archiver = require('../lib/archiver');

var testDate = new Date('Jan 03 2013 14:26:38 GMT');
var testDate2 = new Date('Feb 10 2013 10:24:42 GMT');

describe('archiver', function() {

  before(function() {
    mkdir.sync('tmp');
  });


  describe('core', function() {

  });


  describe('tar', function() {

    describe('#append', function() {
      it('should append Buffer sources', function(done) {
        var archive = archiver('tar');
        var testStream = new WriteHashStream('tmp/buffer.tar');

        testStream.on('close', function() {
          assert.equal(testStream.digest, '3a8a9ff17087129cc05dc88be86573ecf3f9ca56');
          done();
        });

        archive.pipe(testStream);

        archive
          .append(binaryBuffer(20000), { name: 'buffer.txt', date: testDate })
          .finalize();
      });

      it('should append Stream sources', function(done) {
        var archive = archiver('tar');
        var testStream = new WriteHashStream('tmp/stream.tar');

        testStream.on('close', function() {
          assert.equal(testStream.digest, '3e3271c503deeba9abe5031df6bca636f1eb115b');
          done();
        });

        archive.pipe(testStream);

        archive
          .append(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate })
          .finalize();
      });

      it('should append Stream sources with no buffer or pause method', function(done) {
        var archive = archiver('tar');
        var testStream = new WriteHashStream('tmp/stream-nobufferpause.tar');
        var noBufferStream1 = new UnBufferedStream();
        var noBufferStream2 = new UnBufferedStream();

        testStream.on('close', function() {
          assert.equal(testStream.digest, '54a94b8b72eac5f6acf5c1ec84aa2e69969267ca');
          done();
        });

        archive.pipe(testStream);

        archive.append(noBufferStream1, { name: 'stream.txt', date: testDate });
        archive.append(noBufferStream2, { name: 'stream2.txt', date: testDate });

        noBufferStream1.emit('data', binaryBuffer(20000));
        noBufferStream1.emit('end');
        noBufferStream2.emit('data', binaryBuffer(15000));
        noBufferStream2.emit('end');

        archive.finalize();
      });

      it('should append string sources', function(done) {
        var archive = archiver('tar');
        var testStream = new WriteHashStream('tmp/string.tar');

        testStream.on('close', function() {
          assert.equal(testStream.digest, 'fb620048e1bceefb0be06d3f18ea00929951b105');
          done();
        });

        archive.pipe(testStream);

        archive
          .append('string', {name: 'string.txt', date: testDate })
          .finalize();
      });

      it('should append multiple sources', function(done) {
        var archive = archiver('tar');
        var testStream = new WriteHashStream('tmp/multiple.tar');

        testStream.on('close', function() {
          assert.equal(testStream.digest, '1437ef391a7c2c0de180bddff21b98c2f9778331');
          done();
        });

        archive.pipe(testStream);

        archive
          .append('string', { name: 'string.txt', date: testDate })
          .append(binaryBuffer(20000), { name: 'buffer.txt', date: testDate2 })
          .append(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate })
          .finalize();
      });

      it('should use prefix for deep paths', function(done) {
        var archive = archiver('tar');
        var testStream = new WriteHashStream('tmp/feature-prefix.tar');

        testStream.on('close', function() {
          assert.equal(testStream.digest, 'aeb2496b2bd7458931ba942dba2b4bf28cbc187c');
          done();
        });

        archive.pipe(testStream);

        var deepPath = 'vvmbtqhysigpregbdrc/pyqaznbelhppibmbykz/';
        deepPath += 'qcbclwjhktiazmhnsjt/kpsgdfyfkarbvnlinrt/';
        deepPath += 'holobndxfccyecblhcc/';
        deepPath += deepPath;

        archive
          .append('deep path', { name: deepPath + 'file.txt', date: testDate })
          .finalize();
      });
    });

  });


  describe('zip', function() {

    describe('#append', function() {
      it('should append Buffer sources', function(done) {
        var archive = archiver('zip', {
          forceUTC: true
        });

        var testStream = new WriteHashStream('tmp/buffer.zip');

        testStream.on('close', function() {
          assert.equal(testStream.digest, '9c14aaaab831cad774d0dfaf665ae6da8e33577c');
          done();
        });

        archive.pipe(testStream);

        archive
          .append(binaryBuffer(20000), { name: 'buffer.txt', date: testDate })
          .finalize();
      });

      it('should append Stream sources', function(done) {
        var archive = archiver('zip', {
          forceUTC: true
        });

        var testStream = new WriteHashStream('tmp/stream.zip');

        testStream.on('close', function() {
          assert.equal(testStream.digest, 'd7e3970142a06d4a87fbd6458284eeaf8f5de907');
          done();
        });

        archive.pipe(testStream);

        archive
          .append(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate })
          .finalize();
      });

      it('should append Stream sources with no buffer or pause method', function(done) {
        var archive = archiver('zip', {
          forceUTC: true
        });

        var testStream = new WriteHashStream('tmp/stream-nobufferpause.zip');
        var noBufferStream1 = new UnBufferedStream();
        var noBufferStream2 = new UnBufferedStream();

        testStream.on('close', function() {
          assert.equal(testStream.digest, '26cce2ae9282d66c20501102b97ad014d836fcf1');
          done();
        });

        archive.pipe(testStream);

        archive.append(noBufferStream1, { name: 'stream.txt', date: testDate });
        archive.append(noBufferStream2, { name: 'stream2.txt', date: testDate });

        noBufferStream1.emit('data', binaryBuffer(15000));
        noBufferStream1.emit('end');

        noBufferStream2.emit('data', binaryBuffer(20000));
        noBufferStream2.emit('end');

        archive.finalize();
      });

      it('should append string sources', function(done) {
        var archive = archiver('zip', {
          forceUTC: true
        });

        var testStream = new WriteHashStream('tmp/string.zip');

        testStream.on('close', function() {
          assert.equal(testStream.digest, '3de2c37ba3745618257f6816fe979ee565e24aa0');
          done();
        });

        archive.pipe(testStream);

        archive
          .append('string', {name: 'string.txt', date: testDate })
          .finalize();
      });

      it('should append multiple sources', function(done) {
        var archive = archiver('zip', {
          forceUTC: true
        });

        var testStream = new WriteHashStream('tmp/multiple.zip');

        testStream.on('close', function() {
          assert.equal(testStream.digest, 'dac10ec60ee700ea07a90bca3e6d1a8db2670a9b');
          done();
        });

        archive.pipe(testStream);

        archive
          .append('string', { name: 'string.txt', date: testDate })
          .append(binaryBuffer(20000), { name: 'buffer.txt', date: testDate2 })
          .append(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate2 })
          .append(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream-store.txt', date: testDate, store: true })
          .finalize();
      });

      it('should support STORE for Buffer sources', function(done) {
        var archive = archiver('zip', {
          forceUTC: true
        });

        var testStream = new WriteHashStream('tmp/buffer-store.zip');

        testStream.on('close', function() {
          assert.equal(testStream.digest, '09305770a3272cbcd7c151ee267cb1b0075dd29e');
          done();
        });

        archive.pipe(testStream);

        archive
          .append(binaryBuffer(20000), { name: 'buffer.txt', date: testDate, store: true })
          .finalize();
      });

      it('should support STORE for Stream sources', function(done) {
        var archive = archiver('zip', {
          forceUTC: true
        });

        var testStream = new WriteHashStream('tmp/stream-store.zip');

        testStream.on('close', function() {
          assert.equal(testStream.digest, '999f407f3796b551d91608349a06521b8f80f229');
          done();
        });

        archive.pipe(testStream);

        archive
          .append(fs.createReadStream('test/fixtures/test.txt'), { name: 'stream.txt', date: testDate, store: true })
          .finalize();
      });

      it('should support archive and file comments', function(done) {
        var archive = archiver.createZip({
          comment: 'this is a zip comment',
          forceUTC: true
        });

        var testStream = new WriteHashStream('tmp/comments.zip');

        testStream.on('close', function() {
          assert.equal(testStream.digest, 'ea7911cbe2508682c2a17d30b366ac33527ba84f');
          done();
        });

        archive.pipe(testStream);

        archive
          .append(binaryBuffer(20000), {name: 'buffer.txt', date: testDate, comment: 'this is a file comment'})
          .finalize();
      });

      it('should STORE files when compression level is zero', function(done) {
        var archive = archiver('zip', {
          forceUTC: true,
          zlib: {
            level: 0
          }
        });

        var testStream = new WriteHashStream('tmp/store-level0.zip');

        testStream.on('close', function() {
          assert.equal(testStream.digest, '09305770a3272cbcd7c151ee267cb1b0075dd29e');
          done();
        });

        archive.pipe(testStream);

        archive
          .append(binaryBuffer(20000), { name: 'buffer.txt', date: testDate })
          .finalize();
      });
    });

  });

});