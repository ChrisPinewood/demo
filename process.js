var fs = require('fs');
var path = require('path');
var documents = require('./resources/documents').documents;
var types = require('./resources/types');
var config = require('./config');

var process = function(source, destination, status) {
	return new Promise(
		function(resolve, reject){	
			readFile(source)
			.then(function(data){
				var info = guessReport(data);
				if (info.detected) {
					console.log('Detected as ', info.document.name);
			
					var sections = extractSections(data);
					var title = extractTitleAbstract(data, (sections && sections.length > 0) ? sections[0].index : 0);

					// whack the title onto the front of the sections array
					sections.unshift(title);
					
					console.log(sections);
			
					var desired = buildFile(info.document.sections, sections, data);
			
					writeFile(destination, desired.contents)
					.then(function(){
						var details = buildStatus(desired.details, source, destination, data, info.document.name);
						writeFile(status, details);
					}).then(function(){ 
						resolve(); 
					}).catch(function(val){
						reject(val);
					});
				} else {
					var details = buildStatusHeading(source);
					details += 'Failed to determine the type of report.';
					writeFile(status, details)
					.then(function(){
						resolve();
					}, function(){
						reject();
					});
				}
			}).catch(function(err){
				console.log(err);
				var details = buildStatusHeading(source);
				details += err;
				writeStatusFile(err, details)
				.then(function(){
					resolve();
				}, function(){
					reject();
				});
			});
		});
}

var writeFile = function(destination, data){
	return new Promise(
		function(resolve, reject){
			fs.writeFile(destination, data, function(err){
				if (err) {
					reject(err);
				} else {
					console.log('Saved', destination);
					resolve();
				}
			});
		});
}

var readFile = function(source) {
	return new Promise(
		function(resolve, reject) {
			fs.readFile(source, 'utf-8', function(err, data) {
				if (err) {
					reject(err);
					return;
				}
				resolve(data);
			});
		});
}

var guessReport = function(data) {
	var result = {document: {}, detected: false, original: data};
	documents.forEach(function(document){
		if (data.search(new RegExp(document.keyword, 'g')) >= 0) {
			result.document = document;
			result.detected = true;
			return;
		}
	});
	return result;
}

