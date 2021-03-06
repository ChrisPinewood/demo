var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;
var documents = require('./resources/documents').documents;
var types = require('./resources/types');
var config = require('./config');
var git = require('./git');
var moment = require('moment');

var processManuscript = function(source, destination, status) {
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
			
					var desired = buildFile(info.document.sections, sections, data);
			
					writeFile(destination, desired.contents)
					.then(function(){
						var details = buildStatus(desired.details, source, destination, data, info.document.name);
						return writeFile(status, details, desired.details);
					}).then(function(details){
						var reportDetails = { 
							study: buildStudy(source),
							filename: buildFilename(source), 
							markdown: buildMarkdown(source), 
							link: buildLink(source),
							dmplink: buildDMP(source),
							detaillink: buildDetail(source)
						};
						var statusObject = buildStatusObject(desired.details, info.document.name, reportDetails);
						return updateFile(statusObject);
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

var buildStudy = function(source) {
	return path.basename(source, config.file.markdown);
}

var buildFilename = function(source){
	var basename = path.basename(source, config.file.markdown);
	return basename + config.file.docx;
}

var buildMarkdown = function(source){
	return basename = path.basename(source);
}

var buildLink = function(source){
	return config.git.historyUrl + buildMarkdown(source);
}

var buildPreregLink = function(source, blob){
	return config.git.blobUrl + blob + '/' + buildMarkdown(source);
}

var buildDMP = function(source){
	var basename = path.basename(source, config.file.markdown);
	return buildLink(basename + config.file.dmp + config.file.markdown);
}

var buildDetail = function(source){
	var basename = path.basename(source, config.file.markdown);
	return buildLink(basename + config.file.detail + config.file.markdown);
}

var writeFile = function(destination, data, pass){
	return new Promise(
		function(resolve, reject){
			fs.writeFile(destination, data, function(err){
				if (err) {
					reject(err);
				} else {
					var passthrough = pass;
					console.log('Saved', destination);
					resolve(pass);
				}
			});
		});
}

var updateFile = function(statusObject){
	return new Promise(
		function(resolve, reject){
			if (!statusObject){
				reject();
				return;
			}
		
			fs.readFile(config.file.documentStatus, 'utf-8', function(err, data){
				if (err){
					reject(err);
					return;
				}
				var allStatus = JSON.parse(data);
	
				var statusIdx = allStatus.findIndex(function(element, index, array){
					return (element) && (element.researcher.toUpperCase() === statusObject.researcher.toUpperCase());
				});
				
				if (statusIdx >= 0){
					allStatus[statusIdx].researcher = statusObject.researcher;
					allStatus[statusIdx].email = statusObject.email;
					allStatus[statusIdx].repo = statusObject.repo;
					
					if (!allStatus[statusIdx].reports){
						allStatus[statusIdx].reports = [];
					}
					
					// If a report was given, add it to the reports array
					if (statusObject.report) {
						var reportIdx = allStatus[statusIdx].reports.findIndex(function(element, index, array){
							return (element) && (element.filename.toUpperCase() === statusObject.report.filename.toUpperCase());
						});
					
						if (reportIdx >= 0){
							console.log('Adding to report idx', reportIdx);
							allStatus[statusIdx].reports[reportIdx] = extend(allStatus[statusIdx].reports[reportIdx], statusObject.report);
						} else {
							console.log('Adding first report');
							allStatus[statusIdx].reports.push(statusObject.report);
						}
					} else {
						// If no report was given, overwrite the reports array with given reports
						allStatus[statusIdx].reports = statusObject.reports;
					}
				} else {
					var newStatus = statusObject;
					delete newStatus.report;
					newStatus.reports = [statusObject.report];
					allStatus.push(newStatus);
				}
				
				var strObj = JSON.stringify(allStatus, null, 2);
				console.log('Writing', config.file.documentStatus, '...');
				fs.writeFile(config.file.documentStatus, strObj, function(err){
					if (err) {
						console.log('FAILED to write', config.file.documentStatus);
						reject(err);
					} else {
						console.log('... wrote', config.file.documentStatus);
						resolve();
					}
				});
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

var extractStatusObject = function(data, researcher){
	var allStatus = JSON.parse(data);
	
	var statusIdx = allStatus.findIndex(function(element, index, array){
		return (element) && (element.researcher.toUpperCase() === researcher.toUpperCase());
	});
	
	var extracted = {};
	
	if (statusIdx >= 0){
		extracted = allStatus[statusIdx];
	}
	
	return extracted;	
}

var guessReport = function(data) {
	var result = {document: {}, detected: false, original: data};
	documents.forEach(function(document){
		if (data.search(new RegExp(document.keyword, 'gi')) >= 0) {
			result.document = document;
			result.detected = true;
			return;
		}
	});
	return result;
}

var extractSections = function(data) {	
	var re = /(?:\n#* )(.*)(?:\n)|(?:\n\*)(.*)(?:\*)|(?:\n_)(.*)(?:_\n)/gim;
	var results = [];
	var match = {};
	while (match = re.exec(data)){
		var result = {
			type: types.heading1,
			index: match.index,
			heading: match[1] || match[2] || match[3],
			textEnd: match.index,
			done: false
		};
		
		result.heading = result.heading.replace(/[:\*]/g,'');
		result.heading = result.heading.trim();
		result.textStart = result.index + match[0].length + 1;
		if (match[0].split('#').length > 2) result.type = types.heading2;
		results.push(result);
	}
	
	for (var idx=1; idx < results.length; idx++){
		results[idx - 1].textEnd = results[idx].index;
	}
	
	if (results.length > 0) {
		results[results.length - 1].textEnd = data.length;
	}
	
	return results;
}

var extractTitleAbstract = function(data, firstSectionStart) {
	var re = /^(?:---\ntitle: \')(.*)(?:\'\n...)|^(?:\*)(.*)(?:\*)|^(?:_)(.*)(?:_)|^(?:#* )(.*)(?:\n)/;
	var result = null;
	var match = re.exec(data);
	if (match) {
		result = {
			type: types.title1,
			index:  match.index,
			heading: match[1] || match[2] || match[3] || match[4],
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
			} else {
				actual.done = true;
			}
			
			if (!document.details.complete){
				document.details.missing.push(desired);
			}
		} else 
		{		
			// Find the actual section
			var actualIdx = actualSections.findIndex(function(element, index, array){
				return (element) && (element.heading.toUpperCase() === desired.name.toUpperCase() && !element.done);
			});
			
			if (actualIdx !== desiredIdx) {
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
						if (sectionText.toLowerCase().indexOf(desired.requires) < 0) {
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
					result += ' (also requires: ' + missing.requires + ')';
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

var buildStatusObject = function(details, detected, reportDetails){
	var status = {
		researcher: config.user.name,
		repo: config.git.remote,
		email: config.user.email,
		report: reportDetails
	};
	
	status.report.type= detected;
	status.report.complete= details.complete;
	status.report.ordered= details.complete && !details.unordered;
	status.report.unknown= details.unknown;
	status.report.missing= details.missing;
	status.report.requires= details.requires;
	status.report.updated= new Date();
	
	return status;
}

///////////////////////////////////////////////////////////////
//

var extractDate = function(re, data){
	var match = re.exec(data);
	if (match) {
		
		var extracted = match[1].trim();
		console.log('Attempting conversion', extracted);
		moment.locale('en-GB');
		return moment(extracted, ['L', 'l', 'LL', 'l', moment.ISO_8601]);
	}
	return null;
}

var getDataCollectionStart = function(detail) {
	var re = /(?:\n\| Data Collection Start \|)(.*)(?:\|\n)/gim;
	return extractDate(re, detail);
}

var processDetails = function(source, reportName, markdown){
	return new Promise(
		function(resolve, reject){	
			var preregDate = null;
			
			readFile(source)
			.then(function(detail){
				preregDate = getDataCollectionStart(detail);
				console.log('Extracted prereg date', preregDate.format());
				if (preregDate){
					resolve();
				}
				else {
					reject();
					throw "No preregistration yet found";
				}
			}).then(function(){
				return git.lastCommitBefore(config.folder.repo, markdown, preregDate.toDate());
			}).then(function(blob){
				console.log('preregdate', preregDate.format(), 'blob', blob);
				if (preregDate){
					fs.readFile(config.file.documentStatus, 'utf-8', function(err, data){
						if (err){
							reject(err);
							return;
						}
						var statusObject = extractStatusObject(data, config.user.name);
						statusObject.report = {
							filename : reportName,
							preregdate : preregDate.format(),
							prereglink : buildPreregLink(markdown, blob)
						};
						
						updateFile(statusObject).then(resolve).catch(reject);
					});
				}
			})
		})
}

///////////////////////////////////////////////////////////////
//
var processPlan = function(source){
}

///////////////////////////////////////////////////////////////
//
var removeManuscript = function(source){
	return new Promise(
		function(resolve, reject){
			fs.readFile(config.file.documentStatus, 'utf-8', function(err, data){
				if (err){
					reject(err);
					return;
				}
				
				var statusObject = extractStatusObject(data, config.user.name);
				var reports = [];
				statusObject.reports.forEach(function(report){
					if (report.study !== source) {
						console.log('Copying report', report);
						reports.push(report);
					}
				});
				statusObject.reports = reports;
				
				updateFile(statusObject).then(resolve).catch(reject);
			});
		});
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
	manuscript : processManuscript,
	details : processDetails,
	plan : processPlan,
	remove : removeManuscript
}
