var Q         = require('q');
var fs        = require('graceful-fs')
var request   = require('request');
var shortcode = require('shortcode-parser');
var logger    = require('./logger');

exports.fs = {
  readFile: function (fileName, options) {
    var deferred = Q.defer();

    fs.readFile(fileName, (options || {}), function (err, data) {
      if (err) return deferred.reject(new Error(err));
      deferred.resolve(data);
    });

    return deferred.promise;
  },

  readdir: function (path) {
    var deferred = Q.defer();

    fs.readdir(path, function (err, data) {
      if (err) return deferred.reject(new Error(err));
      deferred.resolve(data);
    });

    return deferred.promise;
  }
};

exports.request = {
  get: function (url) {
    var deferred = Q.defer();

    request(url, function (err, res, body) {
      if (err) return deferred.reject(err);

      deferred.resolve(res, body);
    });

    return deferred.promise;
  }
};

exports.shortcode = {
  add: function (code) {
    var deferred = Q.defer();

    shortcode.add(code, function (str, opts) {
      deferred.resolve(str, opts)
    });

    return deferred.promise;
  }
}
