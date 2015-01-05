var config = require('./config');
var init = require('./init').init;
var convert = require('./convert');
var store = require('./store').store;
var process = require('./process').process;
var chokidar = require('chokidar');
var path = require('path');
require('es6-promise').polyfill();

var changed = function(source) {
	if (source.indexOf(config.file.suggested + config.file.docx) >= 0 ||
		source.indexOf(config.file.status + config.file.docx) >= 0 || 
		source.indexOf('.~') >= 0){
		console.log('Skipping', source);
		return;
	}
		
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
		return store(config.folder.repo, newFilename, 'working', 'File modified');
	}).then(function(value){
		console.log('Process...');
		return process(destination, workingFile, statusFile);
	}).then(function(value){
		console.log('Convert working...');
		return convert.toDocx(workingFile, workingDoc);
	}).then(function(value){
		console.log('Convert status...');
		return convert.toDocx(statusFile, statusDoc);
	}).catch(function(reason) {
		console.log('ERROR...');
		console.log(reason);
	});
};

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
