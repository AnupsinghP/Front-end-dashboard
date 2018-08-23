
app.controller('ConnectionController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', '$window', function ($http, $location, $rootScope, $routeParams, $scope, $window) {
    $scope.working = { save: false };

    $scope.delete = function () {
        $scope.working.save = true;
        $http.delete($rootScope.baseUrl + "/odata/Connections(" + $scope.connection.Id + ")")
            .then(response => {
                $location.path("/buildings/" + $scope.building.Id);
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };

    $scope.refreshBuilding = function () {
        $http.get($rootScope.baseUrl + '/odata/Buildings(' + $routeParams.building_id + ')')
            .then(function (response) {
                $scope.building = response.data;
            }, function (response) {
                console.error(response);
            });
    };

    $scope.refreshConnection = function () {
        if ($routeParams.connection_id == null)
        {
            $scope.breadcrumb = 'New';
            $scope.connection = {
                Method: 'Modem',
                IsEnabled: true,
                ModemBaudRate: "9600",
                ModemDataBits: "8",
                ModemParity: "None",
                ModemStopBit: "1"
            };
            return;
        }
        else
        {
            $scope.breadcrumb = 'View';
            $http.get($rootScope.baseUrl + '/odata/Connections(' + $routeParams.connection_id + ')')
                .then(function (response) {
                    $scope.connection = response.data;
                }, function (response) {
                    console.error(response);
                });
        }
    };

    $scope.save = function () {
        if ($scope.connection.Id == null) {
            $scope.saveNewConnection();
        } else {
            $scope.saveExistingConnection();
        }
    };

    $scope.saveExistingConnection = function () {
        $scope.working.save = true;
        var json = {
            Method: $scope.connection.Method,
            IpAddress: $scope.connection.IpAddress,
            IpPort: $scope.connection.IpPort,
            IsCellModem: $scope.connection.IsCellModem,
            IsEnabled: $scope.connection.IsEnabled,
            ModemNumber: $scope.connection.ModemNumber,
            ModemBaudRate: $scope.connection.ModemBaudRate,
            ModemDataBits: $scope.connection.ModemDataBits,
            ModemParity: $scope.connection.ModemParity,
            ModemStopBit: $scope.connection.ModemStopBit
        };

        $http.patch($rootScope.baseUrl + "/odata/Connections(" + $scope.connection.Id + ")", JSON.stringify(json))
            .then(response => {
                $location.path("/buildings/" + $routeParams.building_id);
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };

    $scope.saveNewConnection = function () {
        $scope.working.save = true;
        var json = {
            Method: $scope.connection.Method,
            BuildingId: $routeParams.building_id,
            IpAddress: $scope.connection.IpAddress,
            IpPort: $scope.connection.IpPort,
            IsCellModem: $scope.connection.IsCellModem,
            IsEnabled: $scope.connection.IsEnabled,
            ModemNumber: $scope.connection.ModemNumber,
            ModemBaudRate: $scope.connection.ModemBaudRate,
            ModemDataBits: $scope.connection.ModemDataBits,
            ModemParity: $scope.connection.ModemParity,
            ModemStopBit: $scope.connection.ModemStopBit
        };

        $http.post($rootScope.baseUrl + "/odata/Connections", JSON.stringify(json))
            .then(response => {
                $location.path("/buildings/" + $routeParams.building_id);
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };

    $scope.refreshBuilding();
    $scope.refreshConnection();
    
    // Scroll to top
    $window.scrollTo(0, 0);
}]);
