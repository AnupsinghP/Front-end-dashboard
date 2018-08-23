app.controller('MeterOverviewController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', '$window', function ($http, $location, $rootScope, $routeParams, $scope, $window) 
{
	$scope.readingsPageStart = 0;
	$scope.loading = { readings: true };
    $scope.working = { save: false };
    $scope.readings = [];

	$scope.readingsEnd = function () {
        return $scope.readingsPageStart + 20 < $scope.readingsCount ? $scope.readingsPageStart + 20 : $scope.readingsCount;
    };

    $scope.readingsNext = function () {
        $scope.readingsPageStart = $scope.readingsPageStart + 20;
        $scope.refreshReadings();
    };
    
    $scope.readingsPrevious = function () {
        $scope.readingsPageStart = $scope.readingsPageStart - 20;
        $scope.refreshReadings();
    };

    $scope.readingsStart = function () {
        return $scope.readingsPageStart + 1;
    };
	$scope.refreshMeter = function () {
        if ($routeParams.id == null)
        {
            $scope.breadcrumb = 'New';
            $scope.meter = {};
            $scope.Connection = {};

            return;
        }
        else
        {
            $scope.breadcrumb = 'View';
            $http.get($rootScope.baseUrl + '/odata/Meters(' + $routeParams.id + ')')
                .then(function (response) {
                	$scope.loading.connections = false;
                    $scope.meter = response.data;
                    $scope.connectionsCount = response.data["@odata.count"];
                    $scope.refreshReadings();
                    $scope.refreshConnections();
                    $scope.refreshTransponders();
                }, function (response) {
                    console.error(response);
                });
        }
    };

    $scope.refreshReadings = function () {
        $scope.readings = [];
        $scope.loading.readings = true;
        $scope.readings.status = 'OK'
        $http.get($rootScope.baseUrl + '/odata/Readings?$count=true&$orderby=CreatedAt&$filter=MeterId eq ' + $scope.meter.Id + '&$top=20&$skip=' + 0)
            .then(function (response) {
                $scope.readings = response.data.value;
                $scope.loading.readings = false;
                $scope.readingsCount = response.data["@odata.count"];
                var da = new Date($scope.readings[0].CreatedAt);
                var currentDate = new Date();
				if(currentDate.getMonth() == da.getMonth())
				{
					if(currentDate.getDate() > da.getDate())
					{
						$scope.readings.status = 'Not Connected'
					}
				}
            }, function (response) {
            	$scope.loading.readings = false;
                console.error(response);
            });
    };

     $scope.refreshConnections = function () 
     {
     	$http.get($rootScope.baseUrl + '/odata/Connections('+$scope.meter.ConnectionId+')')
     	.then(function(response){
     		  $scope.Connections = response.data;
     	}, function (response) {
                $scope.loading.readings = false;
                console.error(response);
        });

     };

    $scope.refreshTransponders = function () {
    	$scope.Transponder = {};
        $http.get($rootScope.baseUrl + '/odata/Transponders('+$scope.meter.TransponderId+')')
            .then(function (response) {
                $scope.Transponder = response.data;
            }, function (response) {
                console.error(response);
            });
    };
    $scope.refreshMeter();
}]);