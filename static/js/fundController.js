angular.module('funderApp', ['ui.bootstrap']);

angular.module('funderApp').controller('FundListCtrl', function ($scope, $modal) {
	$scope.funds = [{
		name: 'Are people like fish?',
		researcher: 'billy@fish.com',
		created: new Date('2012-09-01'),
		funded: new Date('2013-10-23'),
		reportDue: new Date('2014-10-23'),
		status: 'Funded',
		overdue: true
	},
	{
		name: 'Something very serious',
		researcher: 'bob@grey.com',
		created: new Date('2012-09-01'),
		funded: new Date('2014-05-04'),
		reportDue: new Date('2015-05-04'),
		status: 'Submitted',
		overdue: false
	},
	{
		name: 'They\'d be crazy to fund this',
		researcher: 'krusty@clown.biz',
		created: new Date('2012-09-01'),
		funded: new Date('2014-08-11'),
		reportDue: new Date('2015-12-12'),
		status: 'Rejected',
		overdue: false
	}];
	
	$scope.remove = function(fund){
		var idx = $scope.funds.indexOf(fund);
		if (idx >= 0) {
			$scope.funds.splice(idx, 1);
		}
	};
	
	$scope.edit = function(fund){
		var modalInstance = $modal.open({
			templateUrl: 'editFundContent.html',
			backdrop: true,
			controller: 'EditFundCtrl',
			resolve: {
				fund: function(){
					return fund;
				}
			}
		});
	};
	
	$scope.create = function(){
		var newFund = {
			name: '',
			researcher: '',
			created: new Date(),
			funded: null,
			reportDue: null,
			status: 'Created',
			overdue: false
		};
		
		if (newFund.reportDue) newFund.reportDue.setFullYear(newFund.reportDue.getFullYear() + 1);
		
		var modalInstance = $modal.open({
			templateUrl: 'editFundContent.html',
			backdrop: true,
			controller: 'EditFundCtrl',
			resolve: {
				fund: function(){
					return newFund;
				}
			}
		});
		
		modalInstance.result.then(function(fund) {
			console.log(fund || {});
      $scope.funds.push(fund);
    });
	};
	
});

angular.module('funderApp').controller('EditFundCtrl', function($scope, $modalInstance, fund){
	$scope.fund = fund;
	$scope.newFund = angular.copy(fund);
	
	$scope.today = function(item){
		item = new Date();
	};
	
	$scope.dateOptions = {
    startingDay: 1
  };
  
  $scope.format = 'dd/MM/yyyy';
	
	$scope.openDate = function($event, opened){
		$event.preventDefault();
    $event.stopPropagation();
    $scope[opened] = true;
	};
	
	$scope.fundedPlusYear = function(){
		$scope.newFund.reportDue = new Date($scope.newFund.funded);
		$scope.newFund.reportDue.setFullYear($scope.newFund.reportDue.getFullYear() + 1);
	};

	$scope.ok = function () {
		$scope.fund = angular.copy($scope.newFund);
		$modalInstance.close($scope.fund);
	};
	
	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
});
