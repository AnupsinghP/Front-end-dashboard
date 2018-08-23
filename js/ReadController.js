
app.controller('ReadController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', function ($http, $location, $rootScope, $routeParams, $scope) {
    $scope.refreshRead = function () {
        $http.get($rootScope.baseUrl + '/odata/Reads(' + $routeParams.id + ')')
            .then(function (response) {
                $scope.read = response.data;
            }, function (response) {
                console.error(response);
            });
    };

    $scope.refreshRead();
}]);
