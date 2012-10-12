var ddoc = {
  _id: '_design/app',
  language: 'javascript',
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
  map: function (doc) {
    //
    // https://docs.google.com/spreadsheet/ccc?key=0AgQNm5fx5y30dHJoVWlwQmllSWRLWUFZZ3VLemlRWlE
    // http://fr.wikipedia.org/wiki/Quantile
    //
    var percentiles = {
      mails: [0, 3, 6, 8, 11, 13, 16, 17, 20, 21, 23, 26, 27, 29, 31, 33, 35, 37, 39, 41, 43, 46, 47, 49, 52, 54, 56, 57, 60, 62, 64, 66, 68, 70, 72, 74, 77, 79, 82, 84, 87, 89, 92, 95, 97, 100, 104, 106, 109, 112, 115, 119, 122, 126, 130, 134, 137, 141, 145, 150, 154, 158, 163, 167, 172, 177, 183, 187, 193, 200, 206, 214, 221, 228, 236, 245, 255, 264, 273, 285, 299, 312, 324, 335, 348, 363, 385, 404, 428, 458, 487, 513, 552, 599, 650, 705, 785, 927, 1118, 1566, 6158],
      baskets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 9, 9, 9, 10, 10, 11, 11, 12, 13, 13, 14, 15, 16, 16, 17, 18, 20, 21, 22, 23, 24, 26, 28, 30, 32, 35, 39, 43, 49, 55, 62, 73, 89, 116, 184, 708],
      points: [260, 2149, 3690, 4865, 6154, 7180, 8094, 9100, 9914, 10910, 11814, 12740, 13622, 14461, 15250, 16150, 17018, 17870, 18769, 19789, 20594, 21670, 22676, 23575, 24520, 25427, 26281, 27640, 28757, 29913, 31000, 32128, 33108, 34173, 35284, 36361, 37768, 38795, 39796, 41198, 42231, 43358, 44846, 46161, 47288, 48640, 50233, 51660, 53312, 54515, 55977, 57379, 59017, 60598, 61966, 63633, 65257, 66866, 68607, 70595, 72380, 74462, 76588, 78559, 80445, 83002, 85481, 87879, 90518, 93253, 95899, 99235, 102415, 105822, 109831, 113215, 116316, 119491, 123363, 128894, 133440, 137101, 142490, 147607, 152418, 158820, 165428, 173506, 185433, 193903, 204021, 214273, 228899, 241686, 260280, 284117, 312154, 350427, 399568, 502214, 1480210]
    };

    //
    // http://stackoverflow.com/questions/12829765/indexes-around-a-range-of-values/12830022
    //
    function indexesAround(target, arr) {
      var start = -1;

      var el;
      for (var i = 0, len = arr.length; i < len; i++) {
        el = arr[i];
        if (el === target && start === -1) {
          start = i;
        } else if (el > target) {
            if (i === 0) {
              return [0, 0]; // Target lower than array range
            }
            if (start === -1) {
              return [i-1, i]; // Target inside array range but not found
            } else {
              return [start, i-1]; // Target found
            }
        }
      }

      if (start === -1) {
        return [len-1, len-1]; // Target higher than array range
      } else {
        return [start, len-1]; // Target found and extends until end of array
      }  
    }

    function percentile(type, val) {
      var indexes = indexesAround(val, percentiles[type]);
      return (indexes[0] + indexes[1])/2;
    }

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
      str = ''+str;
      return parseInt(str.replace(/\s/g, ''), 10);
    }

    var mailsScore = 100 - percentile('mails', str2int(doc.mail));
    var basketsScore = 100 - percentile('baskets', str2int(doc.basket));
    var mailsAndBasketsScore = (1*mailsScore + 8*basketsScore)/(1+8);
    
    var activeScore = 100*Math.max(60 - Math.floor(ms2day(new Date().getTime() - (doc.updatedAt || 0))), 0)/60;

    var pointsScore = percentile('points', str2int(doc.points));

    var globalScore = (3*(mailsScore+basketsScore)/2+activeScore)/(4);

    emit([-globalScore], doc);
  }
};

//
// Stats
//

ddoc.views.sample = {
  map: function(doc) {
    //
    // Convert a string (with space separators) to an integer
    //
    // Ex: "2 765" -> 2765
    //
    function str2int(str) {
      str = ''+str;
      return parseInt(str.replace(/\s/g, ''), 10);
    }
    
    emit(null, [str2int(doc.mail), str2int(doc.basket), str2int(doc.points)]);
  }
};

ddoc.views.toBeConsolidated = {
  map: function (doc) {
    //  Priority:
    //   1. those who haven't consolidated datas (ex: doc.visit)
    //   2. those there was a long time we haven't consolidate them
    //
    emit([(doc.visit ? 1 : 0), (doc.updatedAt || 0)], doc);
  }
}