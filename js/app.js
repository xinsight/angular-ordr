/* global angular */

var app = angular.module('ordr', ['ngResource']);

app.config(['$routeProvider', function($routeProvider){
  $routeProvider.when('/tables', {
    templateUrl: 'partials/tables.html', 
    controller: 'TablesCtrl'
  }).
  when('/tables/:table_id', {
    templateUrl: 'partials/table.html', 
    controller: 'TableCtrl'
  }).
  otherwise({redirectTo: '/tables'});
}]);

app.filter('money', function(){
  return function(value) {
    if (isNaN(value)) { return "$0.00"; }
    return '$' + (value % 100 === 0 ?
                 (value / 100 + ".00") : 
                 (parseInt(value/100, 10) + '.' + value % 100));
  };
});

app.controller("TablesCtrl", function ($scope, OrderService) {

  $scope.tables = OrderService.tables(function(error) {
    $scope.error = error;
  });
  
});

// note: have to use $rootScope, since both TableCtrl and TabCtrl assign to .table
// to update list after add/remove

app.controller("TableCtrl",  function ($scope, $rootScope, $routeParams, OrderService) {

  var table_id = $scope.table_id = $routeParams.table_id;
  
  function getTableDetails(id) {
    $rootScope.table = OrderService.table(id);
  }

  getTableDetails(table_id);

  // note: nice for REST to return the full object that was added, so we can just push it onto the
  // array and not have to refresh the whole thing
  $scope.addFood = function(table_id,food_id) {
    OrderService.addFood(table_id,food_id, function(newItem) {
      // YUCK: update the whole array.
      // getTableDetails(table_id);
      // BETTER: just add the new object
      $rootScope.table.then(function(table) {
        table.tab.tabItems.push(newItem);
      });
    });
  };
  
});

app.controller("FoodCtrl", function ($scope, OrderService) {
  
  OrderService.foods(function(data) {
    $scope.foods = data;
  });
  
});

app.controller("TabCtrl", function($scope, $rootScope, $routeParams, OrderService) {
  
  var table_id = $routeParams.table_id;
  
  $scope.totalCents = function(items) {
    var total = 0;
    angular.forEach(items, function(tabItem) { 
      total += tabItem.cents; 
    });
    return total;
  };
    
  $scope.removeFood = function(tab_item_id) {
    OrderService.removeFood(table_id, tab_item_id, function() {      
      // !!!: full reload
      // $rootScope.table = OrderService.table(table_id);
      // note: more efficient to just splice out the deleted item
      $rootScope.table.then(function(table) {
        var index = -1;
        for (var i=0; i<table.tab.tabItems.length; i++) {
          if (table.tab.tabItems[i].id == tab_item_id) {
            index = i; break;
          }
        }
        if (index > -1) {
          table.tab.tabItems.splice(index,1);
        }
      }); 
      
    });
  };
  
});


// note: $resource hid useful details, so going with plain old $http
app.factory("OrderService", function($http) {
  
  var url = "http://localhost:3001/";
  
  var Service = {};

  Service.foods = function(success) {
    $http.get(url+"foods", {cache:true}).then(function(response) {
      success(response.data);
    });
  };
  
  // note: need an error callback to update the UI
  Service.tables = function(error) {
    return $http.get(url+"tables", {cache:true}).then(function(result) {
      return result.data; 
    }, function(result) { // error
      // TODO: create a more generic error system
      error("Unable to connect to " + result.config.url + " [" + result.status + "]");
    });
  };

  // promise //
  Service.table = function(table_id) {
    return $http.get(url+"tables/"+table_id).then(function(response) {
      return response.data;
    });
  };
  
  Service.addFood = function(table_id,food_id,success) {
    
    $http.post(url+"tables/"+table_id+"/foods/"+food_id)
      .then(function(res) {
        success(res.data);
      });
    
  };
  
  // TODO: replace callback with promise (caller can use then() to trigger the view update
  Service.removeFood = function(table_id, tab_item_id, callback) {

    // note: $httpd.delete causes a warning
    $http['delete'](url+"tables/"+table_id+"/tabitem/"+tab_item_id).then(function(res) {
      callback();
    });
    
  };
  
  return Service;
});
