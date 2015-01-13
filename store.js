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
						if (error) {
							reject(stderr);
							return;
						}
						command = 'cd \"' + folder + '\"; git push origin;';
						console.log(command);
						exec(command, function(stdout, stderr, error) {
							resolve(stdout);
						});
					});
				});
			});
	},
	clone : function(source, remote) {
		return new Promise(
			function (resolve, reject){
				var command = 'git clone ' + remote + ' ~/Repo;';
				console.log(command);
				exec(command, function(stdout, stderr, error) {
					if (!error) {
						resolve(stdout);
					} else {
						reject(stderr);
					}
				});
			});
	}
}
