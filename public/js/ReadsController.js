
app.controller('ReadsController', ['$http', '$location', '$rootScope', '$scope', '$window', function ($http, $location, $rootScope, $scope, $window) {
    $scope.loading = { reads: true };
    $scope.readsPageStart = 0;
    $scope.reads = [];

    $scope.refreshReads = function () {
        $scope.reads = [];
        $scope.loading.reads = true;
        $http.get($rootScope.baseUrl + '/odata/Reads?$count=true&$expand=Meter&$orderby=CreatedAt')
            .then(function (response) {
                $scope.loading.reads = false;
                $scope.reads = response.data.value;
                $scope.readsCount = response.data["@odata.count"];
            }, function (response) {
                $scope.loading.reads = false;
                console.error(response);
            });
    };

    $scope.refreshReads();

    $scope.readsEnd = function () {
        return $scope.readsPageStart + 20 < $scope.readsCount ? $scope.readsPageStart + 20 : $scope.readsCount;
    };

    $scope.readsNext = function () {
        $scope.readsPageStart = $scope.readsPageStart + 20;
        $scope.refreshReads();
    }
    
    $scope.readsPrevious = function () {
        $scope.readsPageStart = $scope.readsPageStart - 20;
        $scope.refreshReads();
    }

    $scope.readsStart = function () {
        return $scope.readsPageStart + 1;
    }
    
    // Scroll to top
    $window.scrollTo(0, 0);
}]);
