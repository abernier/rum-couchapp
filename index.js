#!/usr/bin/env node
var argv = require('optimist')
      .usage('Couch your app.\nUsage: $0 -c https://john:XXXXXX@iriscouch.com:6984/my-database')
      
      .demand('c')
      .alias('c', 'couch')
      .describe('c', 'where to couch your app')

      .argv
    ;

var couchapp = require('couchapp');

var ddoc = require('./ddoc');
var path = require('path');
couchapp.loadAttachments(ddoc, path.join(__dirname, './node_modules/rum-webapp'));

couchapp.createApp(ddoc, argv.couch, function (app) {
  app.push();
});