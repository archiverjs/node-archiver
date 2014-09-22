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
  res.on('close', function() {
    console.log('Archive wrote %d bytes', archive.pointer());
    return res.status(200).send('OK').end();
  });

  //set the archive name
  res.attachment('archive-name.zip');

  //this is the streaming magic
  archive.pipe(res);

  var files = [__dirname + '/fixtures/file1.txt', __dirname + '/fixtures/file2.txt'];

  for(var i in files) {
    archive.append(fs.createReadStream(files[i]), { name: p.basename(files[i]) });
  }

  archive.finalize();

});

app.listen(3000);
