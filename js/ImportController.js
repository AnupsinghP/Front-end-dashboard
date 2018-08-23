
app.controller('ImportController', ['$http', '$location', '$rootScope', '$scope', '$window', function ($http, $location, $rootScope, $scope, $window) {
    $scope.import = { };
    $scope.working = { save: false };

    $scope.import = function () {
        $scope.working.save = true;

        var json = {
            Csv: $scope.import.csv
        }

        $http.post($rootScope.baseUrl + "/odata/Reads/Default.ImportCsv", JSON.stringify(json))
            .then(response => {
                $scope.working.save = false;
                $location.path("/reads");
            }, error => {
                $scope.working.save = false;
                console.error(error)
            })
    };

    // Scroll to top
    $window.scrollTo(0, 0);
}]);