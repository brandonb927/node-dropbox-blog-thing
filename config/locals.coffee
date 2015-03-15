gravatar  = require 'gravatar'
moment    = require 'moment'
config    = require '../config.json'
protocol  = if process.env.NODE_ENV is 'production' then 'https' else 'http'

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

  if process.env.NODE_ENV isnt 'production'
    res.locals.gravatar = gravatar.url config.site.author.email, gravatarOptions
  else
    res.locals.gravatar = gravatar.url config.site.author.email, gravatarOptions, true

  res.locals.debug = if process.env.NODE_ENV isnt 'production' then true else false

  # Set the baseUrl for use in templates and generating URLs to different pages/posts
  if process.env.NODE_ENV isnt 'production'
    res.locals.baseUrl = "http://localhost:#{config.port}"
  else
    res.locals.baseUrl = "#{protocol}://#{config.site.domain}"

  # Set the copyright date object and date timestamp
  res.locals.site.date    = moment(new Date()).format('YYYY')
  res.locals.site.dateObj = moment(new Date()).toDate()

  next()

module.exports = locals
