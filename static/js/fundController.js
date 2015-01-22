app.controller('FunderCtrl', function ($scope) {
	$scope.user='funder.rwell@gmail.com';
});

app.controller('MainCtrl', function ($scope) {
	$scope.user=null;
});

app.controller('FundListCtrl', function ($scope, $modal, $http) {
	
	$scope.funds = [];
	$scope.researchers = [];
	$scope.totalReports = 0;
	$scope.totalOverdue = 0;
	
	$http.get('/data/funds.json').success(function(data, status, headers, config){
		// Add aggregate information to the data
		if (data){
			data.forEach(function(fund){
				fund.lastUpdated = lastUpdated(fund);
				$scope.totalReports += fund.reports.length;
				if (fund.status === 'overdue') $scope.totalOverdue++;
			});
		}
		$scope.funds = data;
	});
	
	$http.get('/data/researcher.json').success(function(data, status, headers, config){
		if (data){
			$scope.researchers = data;
		}
	});
	
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
	
	var getLastUpdate = function(funds){
		var lastUpdated = 'Never';
		if (funds.length > 0){
			lastUpdated = funds[0].lastUpdated;
			for (var idx = 1; idx < funds.length; idx++){
				if (lastUpdated > funds[idx].lastUpdated){
					lastUpdated = funds[idx].lastUpdated;
				}
			}
		}
		return lastUpdated;
	}
	
	$scope.edit = function(fund){
		var modalInstance = $modal.open({
			templateUrl: 'editFund.html',
			backdrop: true,
			controller: 'EditFundCtrl',
			resolve: {
				fund: function(){
					return fund;
				}
			}
		});
		
		modalInstance.result.then(function (result) {
			console.log(result);
    }, function () {
      console.log('Modal dismissed', new Date());
    });
	};
	
	$scope.details = function(fund){
		var modalInstance = $modal.open({
			templateUrl: 'detailFund.html',
			backdrop: true,
			size: 'lg',
			controller: 'DetailFundCtrl',
			resolve: {
				fund: function(){
					return fund;
				}
			}
		});
	};	
});

app.controller('ConfirmCtrl', function($scope, $modalInstance, details){
	$scope.details = details || { title : '', message : '' };
	$scope.title = $scope.details.title || '';
	$scope.message = $scope.details.message || '';
	
	$scope.yes = function() {
		$modalInstance.close();
	};
	
	$scope.no = function() {
		$modalInstance.dismiss();
	};
});

app.controller('EditFundCtrl', function($scope, $modalInstance, fund){
	$scope.fund = fund;
	$scope.newFund = angular.copy(fund);
	
	$scope.ok = function () {
		if ($scope.fund.status !== $scope.newFund.status && $scope.newFund.status === 'ok'){
			$scope.fund.awarded = new Date();
		}
		angular.extend($scope.fund, $scope.newFund);
		$modalInstance.close($scope.fund);
	};
	
	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
});

app.controller('DetailFundCtrl', function($scope, $modalInstance, fund){
	$scope.fund = fund;
	
	$scope.getStatus = function(report) {
		var status = 'New';
		
		if (report.updated){
			var now = new Date();
			var lastUpdate = new Date(report.updated)
			var diff = now - lastUpdate;
			
			var SIX_MONTHS = 1000 * 60 * 60 * 24 * 182;
			if (diff > SIX_MONTHS){
				status = 'Dormant';
			} else {
				status = 'In Development';
			}
		}
		
		return status;
	}
	
	$scope.getIssues = function(report) {
		var issues = [];
		
		if (report.missing.length > 0 || report.unknown.length > 0) {
			issues.push('Does not conform to publishing guidelines');
		}
		
		if (!report.dmplink) {
			issues.push('No data management plan');
		}
		
		if (report.requires.length > 0){
			var missing = [];
			report.requires.forEach(function(item){
				missing.push(item.requires);
			});
			issues.push('No ' + missing.join());
		}
		
		return issues;
	}
	
	
	
	$scope.getPrivacy = function(report) {
		return 'Private';
	}
	
	$scope.generateButton = function(url, title) {
		if (url === '')
			return '';
		
		var button = '<button class="btn btn-default" type="button" title="' + title + '"><i class="glyphicon glyphicon-edit"></i></button>';
		var link = '<a href="' + url + '">' + button + '</a>';
		
		return link;
	}
	
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
	
	$scope.close = function () {
		$modalInstance.dismiss('close');
	};
});
