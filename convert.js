module.exports = {
	toMarkdown : function(source, destination) {
		return new Promise( function(resolve, reject) {
			var command = config.folder.scripts + 'convert.sh \"' + source + '\" \"' + destination + '\" markdown_github';
			exec(command, function(error, stdout, stderr){
				if(!error) {
					console.log('Converted', source, 'to', destination);
					resolve(stdout);
				} else {
					console.log('FAILED to convert', source, 'to', destination, stderr);
					reject(stderr);
				}
			});
		});
	},
	toDocx : function(source, destination) {
		return new Promise( function(resolve, reject) {
			var command = 'pandoc -s \"' + source + '\" -t docx -o \"' + destination + '\" --atx-headers';
			exec(command, function(error, stdout, stderr){
				if(!error) {
					console.log('Converted', source, 'to', destination);
					console.log(stdout);
					resolve(stdout);
				} else {
					console.log('FAILED to convert', source, 'to', destination, stderr);
					reject(stderr);
				}				
			});
		});
	}
}

var exec = require('child_process').exec;
var config = require('./config');
