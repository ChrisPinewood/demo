var config = require('./config');
var init = require('./init').init;
var convert = require('./convert');
var git = require('./git');
var process = require('./process');
var chokidar = require('chokidar');
var express = require('express');
var path = require('path');
var os = require('os');
var fs = require('fs');
var ifaces = os.networkInterfaces();
var workingOn = '';

require('es6-promise').polyfill();

var getLocationsForReport = function(reportName) {
	var locations = config.locations;
	Object.keys(locations.dropbox.files).forEach(function(key){
		locations.dropbox.files[key] = locations.dropbox.files[key].replace(config.placeholder.reportname, reportName);
	});
	
	Object.keys(locations.working.files).forEach(function(key){
		locations.working.files[key] = locations.working.files[key].replace(config.placeholder.reportname, reportName);
	});
	
	Object.keys(locations.repo.files).forEach(function(key){
		locations.repo.files[key] = locations.repo.files[key].replace(config.placeholder.reportname, reportName);
	});
	
	return locations;
}

var getDetailsFromSource = function(source) {
	var details = {
		source : source,
		fileName : path.basename(source)
	};
	details.extension = path.extname(source);
	details.reportName = path.basename(source, details.extension);
	return details;
}

var createMissingFile = function(source, destination) {
	return new Promise(
		function(resolve, reject){	
			fs.exists(destination, function(exists) {
					if (exists) {
						console.log(destination, 'exists already');
						resolve();				
					} else {
						// Create the file
						console.log(destination, 'not found.  Copying from', source);
						fs.createReadStream(source).pipe(fs.createWriteStream(destination));
						
						resolve();
					}
			});
		});
}

var processManuscript = function(source) {
	console.log(new Date(), 'Beginning processing manuscript', source);
		
	var filename = path.basename(source);
	var ext = path.extname(filename);
	var basename = path.basename(filename, ext);
	var newFilename = basename + config.file.markdown;
	var destination = config.folder.repo + newFilename;
	var workingFile = config.folder.working + basename + config.file.suggested + config.file.markdown;
	var workingDoc = config.folder.watch + basename + config.file.suggested + config.file.docx;
	var statusFile = config.folder.working + basename + config.file.status + config.file.markdown;
	var statusDoc = config.folder.watch + basename + config.file.status + config.file.docx;
	var detailsFile = config.folder.repo + basename + config.file.detail + config.file.markdown;
	var detailsDoc = config.folder.watch + basename + config.file.detail + config.file.docx;
	var dmpFile = config.folder.repo + basename + config.file.dmp + config.file.markdown;
	var dmpDoc = config.folder.watch + basename + config.file.dmp + config.file.docx;

	convert.toMarkdown(source, destination)
	.then(function(value){
		return Promise.all([
				git.store(config.folder.repo, newFilename, 'master', 'Dropbox detected modification'),
				process.manuscript(destination, workingFile, statusFile),
				createMissingFile(config.file.detailsTemplate, detailsFile),
				createMissingFile(config.file.dmpTemplate, dmpFile)
			]);
	}).then(function(value){
		return Promise.all([
				convert.toDocx(workingFile, workingDoc),
				convert.toDocx(statusFile, statusDoc),
				convert.toDocx(detailsFile, detailsDoc),
				convert.toDocx(dmpFile, dmpDoc)
			]);
	}).then(function(){
		workingOn = '';
		console.log(new Date(), '... finished processing manuscript');
	}).catch(function(reason) {
		workingOn = '';
		console.log(new Date(), '... ERROR manuscript', reason);
	});
}

var processDetails = function(source) {
	console.log(new Date(), 'Beginning processing meta-data file', source);
	
	var filename = path.basename(source);
	var ext = path.extname(filename);
	var basename = path.basename(filename, ext);
	var newFilename = basename + config.file.markdown;
	var destination = config.folder.repo + newFilename;
	var reportName = path.basename(basename, config.file.detail) + config.file.docx;
	var markdownReport = path.basename(basename, config.file.detail) + config.file.markdown;
	
	convert.toMarkdown(source, destination)
	.then(function(){
		return git.store(config.folder.repo, newFilename, 'master', 'Dropbox detected modification');
	}).then(function(){
		return process.details(destination, reportName, markdownReport);
	}).then(function(){
		workingOn = '';
		console.log(new Date(), '... finished processing meta-data');
	}).catch(function(reason){
		workingOn = '';
		console.log(new Date(), '... ERROR meta-data', reason);
	});
}

