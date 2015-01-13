var app = angular.module('funderApp');

app.filter('yesNo', function() {
	return function(text) {
		if (text) {
			return 'Yes';
		}
		return 'No';
	};
});

app.filter('titleCase', function() {
	return function(s) {
		s = ( s === undefined || s === null ) ? '' : s;
		return s.toString().toLowerCase().replace( /\b([a-z])/g, function(ch) {
			return ch.toUpperCase();
		});
	};
});

app.filter('awardDate', function(){
	return function(text) {
		if (!text){
			return 'Awaiting approval';
		} 
		
		return 'Awarded: ' + new Date(text).toDateString();
	};
});
