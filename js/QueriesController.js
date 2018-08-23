
app.controller('QueriesController', ['$http', '$location', '$rootScope', '$scope', '$window', function ($http, $location, $rootScope, $scope, $window) {
    $scope.loading = { queries: true };
    $scope.queriesPageStart = 0;
    $scope.queries = [];

    $scope.errorLength = function (query) {
        if (query.Errors) {
            return angular.fromJson(query.Errors).length;
        } else {
            return '';
        }
    };

    $scope.refreshQueries = function () {
        $scope.queries = [];
        $scope.loading.queries = true;
        $http.get($rootScope.baseUrl + '/odata/Queries?$count=true&$expand=Connection($expand=Building)&$orderby=CreatedAt desc&$top=20&$skip=' + $scope.queriesPageStart)
            .then(function (response) {
                $scope.loading.queries = false;
                $scope.queries = response.data.value;
                $scope.queriesCount = response.data["@odata.count"];
            }, function (response) {
                $scope.loading.queries = false;
                console.error(response);
            });
    };

    $scope.refreshQueries();

    $scope.queriesEnd = function () {
        return $scope.queriesPageStart + 20 < $scope.queriesCount ? $scope.queriesPageStart + 20 : $scope.queriesCount;
    };

    $scope.queriesNext = function () {
        $scope.queriesPageStart = $scope.queriesPageStart + 20;
        $scope.refreshQueries();
    };
    
    $scope.queriesPrevious = function () {
        $scope.queriesPageStart = $scope.queriesPageStart - 20;
        $scope.refreshQueries();
    };

    $scope.queriesStart = function () {
        return $scope.queriesPageStart + 1;
    };
    
    // Scroll to top
    $window.scrollTo(0, 0);
}]);
