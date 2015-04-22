Q         = require 'q'
fs        = require 'graceful-fs'
cache     = require 'memory-cache'
request   = require 'request'

exports.fs =
  readFile: (fileName, options) ->
    deferred = Q.defer()

    fs.readFile fileName, options or {}, (err, data) ->
      return deferred.reject new Error err if err
      deferred.resolve data

    return deferred.promise

  readdir: (path) ->
    deferred = Q.defer()

    fs.readdir path, (err, data) ->
      return deferred.reject new Error err if err
      deferred.resolve data

    return deferred.promise

exports.request =
  get: (url) ->
    deferred = Q.defer()

    request.get url, (err, res, body) ->
      return deferred.reject err if err
      deferred.resolve res, body

    return deferred.promise

exports.cache =
  get: (key) ->
    deferred = Q.defer()
    contents = cache.get(key)
    deferred.resolve contents
    return deferred.promise

  put: (key, value) ->
    deferred = Q.defer()
    contents = cache.put(key, value)
    deferred.resolve contents
    return deferred.promise

  del: (key) ->
    deferred = Q.defer()
    contents = cache.del(key)
    deferred.resolve contents
    return deferred.promise
