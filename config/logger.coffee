###
# Site-wide logging
###

winston = require 'winston'
config  = require '../config.json'

logger = new (winston.Logger)
  colors:
    debug: 'blue'
    info:  'green'
    warn:  'yellow'
    error: 'red'
  levels:
    debug: 0
    info:  1
    warn:  2
    error: 3
  transports: [
    new (winston.transports.Console)
      level:            'debug'
      json:             false
      colorize:         true
      handleExceptions: true
  ]

if process.env.PAPERTRAIL_HOST and process.env.PAPERTRAIL_PORT
  require('winston-papertrail').Papertrail
  logger.add winston.transports.Papertrail,
    host:             process.env.PAPERTRAIL_HOST
    port:             process.env.PAPERTRAIL_PORT
    level:            'info'
    json:             true
    colorize:         false
    handleExceptions: true
    logFormat: (level, message) ->
      "[#{level}] #{message}"

module.exports = logger
module.exports.stream =
  write: (message, encoding) ->
    logger.info message.slice 0, -1
