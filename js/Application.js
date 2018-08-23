
var app = angular.module('collector', ['ngRoute', 'ui.bootstrap', 'ngIdle', 'ngAnimate', 'ngCookies']);

app.config(['$routeProvider', 'KeepaliveProvider', 'IdleProvider',
    function ($routeProvider, KeepaliveProvider, IdleProvider) {
        IdleProvider.idle(600); // 10 minutes
        IdleProvider.timeout(1);
        KeepaliveProvider.interval(20);

        $routeProvider.
            when('/', {
                templateUrl: 'pages/Login.html',
                controller: 'LoginController'
            }).
            when('/account', {
                templateUrl: '/pages/Account.html',
                controller: 'AccountController'
            }).
            when('/buildings', {
                templateUrl: '/pages/Buildings.html',
                controller: 'BuildingsController'
            }).
            when('/buildings/new', {
                templateUrl: '/pages/Building.html',
                controller: 'BuildingController'
            }).
            when('/buildings/:id', {
                templateUrl: '/pages/Building.html',
                controller: 'BuildingController'
            }).
            when('/buildings/:building_id/connections/new', {
                templateUrl: '/pages/Connection.html',
                controller: 'ConnectionController'
            }).
            when('/buildings/:building_id/connections/:connection_id', {
                templateUrl: '/pages/Connection.html',
                controller: 'ConnectionController'
            }).
            when('/connections/:connection_id/meters', {
                templateUrl: '/pages/Meters.html',
                controller: 'MetersController'
            }).
            when('/meters/:id', {
                templateUrl: '/pages/Meters.html',
                controller: 'MetersController'
            }).
            when('/connections/:connection_id/meters/new', {
                templateUrl: '/pages/Meter.html',
                controller: 'MeterController'
            }).
            when('/connections/:connection_id/meters/:id', {
                templateUrl: '/pages/Meter.html',
                controller: 'MeterController'
            }).
            when('/connections/:connection_id/transponders', {
                templateUrl: '/pages/Transponders.html',
                controller: 'TranspondersController'
            }).
            when('/connections/:connection_id/transponders/new', {
                templateUrl: '/pages/Transponder.html',
                controller: 'TransponderController'
            }).
            when('/connections/:connection_id/transponders/:id', {
                templateUrl: '/pages/Transponder.html',
                controller: 'TransponderController'
            }).
            when('/dashboard', {
                templateUrl: '/pages/Dashboard.html',
                controller: 'DashboardController'
            }).
            when('/import', {
                templateUrl: '/pages/Import.html',
                controller: 'ImportController'
            }).
            when('/queries', {
                templateUrl: '/pages/Queries.html',
                controller: 'QueriesController'
            }).
            when('/queries/:id', {
                templateUrl: '/pages/Query.html',
                controller: 'QueryController'
            }).
            when('/reads', {
                templateUrl: '/pages/Reads.html',
                controller: 'ReadsController'
            }).
            when('/reads/:id', {
                templateUrl: '/pages/Read.html',
                controller: 'ReadController'
            }).
            when('/reports', {
                templateUrl: '/pages/Reports.html',
                controller: 'ReportsController'
            }).
            when('/reset', {
                templateUrl: '/pages/ResetPassword.html',
                controller: 'ResetPasswordController'
            }).
            when('/users', {
                templateUrl: '/pages/Users.html',
                controller: 'UsersController'
            }).
            when('/users/new', {
                templateUrl: '/pages/User.html',
                controller: 'UserController'
            }).
            when('/users/:id', {
                templateUrl: '/pages/User.html',
                controller: 'UserController'
            }).
            when('/home',{
                templateUrl: '/pages/Home.html',
                controller: 'NavigationController'
            }).
            when('/viewAll',{
                templateUrl: '/pages/ViewAllBuildings.html',
                controller: 'ViewAllBldgController'
            }).when('/bldgovrvw/:id',{
                templateUrl: '/pages/BuildingOverview.html',
                controller: 'BldgOvrvwController'
            }).
            when('/meterOverview/:id', {
                templateUrl: '/pages/MeterDetails.html',
                controller: 'MeterOverviewController'
            }).
            when('/service',{
                templateUrl: '/pages/CommunicationDashboard.html',
                controller: 'CommunicationController'
            }).
            otherwise({
                redirectTo: '/'
            })
    }
]);

app.run(['$rootScope', '$location', '$http', '$cookieStore', 'Idle', 'Keepalive', function ($rootScope, $location, $http, $cookieStore, Idle, Keepalive) {
    $rootScope.$on('IdleStart', function () {
        // starting idle
        console.log('starting idle');
    });

    $rootScope.$on('IdleEnd', function () {
        // idle ending
        console.log('ending idle');
    });

    $rootScope.$on('IdleTimeout', function () {
        // timeout
        $http.defaults.headers.common = {};
        delete $rootScope.auth;
        delete $rootScope.current.user;
        $cookieStore.remove('SILO_AUTH_USER_ID');
        $cookieStore.remove('SILO_AUTH_EXPIRATION');
        $cookieStore.remove('SILO_AUTH_TOKEN');
        $location.path('/');
        $rootScope.$apply();
    });

    // Base URL
    // $rootScope.baseUrl = 'https://collectorweb20180130111838.azurewebsites.net/';
    $rootScope.baseUrl = 'https://silowebproduction.azurewebsites.net';
}]);