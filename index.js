var ddoc = {
  _id: '_design/app',
  views: {},
  lists: {},
  shows: {}/*,
  rewrites : [
    {from:"/", to:'index.html'},
    {from:"/*", to:'*'},
    {from:"/api", to:'../../'},
    {from:"/api/*", to:'../../*'}
  ]*/
};

module.exports = ddoc;

ddoc.views.freshActiveAndSexy = {
  map: function(doc) {
    //
    // Convert miliseconds to day
    //
    function ms2day(ms) {
      return ms / (1000*3600*24);
    }

    //
    // Convert a string (with space separators) to an integer
    //
    // Ex: "2 765" -> 2765
    //
    function str2int(str) {
      return parseInt(str.replace(/\s/g, ''), 10);
    }

    function approx(x, n) {
      n || (n = 1);
      
      return Math.round(x/n);
    }

    //
    // 
    //
    var mailsAndBaskets = str2int(doc.mail) + 2*str2int(doc.basket);

    //
    // Epoch in days
    //
    var updatedAtInDays = Math.floor(ms2day(doc.updatedAt || 0));
    
    //
    // 
    //
    var points = str2int(doc.points);

    // ORDER BY:
    //
    //  1- "fresh"
    //  2- "Active"
    //  3- "Popular"
    //

    var fresh = mailsAndBaskets;
    var active = -updatedAtInDays;
    var popular = -points;

    emit([fresh, active, popular], doc);
  }
};

//
// Stats
//

ddoc.views.mailsPerGirls = {
  map: function(doc) {
    //
    // Convert a string (with space separators) to an integer
    //
    // Ex: "2 765" -> 2765
    //
    function str2int(str) {
      return parseInt(str.replace(/\s/g, ''), 10);
    }
    
    emit(str2int(doc.mail), 1);
  },
  reduce: function(keys, values, rereduce) {
    return sum(values);
  }
};

ddoc.views.basketsPerGirls = {
  map: function(doc) {
    //
    // Convert a string (with space separators) to an integer
    //
    // Ex: "2 765" -> 2765
    //
    function str2int(str) {
      return parseInt(str.replace(/\s/g, ''), 10);
    }
    
    emit(str2int(doc.basket), 1);
  },
  reduce: function(keys, values, rereduce) {
    return sum(values);
  }
};

ddoc.views.tenkpointsPerGirls = {
  map: function(doc) {
    //
    // Convert a string (with space separators) to an integer
    //
    // Ex: "2 765" -> 2765
    //
    function str2int(str) {
      return parseInt(str.replace(/\s/g, ''), 10);
    }
    
    emit(-Math.round(str2int(doc.points)/10000), 1);
  },
  reduce: function(keys, values, rereduce) {
    return sum(values);
  }
};

/*ddoc.lists.mailsPerGirls = function (head, req) {
  start({
    "headers": {
      "Content-Type": "text/csv"
     }
  });

  while(row = getRow()) {
   send(row.key + ',' + row.value + '\n');
  }
};*/

var couchapp = require('couchapp');
var path = require('path');

couchapp.loadAttachments(ddoc, path.join(__dirname, 'node_modules/rum-webapp'));