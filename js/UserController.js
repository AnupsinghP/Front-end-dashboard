
app.controller('UserController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', function ($http, $location, $rootScope, $routeParams, $scope) {
    $scope.show = { changePassword: false };
    $scope.working = { save: false };

    $scope.refreshUser = function () {
        if ($routeParams.id == null)
        {
            $scope.breadcrumb = 'New';
            $scope.user = {};
            return;
        }
        else
        {
            $scope.breadcrumb = 'View';
            $http.get($rootScope.baseUrl + '/odata/Users(' + $routeParams.id + ')')
                .then(function (response) {
                    $scope.user = response.data;
                }, function (response) {
                    console.error(response);
                });
        }
    };

    $scope.save = function () {
        if ($scope.user.Id == null) {
            $scope.saveNewUser();
        } else {
            $scope.saveExistingUser();
        }
    };

    $scope.saveExistingUser = function () {
        $scope.working.save = true;
        var json = {
            EmailAddress: $scope.user.EmailAddress,
            Name: $scope.user.Name,
            ApiKey: $scope.user.ApiKey,
            ApiSecret: $scope.user.ApiSecret
        };
        
        // Changing password is optional
        if ($scope.show.changePassword) {
            json.Password = $scope.user.Password;
        }

        $http.patch($rootScope.baseUrl + "/odata/Users(" + $scope.user.Id + ")", JSON.stringify(json))
            .then(response => {
                $location.path("/users");
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };

    $scope.saveNewUser = function () {
        $scope.working.save = true;
        var json = {
            EmailAddress: $scope.user.EmailAddress,
            Name: $scope.user.Name,
            Password: $scope.user.Password,
            Role: 'Administrator',
            ApiKey: $scope.user.ApiKey,
            ApiSecret: $scope.user.ApiSecret
        };

        $http.post($rootScope.baseUrl + "/odata/Users", JSON.stringify(json))
            .then(response => {
                $location.path("/users");
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };

    $scope.refreshUser();
}]);
