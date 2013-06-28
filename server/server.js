/* global console, process */

var restify = require('restify');

// in-memory db
var foods = {
    1: {
      name: 'Pizza',
      imageUrl: 'img/pizza.png',
      cents: 1500
    },
    2: {
      name: 'Pancakes',
      imageUrl: 'img/pancakes.png',
      cents: 300
    },
    3: {
      name: 'Fries',
      imageUrl: 'img/fries.png',
      cents: 700
    },
    4: {
      name: 'Hot Dog',
      imageUrl: 'img/hotdog.png',
      cents: 950
    },
    5: {
      id: 5,
      name: 'Birthday Cake',
      imageUrl: 'img/birthdaycake.png',
      cents: 2000
    }
  };

// note: assumes each table has a tab (a real app would need to close/create new tabs)
var tables = {
  1: {
    tab: { id: 1, tabItems: [] }
  },
  2: {
    tab: { id: 2, tabItems: [] }
  },
  3: {
    tab: { id: 3, tabItems: [] }
  },
  4: {
    tab: { id: 4, tabItems: [] }
  },
  5: {
    tab: { id: 5, tabItems: [{id:1, food_id:3, name: "Fries", cents: 700}, {id:2, food_id:1, name: "Pizza", cents: 1500}] }
  },
  6: {
    tab: { id: 6, tabItems: [] }
  }
};

// increment to give each tabItem a unique id
var tabId = 100;

var Food = {};
Food.index = function(req,res,next) { 
  // stick id into food items
  var foodObjects = Object.keys(foods).map(function(k){
    var obj = foods[k];
    obj.id = k;
    return obj;
  });
  res.send(foodObjects);
  return next();
};

// Food.find = function(req,res,next) { res.send(foods[req.params.id]); return next(); };

var Table = {};

Table.index = function(req,res,next) { res.send(Object.keys(tables)); return next(); };

Table.find = function(req,res,next) { 
  var id = req.params.table_id;
  tables[id].id = id;
  res.send(tables[id]);
  return next();
};

Table.addFoodItem = function(req,res,next) {
  var table_id = req.params.table_id;
  var table = tables[table_id];
  var food_id = req.params.food_id;
  var food = foods[food_id];

  if (table === undefined) {
    return next(new restify.InvalidArgumentError('table_id invalid/missing'));
  }
  if (food === undefined) {
    return next(new restify.InvalidArgumentError('food_id invalid/missing'));
  }

  var newId = tabId++;
  var tabItem = {id:newId, food_id: food_id, name: food.name, cents: food.cents};
  var tabItems = table.tab.tabItems;
  tabItems.push(tabItem);
  res.send(201, tabItem); // 201: Created
  return next();
};

Table.removeFoodItem = function(req,res,next) {
  var table_id = req.params.table_id;
  var tab_item_id = req.params.tab_item_id;
  var tabItems = tables[table_id].tab.tabItems;
 
  var index = 0;
  var found = -1;
  for (var i=0; i<tabItems.length; i++) {
    if (tabItems[i].id == tab_item_id) {
      found = i;
      break;
    }
  }

  if (found > -1) { 
    tabItems.splice(found,1);
    res.send(204); // 204: No Content
  } else {
    res.send(404);
  }
  return next();
};

var server = restify.createServer();

// process POST/PUT
server.use(restify.bodyParser({ mapParams: true }));

// basic logging - no errors, status codes, remoteAddress
server.use(
  function log(req,res,next) {
    console.log(req.method + " " + req.url);
    return next();
  }
);

server.use(
  function crossOrigin(req,res,next) {
    // allow access for pages served on a different port
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);

// instead of access control headers, we can also serve up static content
// server.get('/angular-ordr/.*', restify.serveStatic({
//   directory: '/home/dev/'
// }));

server.get('/foods', Food.index);
server.get('/tables', Table.index);
server.get('/tables/:table_id', Table.find);
server.post('/tables/:table_id/foods/:food_id', Table.addFoodItem); // note: 

// note: table_id isn't required, but just makes finding the id a bit easier
server.del('/tables/:table_id/tabitem/:tab_item_id', Table.removeFoodItem);

server.listen(3001, function() {
  console.log('%s listening at %s', server.name, server.url);
});

// simple REPL to view data structures
var repl = require('repl');
var local = repl.start({
  prompt: "$ ",
  input: process.stdin,
  output: process.stdout
});
local.context.tables = tables;
local.context.foods = foods;
