
app.controller('QueryController', ['$http', '$location', '$rootScope', '$routeParams', '$sce', '$scope', '$window', function ($http, $location, $rootScope, $routeParams, $sce, $scope, $window) {
    $scope.working = { save: false };

    $scope.connectionName = function (query) {
        if (query && query.Connection.Method == 'IP') {
            return query.Connection.Method + ' - ' + query.Connection.IpAddress;
        } else if (query && query.Connection.Method == 'Modem') {
            return query.Connection.Method + ' - ' + query.Connection.ModemNumber;
        }
    };

    $scope.refreshQuery = function () {
        $http.get($rootScope.baseUrl + '/odata/Queries(' + $routeParams.id + ')?$expand=Connection($expand=Building)')
            .then(function (response) {
                $scope.query = response.data;

                if ($scope.query.Errors != null) {
                    $scope.errors = angular.fromJson($scope.query.Errors);
                } else {
                    $scope.errors = [];
                }

                $scope.log = $sce.trustAsHtml($scope.query.Log.replace(/\\r\\n/g, "<br />"));
            }, function (response) {
                console.error(response);
            });
    };

    $scope.refreshQuery();

    // Scroll to top
    $window.scrollTo(0, 0);
}]);
