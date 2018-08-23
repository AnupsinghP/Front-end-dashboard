
app.controller('UsersController', ['$http', '$location', '$rootScope', '$scope', '$window', function ($http, $location, $rootScope, $scope, $window) {
    $scope.loading = { users: true };
    $scope.usersPageStart = 0;
    $scope.users = [];

    $scope.refreshUsers = function () {
        $scope.users = [];
        $scope.loading.users = true;
        $http.get($rootScope.baseUrl + '/odata/Users?$count=true&$orderby=CreatedAt')
            .then(function (response) {
                $scope.loading.users = false;
                $scope.users = response.data.value;
                $scope.usersCount = response.data["@odata.count"];
            }, function (response) {
                $scope.loading.users = false;
                console.error(response);
            });
    };

    $scope.refreshUsers();

    $scope.usersEnd = function () {
        return $scope.usersPageStart + 20 < $scope.usersCount ? $scope.usersPageStart + 20 : $scope.usersCount;
    };

    $scope.usersNext = function () {
        $scope.usersPageStart = $scope.usersPageStart + 20;
        $scope.refreshUsers();
    }
    
    $scope.usersPrevious = function () {
        $scope.usersPageStart = $scope.usersPageStart - 20;
        $scope.refreshUsers();
    }

    $scope.usersStart = function () {
        return $scope.usersPageStart + 1;
    }
    
    // Scroll to top
    $window.scrollTo(0, 0);
}]);
