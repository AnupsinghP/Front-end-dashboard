
app.controller('DashboardController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', function ($http, $location, $rootScope, $routeParams, $scope) {
    $scope.filter = { date: moment().format("YYYY-MM-DD") };

    $scope.refreshStatistics = function () {
        $http.get($rootScope.baseUrl + "/odata/Connections/Default.Statistics(Date='" + $scope.filter.date + "')")
            .then(function (response) {
                $scope.statistics = response.data.value;
            }, function (response) {
                console.error(response);
            });
    };

    $scope.refreshStatistics();
}]);
