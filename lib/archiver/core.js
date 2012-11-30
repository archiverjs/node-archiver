var stream = require('stream');
var inherits = require('util').inherits;

var Archiver = module.exports = function() {
  var self = this;

  self.readable = true;
  self.paused = false;
  self.busy = false;
  self.eof = false;

  self.queue = [];
  self.fileptr = 0;
  self.files = [];
};

inherits(Archiver, stream.Stream);

Archiver.prototype.pause = function() {
  var self = this;
  self.paused = true;
};

Archiver.prototype.resume = function() {
  var self = this;
  self.paused = false;

  self._read();
};

Archiver.prototype.destroy = function() {
  var self = this;
  self.readable = false;
};

Archiver.prototype._read = function() {
  var self = this;

  if (!self.readable || self.paused) { return; }

  if (self.queue.length > 0) {
    var data = self.queue.shift();
    self.emit('data', data);
  }

  if (self.eof && self.queue.length === 0) {
    self.emit('end');
    self.readable = false;

    if (typeof self.callback === 'function') {
      self.callback(self.fileptr);
    }
  }

  //TODO look into possible cpu usage issues
  process.nextTick(function() {
    self._read();
  });
};

Archiver.prototype.finalize = function(callback) {
  // placeholder
};

Archiver.prototype.addFile = function(source, file, callback) {
  // placeholder
};