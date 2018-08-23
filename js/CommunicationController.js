app.controller('CommunicationController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', '$window', function ($http, $location, $rootScope, $routeParams, $scope, $window) 
{
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


     $http.get($rootScope.baseUrl + '/odata/Buildings?$count=true&$orderby=State,City,Address&$top=20&$skip=' + $scope.buildingsPageStart)
        .then(function (response) {
            $scope.buildings = response.data.value;
            $scope.buildingsCount = response.data["@odata.count"];
        }, 
        function (response) {
            $scope.loading.buildings = false;
                console.error(response);
    });

    $scope.refreshBuildings = function () {
        $scope.buildings = [];
        $scope.loading.buildings = true;
        $http.get($rootScope.baseUrl + '/odata/Buildings?$count=true&$orderby=State,City,Address&$top=20&$skip=' + $scope.buildingsPageStart)
            .then(function (response) {
                $scope.loading.buildings = false;
                $scope.buildings = response.data.value;
                $scope.buildingsCount = response.data["@odata.count"];
            }, function (response) {
                $scope.loading.buildings = false;
                console.error(response);
            });
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
    
    var len = $scope.building.length;
				if(len > 0)
				{
					for (var bldg = 0; bldg < $scope.buildings.length; bldg++) 
					{ 
 		   				var building = $scope.buildings[bldg];
 		   				  $http.get($rootScope.baseUrl + '/odata/Connections?$count=true&$orderby=Method&$filter=BuildingId eq ' + building.Id + '&$top=20&$skip=' + $scope.buildingsPageStart)
 		   				  .then(function (response1) {
                				$scope.loading.connections = false;
                				$scope.connections = response1.data.value;
                				$scope.connectionsCount = response1.data["@odata.count"];
               	 				$scope.selected['Connection'] = $scope.connections[0];
           					 }, function (response1) {
               						 $scope.loading.connections = false;
                					console.error(response1);
            				});
					}
				}

}]);