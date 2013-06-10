/* globals angular */
var app = angular.module('ordr', []);

app.config(['$routeProvider', function($routeProvider){
  $routeProvider.when('/tables', {
    templateUrl: 'partials/tables.html', 
    controller: 'TablesCtrl'
  }).
  when('/tables/:tableId', {
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
  $scope.tables = OrderService.tables;
  $scope.tablePage = "partials/table.html";
});

app.controller("TableCtrl",  function ($scope, $routeParams, OrderService) {
  var table_id = $scope.id = $routeParams.tableId;
  
  $scope.table = OrderService.table(table_id);
  
  $scope.tab = OrderService.tab(table_id);

  $scope.addFood = function(table_id,food) {
    OrderService.addFood(table_id,food);
  };
  
});

app.controller("FoodCtrl", function($scope, OrderService) {
  $scope.foods = OrderService.foods;
});

app.controller("TabCtrl", function($scope, $routeParams, OrderService) {
  
  var table_id = $scope.id = $routeParams.tableId;
  
  $scope.tabItems = function() {
    return OrderService.tabItemsForTable(table_id);
  };
  
  $scope.totalCents = function(items) {    
    var total = 0;
    angular.forEach(items, function(tabItem) { 
      total += tabItem.cents; 
    });
    return total;
  };
});

app.factory("OrderService", function(){
  // private
  var tables = [
    {
      id: 1,
      tab: 1
    }, {
      id: 2,
      tab: 2
    }, {
      id: 3,
      tab: 3
    }, {
      id: 4,
      tab: 4
    }, {
      id: 5,
      tab: 5
    }, {
      id: 6,
      tab: 6
  }];

  var tabs = [
    {
      id: 1,
      tabItems: []
    }, {
      id: 2,
      tabItems: []
    }, {
      id: 3,
      tabItems: []
    }, {
      id: 4,
      tabItems: [400, 401, 402, 403, 404]
    }, {
      id: 5,
      tabItems: []
    }, {
      id: 6,
      tabItems: []
    }
  ];

  var tabItems = [
    {
      id: 400,
      cents: 1500,
      food: 1
    }, {
      id: 401,
      cents: 300,
      food: 2
    }, {
      id: 402,
      cents: 700,
      food: 3
    }, {
      id: 403,
      cents: 950,
      food: 4
    }, {
      id: 404,
      cents: 2000,
      food: 5
    }
  ];

  var foods = [
    {
      id: 1,
      name: 'Pizza',
      imageUrl: 'img/pizza.png',
      cents: 1500
    }, {
      id: 2,
      name: 'Pancakes',
      imageUrl: 'img/pancakes.png',
      cents: 300
    }, {
      id: 3,
      name: 'Fries',
      imageUrl: 'img/fries.png',
      cents: 700
    }, {
      id: 4,
      name: 'Hot Dog',
      imageUrl: 'img/hotdog.png',
      cents: 950
    }, {
      id: 5,
      name: 'Birthday Cake',
      imageUrl: 'img/birthdaycake.png',
      cents: 2000
    }
  ];
  
  // public
  var Service = {};
  Service.foods = foods;
  Service.tables = tables;
  
  Service.table = function(table_id) {
    return _.find(tables, function(e) { return e.id == table_id; }); // note: "2" == 2
  };
  
  Service.tab = function(table_id) {
    return _.find(tabs, function(e) { return e.id == table_id; });
  };
  
  Service.foodItem = function(food_id) {
    return _.find(foods, function(e){
      return food_id === e.id;
    });
  };

  Service.addFood = function(table_id,food) {
    // create a TabItem *AND* push the id onto the table's tabItems
    var tabItemId = 500 + tabItems.length; // hack: unique id
    tabItems.push({
      food: food.id,
      cents: food.cents,
      id: tabItemId
    });
    Service.tab(table_id).tabItems.push(tabItemId);
  };
    
  Service.tabItemsForTable = function(table_id) {
    
    var tab = Service.tab(table_id);
    
    var items = [];
    angular.forEach(tab.tabItems, function(tabItemId) {
      var tabItem = _.find(tabItems, function(e){
        return tabItemId === e.id;
      });
      
      // add food object
      tabItem.foodItem = Service.foodItem(tabItem.food);
      
      items.push(tabItem);
    });
    return items;
  };

  return Service;
});