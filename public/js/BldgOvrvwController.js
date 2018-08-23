app.controller('BldgOvrvwController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', '$window', function ($http, $location, $rootScope, $routeParams, $scope, $window) {

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
                }, function (response) {
                    console.error(response);
                });
        }
    };

    $scope.refreshBuilding();

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
	var pieData = [
            {
                value: 20,
                color:"red",
                label:'Not connected'
            },
            {
                value : 80,
                color : "#40bf40",
                label: "Connecte"
            }
        ];
        // Get the context of the canvas element we want to select
        var countries= document.getElementById("countries").getContext("2d");
        new Chart(countries).Pie(pieData);         
}]);
