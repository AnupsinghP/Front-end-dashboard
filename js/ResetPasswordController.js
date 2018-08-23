
app.controller('ResetPasswordController', ['$scope', '$rootScope', '$location', '$http', '$window', 'Idle', function ($scope, $rootScope, $location, $http, $window, Idle) {
    $scope.alert = {};
    $scope.user = { EmailAddress: '' };
    $scope.working = { send: false };

    $scope.send = function () {
        $scope.working.send = true;
        var json = {
            EmailAddress: $scope.user.EmailAddress
        };
        $http.post($rootScope.baseUrl + '/odata/Users/Default.ResetPassword', JSON.stringify(json))
            .then(function (response) {
                $scope.working.send = false;
                $scope.alert.send = "You should have received an Email with a new password now";
            }, function (error) {
                $scope.working.send = false;
                if (error.data) {
                    $scope.alert.send = error.data.error.message;
                    console.error(error.data);
                } else {
                    $scope.alert.send = 'Sorry, there was an issue with the server';
                    console.error(error);
                }
            });
    };
    
    // Focus on email input and scroll to top
    $window.document.getElementById("user_email_address").focus();
    $window.scrollTo(0, 0);
}]);