var processPlan = function(source) {
	console.log(new Date(), 'Beginning processing DMP file', source);
	
	var filename = path.basename(source);
	var ext = path.extname(filename);
	var basename = path.basename(filename, ext);
	var newFilename = basename + config.file.markdown;
	var destination = config.folder.repo + newFilename;
	
	convert.toMarkdown(source, destination)
	.then(function(){
		return Promise.all([
			git.store(config.folder.repo, newFilename, 'master', 'Dropbox detected modification'),
			process.plan(destination)
		]);
	}).then(function(){
		workingOn = '';
		console.log(new Date(), '... finished processing DMP');
	}).catch(function(reason){
		workingOn = '';
		console.log(new Date(), '... ERROR DMP', reason);
	});
}

var removeFile = function(file) {
	return new Promise(
		function(resolve, reject){
			fs.unlink(file, resolve);
		});
}

var removeFiles = function(files) {
	var promises = [];
	
	Object.keys(files).forEach(function(key){
		promises.push(removeFile(files[key]));
	});
	
	return Promise.all(promises);
}

var removeReport = function(source) {
	console.log(new Date(), 'Beginning removal of report', source);
	
	var details = getDetailsFromSource(source);
	var locations = getLocationsForReport(details.reportName);
	var promises = [];
	
	Object.keys(locations).forEach(function(key){
		promises.push(removeFiles(locations[key].files));
	});
	
	Promise.all(promises)
	.then(function() {
		return Promise.all([
			git.commit(config.folder.repo, 'master', 'File removal from Dropbox'),
			process.remove(details.reportName)
		]);
	})
	.then(function() {
		workingOn = '';
		console.log(new Date(), '... finished removal');
	}).catch(function(error){
		workingOn = '';
		console.log(new Date(), '... ERROR removal of report');
	});
}

var getWorkingFilename = function(source) {
	var filename = path.basename(source);
	var ext = path.extname(filename);
	return path.basename(filename, ext);
}

var isWorkingFile = function(source){
	if (workingOn === '') return false;
	var candidate = getWorkingFilename(source);
	return source.indexOf(workingOn) >= 0;
}

var ignoreChanges = function(source) {
	var filename = path.basename(source);
	if (source.indexOf(config.file.suggested + config.file.docx) >= 0 ||
		source.indexOf(config.file.status + config.file.docx) >= 0 ||
		isWorkingFile(source) ||
		filename.indexOf('.') === 0 ||
		filename.indexOf('~') === 0){
		
		return true;
	}
	
	return false;
}

var changed = function(source) {
	console.log("Working on", workingOn);
	
	if (ignoreChanges(source)){
		console.log('Skipping', source);
		return;
	}
	
	workingOn = getWorkingFilename(source);
	
	// What are we being asked to process?
	if (source.indexOf(config.file.detail + config.file.docx) >= 0) {
		// Meta-data file modification
		processDetails(source);
	} else if (source.indexOf(config.file.dmp + config.file.docx) >= 0) {
		// Meta-data file modification
		processPlan(source);
	} else {
		// Manuscript file modification
		processManuscript(source);
	}
};

var removed = function(source) {
	console.log("Working on", workingOn);
	
	if (ignoreChanges(source)){
		console.log('Skipping', source);
		return;
	}
	
	workingOn = getWorkingFilename(source);
	
	if (source.indexOf(config.file.detail + config.file.docx) >= 0 || 
		source.indexOf(config.file.dmp + config.file.docx) >= 0) {
		
		console.log('Must remove main report to remove from Research Well');
		workingOn = '';
	} else {
		removeReport(source);
	}
}

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
	useFsEvents: true,
	ignoreInitial: true,
	ignored: 'Information'
}).on('all', function(event, path) { 
	console.log(event, path); 
}).on('ready', function() {
	console.log('ready');
}).on('change', changed)
.on('add', changed)
.on('unlink', removed);

var app = express();
app.use(express.static(path.join(__dirname, 'static')));

var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;
	
  console.log("Listening at http://%s:%s", host, port);
});
