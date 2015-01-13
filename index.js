var config = require('./config');
var init = require('./init').init;
var convert = require('./convert');
var git = require('./store');
var process = require('./process').process;
var chokidar = require('chokidar');
var express = require('express');
var path = require('path');
var os = require('os');
var ifaces = os.networkInterfaces();

require('es6-promise').polyfill();

var changed = function(source) {
	if (source.indexOf(config.file.suggested + config.file.docx) >= 0 ||
		source.indexOf(config.file.status + config.file.docx) >= 0 || 
		source.indexOf('.~') >= 0){
		console.log('Skipping', source);
		return;
	}
	
	console.log(new Date(), 'Beginning processing...');
		
	var filename = path.basename(source);
	var ext = path.extname(filename);
	var basename = path.basename(filename, ext);
	var newFilename = basename + config.file.markdown;
	var destination = config.folder.repo + newFilename;
	var workingFile = config.folder.working + basename + config.file.suggested + config.file.markdown;
	var workingDoc = config.folder.watch + basename + config.file.suggested + config.file.docx;
	var statusFile = config.folder.working + basename + config.file.status + config.file.markdown;
	var statusDoc = config.folder.watch + basename + config.file.status + config.file.docx;

	console.log('Convert file...');
	convert.toMarkdown(source, destination)
	.then(function(value){
		console.log('Store...');
		return git.store(config.folder.repo, newFilename, 'master', 'Dropbox detect modification');
	}).then(function(value){
		console.log('Process...');
		return process(destination, workingFile, statusFile);
	}).then(function(value){
		console.log('Convert working...');
		return convert.toDocx(workingFile, workingDoc);
	}).then(function(value){
		console.log('Convert status...');
		return convert.toDocx(statusFile, statusDoc);
	}).then(function(){
		console.log(new Date(), '... finished processing');
	}).catch(function(reason) {
		console.log(new Date(), '...ERROR');
		console.log(reason);
	});
};

Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log(ifname + ':' + alias, iface.address);
    } else {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address);
    }
  });
});

init();

chokidar.watch(config.folder.watch, {
	persistent: true,
	useFsEvents: true
}).on('change', changed)
.on('all', function(event, path) { 
	console.log(event, path); 
}).on('ready', function() {
	console.log('ready');
});

var app = express();
app.use(express.static(path.join(__dirname, 'static')));

var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;
	
  console.log("Listening at http://%s:%s", host, port);
});
