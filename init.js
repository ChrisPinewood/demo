module.exports = {
	init : function() {
		createFolder(config.folder.working)
		.then(function(){
			return createRepo(config.folder.repo, config.git.remoteFull);
		});
	}
}

var config = require('./config');
var git = require('./git');
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
				console.log('Cloning', source, remote);
				return git.clone(source, remote);
			});
		});
};
