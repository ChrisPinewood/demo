var git = require('nodegit');
var exec = require('child_process').exec;

module.exports = {
	store : function(folder, file, branch, message) {
		return new Promise(
			function(resolve, reject) {
				var command = 'cd \"' + folder + '\"; git checkout -b ' + branch + '; git add \"' + file + '\";';
				console.log(command);
				exec(command, function() {
					command = 'cd \"' + folder + '\"; git commit -a -m \"' + message + '\";';
					console.log(command);
					exec(command, function(stdout, stderr, error) {
						if (!error) {
							resolve(stdout);
						} else {
							reject(stderr);
						}
					});
				});
			});
	}
}
