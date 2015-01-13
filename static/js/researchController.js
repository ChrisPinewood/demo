app.controller('ResearcherCtrl', function ($scope) {
	$scope.user='researcher.rwell@gmail.com';
});

app.controller('ReportListCtrl', function ($scope, $modal, $http) {
	
	$scope.fund = {};
	$scope.reports = [];
	
	$http.get('/data/funds.json').success(function(data, status, headers, config){
		// Add aggregate information to the data
		if (data){
			data.forEach(function(fund){
				console.log('\'' + fund.email + '\'');
				if (fund.email === 'reseacher.rwell@gmail.com'){
					$scope.fund = fund;
					$scope.reports = fund.reports;
					$scope.fund.lastUpdated = lastUpdated(fund);
					if ($scope.fund.awarded){
						$scope.fund.due = new Date($scope.fund.awarded);
						$scope.fund.due.setFullYear($scope.fund.due.getFullYear() + 1);
					}
				}
			});
		}
	});
	
	$scope.getArrayAsList = function(missing) {
		var list = '';
		missing.forEach(function(item){
			list += item.name + '\n';
		});
		
		return list;
	};
	
	$scope.getWhyIncomplete = function(report) {
		var reason = '';
		if (report.complete) reason += 'Complete\n';
		
		if (report.missing && report.missing.length > 0)
			reason += 'Missing sections = ' + report.missing.length  + '\n';
			
		if (report.unknown && report.unknown.length > 0)
			reason += 'Unknown sections = ' + report.unknown.length + '\n';
			
		if (report.requires && report.requires.length > 0)
			reason += 'Sections with requied information = ' + report.requires.length + '\n';
			
		return reason;
	}
	
	var lastUpdated = function(fund){
		if (fund.reports.length < 1)
			return null;
			
		var result = fund.reports[0].updated;
		for (var reportIdx = 1; reportIdx < fund.reports.length; reportIdx++){
			if (result < fund.reports[reportIdx].updated){
				result = fund.reports[reportIdx].updated;
			}
		}
					
		return result;
	}
});
