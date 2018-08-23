
app.controller('LoginController', ['$scope', '$rootScope', '$location', '$http', '$window', '$cookieStore', 'Idle', function ($scope, $rootScope, $location, $http, $window, $cookieStore, Idle) {
    $scope.alert = {};
    $scope.session = { EmailAddress: '', Password: '' };
    $scope.working = { login: false };

    $scope.login = function () 
    {
        $scope.working.login = true;
        var json = 
        {
            Session: {
                EmailAddress: $scope.session.EmailAddress,
                Password: $scope.session.Password
            }
        };
        $http.post($rootScope.baseUrl + '/odata/Users/Default.Authenticate', JSON.stringify(json))
            .then(function (response) 
            {
                // Set the cookie
                $cookieStore.put('SILO_AUTH_USER_ID', response.data.AuthUserId);
                $cookieStore.put('SILO_AUTH_EXPIRATION', response.data.AuthExpiration);
                $cookieStore.put('SILO_AUTH_TOKEN', response.data.AuthToken);

                // Apply the http headers
                $http.defaults.headers.common = {
                    'AUTH_USER_ID': response.data.AuthUserId,
                    'AUTH_EXPIRATION': response.data.AuthExpiration,
                    'AUTH_TOKEN': response.data.AuthToken
                };
                
                $rootScope.auth = {};
                $rootScope.auth.userId = response.data.AuthUserId;
                $rootScope.auth.expiration = response.data.AuthExpiration;
                $rootScope.auth.token = response.data.AuthToken;

                $http.get($rootScope.baseUrl + "/odata/Users(" + response.data.AuthUserId + ")")
                    .then(response2 => {
                        $rootScope.current = {};
                        $rootScope.current.user = response2.data;
                        $location.path("/home");

                        // Reset the document title, in case the session expired
                        $(document).prop('title', 'SILO - QuadLogic Controls');

                        Idle.watch();
                    }, error2 => {
                        $scope.working.login = false;
                        if (error2.data) {
                            $scope.alert.login = error2.data.error.message;
                            console.error(error2.data);
                        } else {
                            $scope.alert.login = 'Sorry, there was an issue with the server';
                            console.error(error2);
                        }
                    });
            }, function (error) {
                $scope.working.login = false;
                if (error.data) {
                    $scope.alert.login = error.data.error.message;
                    console.error(error.data);
                } else {
                    $scope.alert.login = 'Sorry, there was an issue with the server';
                    console.error(error);
                }
            });
    };

    Idle.unwatch();
    
    // Focus on email input and scroll to top
    $window.document.getElementById("session_email_address").focus();
    $window.scrollTo(0, 0);
}]);