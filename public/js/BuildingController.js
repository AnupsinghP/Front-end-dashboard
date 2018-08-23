
app.controller('BuildingController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', '$window', function ($http, $location, $rootScope, $routeParams, $scope, $window) {
    $scope.loading = { connections: true, meters: true, queries: true, transponders: true };
    $scope.connections = [];
    $scope.connectionsPageStart = 0;
    $scope.meters = [];
    $scope.metersPageStart = 0;
    $scope.selected = {};
    $scope.queries = [];
    $scope.queriesPageStart = 0;
    $scope.transponders = [];
    $scope.transpondersPageStart = 0;
    $scope.working = { save: false };
    
    $scope.connectionsEnd = function () {
        return $scope.connectionsPageStart + 20 < $scope.connectionsCount ? $scope.connectionsPageStart + 20 : $scope.connectionsCount;
    };

    $scope.connectionsNext = function () {
        $scope.connectionsPageStart = $scope.connectionsPageStart + 20;
        $scope.refreshConnections();
    };
    
    $scope.connectionsPrevious = function () {
        $scope.connectionsPageStart = $scope.connectionsPageStart - 20;
        $scope.refreshConnections();
    };

    $scope.connectionsStart = function () {
        return $scope.connectionsPageStart + 1;
    };

    $scope.delete = function () {
        $scope.working.save = true;
        $http.delete($rootScope.baseUrl + "/odata/Buildings(" + $scope.building.Id + ")")
            .then(response => {
                $location.path("/buildings");
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };

    $scope.metersEnd = function () {
        return $scope.metersPageStart + 20 < $scope.metersCount ? $scope.metersPageStart + 20 : $scope.metersCount;
    };

    $scope.metersNext = function () {
        $scope.metersPageStart = $scope.metersPageStart + 20;
        $scope.refreshMeters();
    };
    
    $scope.metersPrevious = function () {
        $scope.metersPageStart = $scope.metersPageStart - 20;
        $scope.refreshMeters();
    };

    $scope.metersStart = function () {
        return $scope.metersPageStart + 1;
    };

    $scope.connectionsEnd = function () {
        return $scope.connectionsPageStart + 20 < $scope.connectionsCount ? $scope.connectionsPageStart + 20 : $scope.connectionsCount;
    };

    $scope.queriesNext = function () {
        $scope.queriesPageStart = $scope.queriesPageStart + 20;
        $scope.refreshQueries();
    };
    
    $scope.queriesPrevious = function () {
        $scope.queriesPageStart = $scope.queriesPageStart - 20;
        $scope.refreshQueries();
    };

    $scope.queriesStart = function () {
        return $scope.queriesPageStart + 1;
    };

    $scope.refreshBuilding = function () {
        if ($routeParams.id == null)
        {
            $scope.breadcrumb = 'New';
            $scope.building = {};
            return;
        }
        else
        {
            $scope.breadcrumb = 'View';
            $http.get($rootScope.baseUrl + '/odata/Buildings(' + $routeParams.id + ')')
                .then(function (response) {
                    $scope.building = response.data;
                    $scope.refreshConnections();
                    $scope.refreshMeters();
                    $scope.refreshTransponders();
                    $scope.refreshQueries();
                }, function (response) {
                    console.error(response);
                });
        }
    };

    $scope.refreshConnections = function () {
        $scope.connections = [];
        $scope.loading.connections = true;
        $http.get($rootScope.baseUrl + '/odata/Connections?$count=true&$orderby=Method&$filter=BuildingId eq ' + $scope.building.Id + '&$top=20&$skip=' + $scope.connectionsPageStart)
            .then(function (response) {
                $scope.loading.connections = false;
                $scope.connections = response.data.value;
                $scope.connectionsCount = response.data["@odata.count"];
                $scope.selected['Connection'] = $scope.connections[0];
            }, function (response) {
                $scope.loading.connections = false;
                console.error(response);
            });
    };

    $scope.refreshMeters = function () {
        $scope.meters = [];
        $scope.loading.meters = true;
        $http.get($rootScope.baseUrl + '/odata/Meters?$count=true&$orderby=SerialNumber&$expand=Connection,Transponder&$filter=Connection/BuildingId eq ' + $scope.building.Id + '&$top=20&$skip=' + $scope.metersPageStart)
            .then(function (response) {
                $scope.loading.meters = false;
                $scope.meters = response.data.value;
                $scope.metersCount = response.data["@odata.count"];
            }, function (response) {
                $scope.loading.meters = false;
                console.error(response);
            });
    };
    
    $scope.refreshQueries = function () {
        $scope.queries = [];
        $scope.loading.queries = true;
        $http.get($rootScope.baseUrl + '/odata/Queries?$count=true&$orderby=CreatedAt desc&$expand=Connection&$filter=Connection/BuildingId eq ' + $scope.building.Id + '&$top=20&$skip=' + $scope.queriesPageStart)
            .then(function (response) {
                $scope.loading.queries = false;
                $scope.queries = response.data.value;
                $scope.queriesCount = response.data["@odata.count"];
            }, function (response) {
                $scope.loading.queries = false;
                console.error(response);
            });
    };

    $scope.refreshTransponders = function () {
        $scope.transponders = [];
        $scope.loading.transponders = true;
        $http.get($rootScope.baseUrl + '/odata/Transponders?$count=true&$orderby=SerialNumber&$expand=Connection&$filter=Connection/BuildingId eq ' + $scope.building.Id + '&$top=20&$skip=' + $scope.transpondersPageStart)
            .then(function (response) {
                $scope.loading.transponders = false;
                $scope.transponders = response.data.value;
                $scope.transpondersCount = response.data["@odata.count"];
            }, function (response) {
                $scope.loading.transponders = false;
                console.error(response);
            });
    };
    
    $scope.save = function () {
        if ($scope.building.Id == null) {
            $scope.saveNewBuilding();
        } else {
            $scope.saveExistingBuilding();
        }
    };

    $scope.saveExistingBuilding = function () {
        $scope.working.save = true;
        var json = {
            Address: $scope.building.Address,
            City: $scope.building.City,
            State: $scope.building.State,
            PostalCode: $scope.building.PostalCode
        };

        $http.patch($rootScope.baseUrl + "/odata/Buildings(" + $scope.building.Id + ")", JSON.stringify(json))
            .then(response => {
                $location.path("/buildings");
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };

    $scope.saveNewBuilding = function () {
        $scope.working.save = true;
        var json = {
            Address: $scope.building.Address,
            City: $scope.building.City,
            State: $scope.building.State,
            PostalCode: $scope.building.PostalCode
        };

        $http.post($rootScope.baseUrl + "/odata/Buildings", JSON.stringify(json))
            .then(response => {
                $location.path("/buildings/" + response.data.Id);
            }, error => {
                $scope.working.save = false;
                console.error(error);
            });
    };
    
    $scope.transpondersEnd = function () {
        return $scope.transpondersPageStart + 20 < $scope.transpondersCount ? $scope.transpondersPageStart + 20 : $scope.transpondersCount;
    };

    $scope.transpondersNext = function () {
        $scope.transpondersPageStart = $scope.transpondersPageStart + 20;
        $scope.refreshTransponders();
    };
    
    $scope.transpondersPrevious = function () {
        $scope.transpondersPageStart = $scope.transpondersPageStart - 20;
        $scope.refreshTransponders();
    };

    $scope.transpondersStart = function () {
        return $scope.transpondersPageStart + 1;
    };

    $scope.refreshBuilding();
    
    // Scroll to top
    $window.scrollTo(0, 0);
}]);
