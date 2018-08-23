
app.controller('ApplicationController', ['$scope', '$rootScope', '$location', '$http', '$cookieStore', 'Idle', 'Keepalive', function ($scope, $rootScope, $location, $http, $cookieStore, Idle, Keepalive) {
    if ($cookieStore.get('SILO_AUTH_USER_ID'))
    {
        $http.defaults.headers.common = {
            'AUTH_USER_ID': $cookieStore.get('SILO_AUTH_USER_ID'),
            'AUTH_EXPIRATION': $cookieStore.get('SILO_AUTH_EXPIRATION'),
            'AUTH_TOKEN': $cookieStore.get('SILO_AUTH_TOKEN')
        };
        
        $rootScope.auth = {};
        $rootScope.auth.userId = $cookieStore.get('SILO_AUTH_USER_ID');
        $rootScope.auth.expiration = $cookieStore.get('SILO_AUTH_EXPIRATION');
        $rootScope.auth.token = $cookieStore.get('SILO_AUTH_TOKEN');

        $http.get($rootScope.baseUrl + "/odata/Users(" + $rootScope.auth.userId + ")")
            .then(response => {
                $rootScope.current = {};
                $rootScope.current.user = response.data;

                // Reset the document title, in case the session expired
                $(document).prop('title', 'SILO - QuadLogic Controls');

                Idle.watch();
            }, error => {
                $location.path("/login");
            });
    }
    
    $scope.logout = function () {
        $http.defaults.headers.common = {};
        delete $rootScope.auth;
        delete $rootScope.current;
        $cookieStore.remove('SILO_AUTH_USER_ID');
        $cookieStore.remove('SILO_AUTH_EXPIRATION');
        $cookieStore.remove('SILO_AUTH_TOKEN');
        $location.path('/');
    };
}]);