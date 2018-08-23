app.controller('ViewAllBldgController', ['$http', '$location', '$rootScope', '$scope', '$window', function ($http, $location, $rootScope, $scope, $window) {
 	$scope.loading = { buildings: true };
 	$scope.buildingsPageStart = 0;
    $scope.buildings = [];

    $http.get($rootScope.baseUrl + '/odata/Buildings?$count=true&$orderby=State,City,Address&$top=20&$skip=' + $scope.buildingsPageStart)
        .then(function (response) {
            $scope.buildings = response.data.value;
            $scope.buildingsCount = response.data["@odata.count"];
        }, 
        function (response) {
            $scope.loading.buildings = false;
                console.error(response);
    });
    
    $scope.refreshBuildings = function () {
        $scope.buildings = [];
        $scope.loading.buildings = true;
        $http.get($rootScope.baseUrl + '/odata/Buildings?$count=true&$orderby=State,City,Address&$top=20&$skip=' + $scope.buildingsPageStart)
            .then(function (response) {
                $scope.loading.buildings = false;
                $scope.buildings = response.data.value;
                $scope.buildingsCount = response.data["@odata.count"];
            }, function (response) {
                $scope.loading.buildings = false;
                console.error(response);
            });
    };    
        
    $scope.buildingsEnd = function () {
        return $scope.buildingsPageStart + 20 < $scope.buildingsCount ? $scope.buildingsPageStart + 20 : $scope.buildingsCount;
    };

    $scope.buildingsNext = function () {
        $scope.buildingsPageStart = $scope.buildingsPageStart + 20;
        $scope.refreshBuildings();
    };
    
    $scope.buildingsPrevious = function () {
        $scope.buildingsPageStart = $scope.buildingsPageStart - 20;
        $scope.refreshBuildings();
    };

    $scope.buildingsStart = function () {
        return $scope.buildingsPageStart + 1;
    };

    // Scroll to top
    $window.scrollTo(0, 0);
 }]);