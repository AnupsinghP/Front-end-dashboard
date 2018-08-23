
app.controller('AccountController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', function ($http, $location, $rootScope, $routeParams, $scope) {
    $scope.show = { changePassword: false };
    $scope.working = { save: false };
    
    $scope.refreshUser = function () {
        $http.get($rootScope.baseUrl + '/odata/Users(' + $rootScope.current.user.Id + ')')
            .then(function (response) {
                $scope.user = response.data;
            }, function (response) {
                console.error(response);
            });
    };

    $scope.save = function () {
        $scope.working.save = true;
        var json = {
            EmailAddress: $scope.user.EmailAddress,
            Name: $scope.user.Name
        };
        
        // Changing password is optional
        if ($scope.show.changePassword) {
            json.Password = $scope.user.Password;
        }

        $http.patch($rootScope.baseUrl + "/odata/Users(" + $rootScope.current.user.Id + ")", JSON.stringify(json))
            .then(response => {
                // $location.path("/dashboard");
                $rootScope.current.user.EmailAddress = json.EmailAddress,
                $rootScope.current.user.Name = json.Name;
                alert('Changes were saved successfully!');
                $scope.working.save = false;
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };
    
    $scope.refreshUser();
}]);
