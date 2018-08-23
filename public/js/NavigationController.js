app.controller('NavigationController', ['$http', '$location', '$rootScope', '$routeParams', '$scope', function ($http, $location, $rootScope, $routeParams, $scope) 
{

	var x =  document.getElementById('sampleDiv')
	x.style.display = "none";

	var sernoDiv = document.getElementById('sernoSearch')
	sernoDiv.hidden = true;
	
	document.getElementById("siteBtn").classList.add('active');
	

	//$('#siteSearch').css('z-index', 1);
    //$('#sernoSearch').css('z-index', 0);

	$scope.ShowSernoSeach = function()
	{
		document.getElementById("siteBtn").classList.remove('active');
		document.getElementById("sernoBtn").classList.add('active');
		var searchoDiv = document.getElementById('siteSeach')
		searchoDiv.hidden = true;
		
		var sernoDiv = document.getElementById('sernoSearch')
		sernoDiv.hidden = false;
	};

	$scope.ShowSiteSeach = function()
	{
		document.getElementById("siteBtn").classList.add('active');
		document.getElementById("sernoBtn").classList.remove('active');
		var searchoDiv = document.getElementById('siteSeach')
		searchoDiv.hidden = false;
		
		var sernoDiv = document.getElementById('sernoSearch')
		sernoDiv.hidden = true;
	};
	

	$http.get($rootScope.baseUrl + '/odata/Buildings?$select=Address,Id')
	.then(function (response)
	{
		$scope.items = response.data.value;
		if ($scope.items.length<1) {
			console.error('NO value');
		}
    }, function(response)
    {
    	console.error(response);            
	});

	$scope.textChanged = function ()
	{
		var result = [];

		if ($scope.searchString.length<1) {
			console.error('NO value');
		}
		else
		{
			$http.get($rootScope.baseUrl + "/odata/Buildings?$filter=contains(Address,'"+$scope.searchString+"')&$select=Address,Id")
			.then(function (response)
			{	
				$scope.items = response.data.value;
				if ($scope.items.length<1) {
				console.error('NO value');
			}
    		}, function(response)
    		{
    			console.error(response);            
			});
		}

		return result;
	};

	function NavigateToDevice(choice)
	{
		switch(choice)
		{
			case "Building":   
						ShowBuilding();
						break;

			case "Meter":   
						ShowMeter();
						break;

			case "Transponder":   
						ShowTransponder();
						break;

			case "Connection":   
						ShowConnection();
						break;			

			case "Bridge":   
						ShowBridge();
						break;			

		}
	};

	function ShowMeter()
	{
		$http.get($rootScope.baseUrl + "/odata/Meters?$select=Id,ConnectionId&$filter=SerialNumber eq '"+$scope.serno+"'")
			.then(function (response)
			{	
				var meter = response.data.value[0];
				var meterConnectionId = meter.ConnectionId;
				var meterId = meter.Id;

				//$location.path('/connections/'+meterConnectionId+'/meters/'+meterId);
				$location.path('/meterOverview/'+meterId);
    		}, function(response)
    		{
    			console.error(response);            
			});
	}

	function ShowBuilding()
	{
		$http.get($rootScope.baseUrl + "/odata/Buildings?$filter=Id eq "+$scope.serno)
			.then(function (response)
			{	
				var buildingId = response.data.value[0].Id;
				$location.path('/bldgovrvw/'+buildingId);
    		}, function(response)
    		{
    			console.error(response);            
			});
	}	

	$scope.SearchSerno = function()
	{
		var dropdwn = document.getElementById("dropdownChoices");
		var selectedItem = dropdwn.options[dropdwn.selectedIndex].value;
		NavigateToDevice(selectedItem);
	};
	
}]).filter('searchFor', function()
{
	// All filters must return a function. The first parameter
	// is the data that is to be filtered, and the second is an
	// argument that may be passed with a colon (searchFor:searchString)
+9333333+93+93

	return function(arr, searchString){

		if(!searchString){
			return arr;
		}

		var result = [];

		if(searchString.length > 0)
		{
			var x =  document.getElementById('sampleDiv')
			x.style.display = "block";
		}
		else if(searchString.length == 0)
		{
			var x =  document.getElementById('sampleDiv')
			x.style.display = "none";
		}

		searchString = searchString.toLowerCase();

		// Using the forEach helper method to loop through the array
		angular.forEach(arr, function(item){

			if(item.Address.toLowerCase().indexOf(searchString) !== -1){
				result.push(item);
			}

		});

		return result;
	};

});