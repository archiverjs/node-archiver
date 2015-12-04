var app = require('express')();
var archiver = require('archiver');
var p = require('path');
var fs = require('fs');

app.get('/', function(req, res) {

  var archive = archiver('zip');

  archive.on('error', function(err) {
    res.status(500).send({error: err.message});
  });

  //on stream closed we can end the request
  archive.on('end', function() {
    console.log('Archive wrote %d bytes', archive.pointer());
  });

  //set the archive name
  res.attachment('archive-name.zip');

  //this is the streaming magic
  archive.pipe(res);

  var files = [__dirname + '/fixtures/file1.txt', __dirname + '/fixtures/file2.txt'];

  for(var i in files) {
    archive.file(files[i], { name: p.basename(files[i]) });
  }

  var directories = [__dirname + '/fixtures/somedir']

  for(var i in directories) {
    archive.directory(directories[i], directories[i].replace(__dirname + '/fixtures', ''));
  }

  archive.finalize();

});

app.listen(3000);
