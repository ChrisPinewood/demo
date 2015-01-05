module.exports = {
	init : function() {
		createFolder(config.folder.working)
		.then(createRepo(config.folder.repo, config.git.remote));
	}
}

var config = require('./config');
var git = require('nodegit');
var fs = require('fs');

var createFolder = function(source) {
	return new Promise(
		function(resolve, reject) {
			fs.exists(source, function(exists) {
				fs.mkdir(source, function(){
					resolve();
				});
			});	
		});
};

var createRepo = function(source, remote) {
	return new Promise(
		function(resolve, reject) {
			createFolder(source)
			.then(function(value) {
				git.Clone.clone(remote, source);
			});
		});
};
