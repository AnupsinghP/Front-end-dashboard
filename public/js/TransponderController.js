
app.controller('TransponderController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', '$window', function ($http, $location, $rootScope, $routeParams, $scope, $window) {
    $scope.loading = { connections: true };
    $scope.working = { save: false };

    $scope.delete = function () {
        $scope.working.save = true;
        $http.delete($rootScope.baseUrl + "/odata/Transponders(" + $scope.transponder.Id + ")")
            .then(response => {
                $location.path("/buildings/" + $scope.building.Id);
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
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

    $scope.refreshTransponder = function () {
        if ($routeParams.id == null)
        {
            $scope.breadcrumb = 'New';
            $scope.transponder = { ConnectionId: parseInt($routeParams.connection_id) };
            return;
        }
        else
        {
            $scope.breadcrumb = 'View';
            $http.get($rootScope.baseUrl + '/odata/Transponders(' + $routeParams.id + ')')
                .then(function (response) {
                    $scope.transponder = response.data;
                }, function (response) {
                    console.error(response);
                });
        }
    };

    $scope.save = function () {
        if ($scope.transponder.Id == null) {
            $scope.saveNewTransponder();
        } else {
            $scope.saveExistingTransponder();
        }
    };

    $scope.saveExistingTransponder = function () {
        $scope.working.save = true;
        var json = {
            ConnectionId: $scope.transponder.ConnectionId,
            DaysToLog: $scope.transponder.DaysToLog,
            Memory: $scope.transponder.Memory,
            Password: $scope.transponder.Password,
            SerialNumber: $scope.transponder.SerialNumber,
            Slots: $scope.transponder.Slots,
            Volts: $scope.transponder.Volts
        };

        $http.patch($rootScope.baseUrl + "/odata/Transponders(" + $scope.building.Id + ")", JSON.stringify(json))
            .then(response => {
                $location.path("/buildings" + $scope.building.Id);
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };

    $scope.saveNewTransponder = function () {
        $scope.working.save = true;
        var json = {
            ConnectionId: $scope.transponder.ConnectionId,
            DaysToLog: $scope.transponder.DaysToLog,
            Memory: $scope.transponder.Memory,
            Password: $scope.transponder.Password,
            SerialNumber: $scope.transponder.SerialNumber,
            Slots: $scope.transponder.Slots,
            Volts: $scope.transponder.Volts
        };

        $http.post($rootScope.baseUrl + "/odata/Transponders", JSON.stringify(json))
            .then(response => {
                $location.path("/buildings/" + $scope.building.Id);
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };
    
    $scope.refreshConnection();
    $scope.refreshTransponder();

    // Scroll to top
    $window.scrollTo(0, 0);
}]);