var extractSections = function(data) {	
	var re = /(?:\n#* )(.*)(?:\n)|(?:\n\*)(.*)(?:\*\n)|(?:\n_)(.*)(?:_\n)/gm;
	var results = [];
	var match = {};
	while (match = re.exec(data)){
		var result = {
			type: types.heading1,
			index: match.index,
			heading: match[1] || match[2],
			textEnd: match.index,
			done: false
		};
		result.heading = result.heading.replace(/:+$/,'');
		result.textStart = result.index + match[0].length + 1;
		if (match[0].split('#').length > 2) result.type = types.heading2;
		results.push(result);
	}
	
	for (var idx=1; idx < results.length; idx++){
		console.log(results[idx - 1]);
		results[idx - 1].textEnd = results[idx].index;
	}
	
	if (results.length > 0) {
		results[results.length - 1].textEnd = data.length;
	}
	
	return results;
}

var extractTitleAbstract = function(data, firstSectionStart) {
	var re = /^(?:---\ntitle: \')(.*)(?:\'\n...)|^(?:\*)(.*)(?:\*)|^(?:_)(.*)(?:_)/;
	var result = null;
	var match = re.exec(data);
	if (match) {
		result = {
			type: types.title1,
			index:  match.index,
			heading: match[1] || match[2] || match[3],
			textEnd: firstSectionStart,
			done: false
		};
		result.textStart = result.index + match[0].length + 1;
	}
	
	return result;
}

var logResult = function (result, data){
	console.log(result);
	console.log('Text:', data.substring(result.textStart, result.textEnd));
}


var buildFile = function(desiredSections, actualSections, data) {
	var document = {
		details: {},
		contents: ''
	};
	document.details.missing = [];
	document.details.unknown = [];
	document.details.requires = [];
	document.details.complete = true;
	document.details.unordered = false;
	
	var desiredIdx = 1;
	desiredSections.forEach(function(desired){	
		// a heading with an abstract
		console.log(desired.name);
		if (desired.type === types.title1 || desired.type === types.title2){
			var actual = {};
			if (actualSections.length > 0) {
				actual = actualSections[0] || {type:-1, heading: 'Title here', done: false};
			}
			
			document.contents += '---\ntitle: \'' + actual.heading + '\'\n...\n';
			
			// Check for the abstract text
			if (desired.type === types.title1){
				if (desired.type === actual.type) {
					actual.done = true;
					if (actual.textEnd <= actual.textStart) {
						document.details.complete = false;
						document.contents += '*Enter abstract here*\n';
					} else {
						document.contents += data.substring(actual.textStart, actual.textEnd);
						document.contents += '\n';
					}		
				} else {
					document.details.complete = false;
					document.contents += '*Enter abstract here*\n';
				}
			}
			if (!document.details.complete){
				document.details.missing.push(desired);
			}
		} else {		
			// Find the actual section
			var actualIdx = actualSections.findIndex(function(element, index, array){
				return (element) && (element.heading.toUpperCase() === desired.name.toUpperCase() && !element.done);
			});
			
			if (actualIdx !== desiredIdx) {
				console.log('Order wanted', desiredIdx, 'got', actualIdx);
				document.details.unordered = true;
			}
			desiredIdx++;
			
			if (desired.type == types.heading1) {
				document.contents += '# ' + desired.name + '\n\n';
			} else {
				document.contents += '## ' + desired.name + '\n\n';
			}

			if (actualIdx >= 0) {
				var actual = actualSections[actualIdx];
				actual.done = true;
				if (actual.textStart < actual.textEnd){
					var sectionText = data.substring(actual.textStart, actual.textEnd);
					document.contents += sectionText;
					document.contents += '\n';

					if ('requires' in desired){
						if (sectionText.indexOf(desired.requires) < 0) {
							document.details.requires.push({
								heading: desired.name,
								requires: desired.requires
							});
							document.details.complete = false;
						}
					}
				}
			} else {
				document.details.complete = false;
				document.details.missing.push(desired);
			}
		}
	});

	actualSections.forEach(function(actual){
		if (actual && !actual.done) {
			document.details.unknown.push(actual);
		}
	});
	
	return document;
}

var buildStatusHeading = function(source) {
	var result = '---\ntitle: \'Processing status details for ' + source + '\'\n...\n';
	result += '# Details\n';
	return result;
}

var buildStatus = function(details, source, destination, data, detected){
	var baseSource = path.basename(source, config.file.markdown) + config.file.docx;
	var baseDestination = path.basename(destination, config.file.markdown) + config.file.docx;
	var result = buildStatusHeading(baseSource);
	result += 'Report type has been detected as ' + detected + '\n\n';
	var complete = details.complete 
	if (details.complete) {
		if (details.unordered) {
			result += 'The file is complete but the order of sections is incorrect.  See ' + baseDestination + ' for suggested file changes.\n';
		} else {
			result += 'The file is complete and can be submitted.';
		}
	} else {
		result += 'The file is incomplete, please see ' + baseDestination + ' for suggested file changes.\n\n';
		if (details.unknown.length > 0) {
			result += '## Unknown sections\n';
			result += 'Found the following unknown sections which have been removed from ' + baseDestination + ': \n\n';

			details.unknown.forEach(function(section){
				result += '* ' + section.heading + '\n';
			})
			result += '\n';
		}
		
		if (details.missing.length > 0) {
			result += '## Missing sections\n';
			result += 'The following sections were missing and have been added to ' + baseDestination + ': \n\n';
			details.missing.forEach(function(missing){
				result += '* ' + missing.name;
				if ('requires' in missing){
					console.log('??');
					result += ' (also requires: ' + missing.requires + ')';
					console.log('??');
				}
				result += '\n';
			});
			result += '\n';
		}
		
		if (details.requires.length > 0) {
			result += '## Required information\n';
			result += 'The following sections require the following information: \n\n';
			details.requires.forEach(function(requires){
				result += '* ' + requires.heading + ' : ' + requires.requires + '\n';
			});
			result += '\n';
		}
	}
	
	return result;
}


///////////////////////////////////////////////////////////////
// Polyfills for ES6
require('es6-promise').polyfill();
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

module.exports = {
	process : process
}
