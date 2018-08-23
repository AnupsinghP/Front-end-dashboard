
app.controller('MeterController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', '$window', function ($http, $location, $rootScope, $routeParams, $scope, $window) {
    $scope.loading = { readings: true };
    $scope.working = { save: false };
    $scope.readings = [];
    $scope.readingsPageStart = 0;

    $scope.delete = function () {
        $scope.working.save = true;
        $http.delete($rootScope.baseUrl + "/odata/Meters(" + $scope.meter.Id + ")")
            .then(response => {
                $location.path("/buildings/" + $scope.building.Id);
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };
    
    $scope.readingsEnd = function () {
        return $scope.readingsPageStart + 20 < $scope.readingsCount ? $scope.readingsPageStart + 20 : $scope.readingsCount;
    };

    $scope.readingsNext = function () {
        $scope.readingsPageStart = $scope.readingsPageStart + 20;
        $scope.refreshReadings();
    };
    
    $scope.readingsPrevious = function () {
        $scope.readingsPageStart = $scope.readingsPageStart - 20;
        $scope.refreshReadings();
    };

    $scope.readingsStart = function () {
        return $scope.readingsPageStart + 1;
    };

    $scope.refreshBuilding = function () {
        $http.get($rootScope.baseUrl + '/odata/Buildings(' + $scope.connection.BuildingId + ')')
            .then(function (response) {
                $scope.building = response.data;
                $scope.refreshConnections();
            }, function (response) {
                console.error(response);
            });
    };

    $scope.refreshConnection = function () {
        $http.get($rootScope.baseUrl + '/odata/Connections(' + $routeParams.connection_id + ')')
            .then(function (response) {
                $scope.connection = response.data;
                $scope.refreshBuilding();
            }, function (response) {
                console.error(response);
            });
    };

    $scope.refreshConnections = function () {
        $scope.connections = [];
        $scope.loading.connections = true;
        $http.get($rootScope.baseUrl + '/odata/Connections?$count=true&$orderby=Method&$filter=BuildingId eq ' + $scope.building.Id)
            .then(function (response) {
                $scope.loading.connections = false;
                $scope.connections = response.data.value;
                $scope.connectionsCount = response.data["@odata.count"];
            }, function (response) {
                $scope.loading.connections = false;
                console.error(response);
            });
    };

    $scope.refreshMeter = function () {
        if ($routeParams.id == null)
        {
            $scope.breadcrumb = 'New';
            $scope.meter = {};
            return;
        }
        else
        {
            $scope.breadcrumb = 'View';
            $http.get($rootScope.baseUrl + '/odata/Meters(' + $routeParams.id + ')')
                .then(function (response) {
                    $scope.meter = response.data;
                    $scope.refreshReadings();
                }, function (response) {
                    console.error(response);
                });
        }
    };
    
    $scope.refreshReadings = function () {
        $scope.readings = [];
        $scope.loading.readings = true;
        $http.get($rootScope.baseUrl + '/odata/Readings?$count=true&$orderby=CreatedAt&$filter=MeterId eq ' + $scope.meter.Id + '&$top=20&$skip=' + $scope.readingsPageStart)
            .then(function (response) {
                $scope.loading.readings = false;
                $scope.readings = response.data.value;
                $scope.readingsCount = response.data["@odata.count"];
            }, function (response) {
                $scope.loading.readings = false;
                console.error(response);
            });
    };
    
    $scope.save = function () {
        if ($scope.meter.Id == null) {
            $scope.saveNewMeter();
        } else {
            $scope.saveExistingMeter();
        }
    };

    $scope.saveExistingMeter = function () {
        $scope.working.save = true;
        var json = {
            SerialNumber: $scope.meter.SerialNumber,
            Hostname: $scope.meter.Hostname,
            PhoneNumber: $scope.meter.PhoneNumber,
            BaudRate: $scope.meter.BaudRate,
            IpAddress: $scope.meter.IpAddress,
            Port: $scope.meter.Port,
            Password: $scope.meter.Password
        };

        $http.patch($rootScope.baseUrl + "/odata/Meters(" + $scope.meter.Id + ")", JSON.stringify(json))
            .then(response => {
                $location.path("/meters");
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };

    $scope.saveNewMeter = function () {
        $scope.working.save = true;
        var json = {
            SerialNumber: $scope.meter.SerialNumber,
            Hostname: $scope.meter.Hostname,
            PhoneNumber: $scope.meter.PhoneNumber,
            BaudRate: $scope.meter.BaudRate,
            IpAddress: $scope.meter.IpAddress,
            Port: $scope.meter.Port,
            Password: $scope.meter.Password
        };

        $http.post($rootScope.baseUrl + "/odata/Meters", JSON.stringify(json))
            .then(response => {
                $location.path("/meters");
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };

    $scope.refreshConnection();
    $scope.refreshMeter();
    
    // Scroll to top
    $window.scrollTo(0, 0);
}]);
