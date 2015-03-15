gravatar  = require 'gravatar'
moment    = require 'moment'
config    = require '../config.json'

###
# Globals for use in templates and remove the dropbox key from the config
# as this is a major security risk showing the app_secret in the views
###
locals = (req, res, next) ->
  for key, value of config
    res.locals[key] = value

  # Setup gravatar options to get HTTP/HTTPS url to image
  gravatarOptions = {
    s: '256'
    d: '404'
  }

  if process.env.NODE_ENV is 'production'
    res.locals.gravatar = gravatar.url config.site.author.email, gravatarOptions, true
  else
    res.locals.gravatar = gravatar.url config.site.author.email, gravatarOptions

  res.locals.debug = if process.env.NODE_ENV is 'production' then false else true

  # Set the baseUrl for use in templates and generating URLs to different pages/posts
  if process.env.NODE_ENV is 'production'
    res.locals.baseUrl = "https://#{config.site.domain}"
  else
    res.locals.baseUrl = "http://localhost:#{config.port}"

  # Set the copyright date object and date timestamp
  res.locals.site.date    = moment(new Date()).format('YYYY')
  res.locals.site.dateObj = moment(new Date()).toDate()

  next()

module.exports = locals
