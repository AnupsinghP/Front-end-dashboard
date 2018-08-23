
app.controller('MetersController', ['$http', '$location', '$rootScope', '$scope', '$window', function ($http, $location, $rootScope, $scope, $window) {
    $scope.loading = { meters: true };
    $scope.metersPageStart = 0;
    $scope.meters = [];

    $scope.refreshMeters = function () {
        $scope.meters = [];
        $scope.loading.meters = true;
        $http.get($rootScope.baseUrl + '/odata/Meters?$count=true&$expand=Building&$orderby=Building/City,Building/State,SerialNumber')
            .then(function (response) {
                $scope.loading.meters = false;
                $scope.meters = response.data.value;
                $scope.metersCount = response.data["@odata.count"];
            }, function (response) {
                $scope.loading.meters = false;
                console.error(response);
            });
    };

    $scope.refreshMeters();

    $scope.metersEnd = function () {
        return $scope.metersPageStart + 20 < $scope.metersCount ? $scope.metersPageStart + 20 : $scope.metersCount;
    };

    $scope.metersNext = function () {
        $scope.metersPageStart = $scope.metersPageStart + 20;
        $scope.refreshMeters();
    }
    
    $scope.metersPrevious = function () {
        $scope.metersPageStart = $scope.metersPageStart - 20;
        $scope.refreshMeters();
    }

    $scope.metersStart = function () {
        return $scope.metersPageStart + 1;
    }
    
    // Scroll to top
    $window.scrollTo(0, 0);
}]);
