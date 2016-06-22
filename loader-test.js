var System = require('es6-module-loader').System;
var Loader = require('es6-module-loader').Loader;

System.fetch = function (load) {
  return '42';
};

System.translate = function (load) {
  console.log('translate: ' + load.source);
  // debugger;
  return load.source;
};

System.instantiate = function () {
  debugger;
  return;
};

System.import('./foo').then(function (m) {
  console.log('import: ' + m);
});
