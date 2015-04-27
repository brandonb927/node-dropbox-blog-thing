Q             = require 'q'
morgan        = require 'morgan'
favicon       = require 'serve-favicon'
nunjucks      = require 'nunjucks'
express       = require 'express'
fs            = require 'graceful-fs'
robots        = require 'robots.txt'
watch         = require 'watch'
app           = module.exports = express()
config        = require './config.json'
routes        = require './config/routes'
logger        = require './config/logger'
locals        = require './config/locals'
PostsModel    = require './app/models/posts'

posts         = new PostsModel()

# set env vars for ease-of-use
config.isDev  = process.env.NODE_ENV is 'development'
config.isProd = process.env.NODE_ENV is 'production'

# Set the logging string for morgan and winston
morganString  = 'method=:method path=:url status=:status response-time=:response-time referrer=:referrer ip=:remote-addr'
loggingString = if config.isProd then morganString else 'dev'

# Set the port for the server to run on
port          = config.port = process.env.PORT or 3000

# Set the base path of the app
config.basePath = process.env.PWD

# Use Nunjucks rather than Jade and setup the views folder
app.set 'views', "#{__dirname}/public/views"
app.set 'view engine', 'nunjucks'

# In production, this will sit behind an nginx proxy
app.enable 'trust proxy' if config.isProd

# Configure the views folder
env = nunjucks.configure "#{__dirname}/public/views", {
  autoescape: false
  express: app
}

# Setup some nunjucks helpers
require('./config/nunjucks_helpers')(env)

# Setup some variables to be used in the site
# and allow locals to be used in views
app.use locals

# Add some prototype helpers
# require './config/helpers'

# Setup to serve from these folders
app.use express.static "#{__dirname}/public"
app.use express.static "#{__dirname}/posts/images"
app.use favicon "#{__dirname}/public/images/favicon.ico"

# Pass in the absolute path to your robots.txt file
app.use robots "#{__dirname}/robots.txt"

# Setup logging
app.use morgan loggingString, { 'stream': logger.stream }

# Routes & Middleware
app.use routes

# 404 route
app.use (req, res, next) ->
  res.status 404
  title = '404: Not Found'
  error = 'Looks like that content has gone missing!'
  url   = "/#{req.url}"

  # Respond with an HTML page
  return res.render 'error.html', {
    title : title
    error : error
    url   : url
  } if req.accepts 'html'

  # Respond with JSON
  return res.send {
    code  : 404
    error : error
    url   : url
  } if req.accepts 'json'

# Everything else, 500, etc.
app.use (err, req, res, next) ->
  statusText  = undefined
  statusCode  = err.status or 500
  errorDetail = if config.isProd then err.toString() else err.stack

  switch statusCode
    when 400
      statusText = 'Bad Request'
    when 401
      statusText = 'Unauthorized'
    when 403
      statusText = 'Forbidden'
    when 500
      statusText = 'Internal Server Error'

  res.status statusCode

  logger.error errorDetail

  title = "#{statusCode}: #{statusText}"
  error = errorDetail
  url   = "/#{req.url}"

  # Respond with an HTML page
  return res.render 'error.html', {
    title : title
    error : error.toString()
    url   : url
  } if req.accepts 'html'

  # Respond with JSON
  return res.send {
    code  : statusCode
    error : error.toString()
    url   : url
  } if req.accepts 'json'

  # default to plain-text
  res
    .type 'txt'
    .send 'Not found'

# Setup the posts cache
posts.initCache(true).then (pages) ->
  for page in pages
    page.url = "/#{page.slug}"

  app.locals.pages = pages

# Setup file-watching in posts folder to re-fill post cache when files are updated
watch.watchTree "#{__dirname}/posts", (f, curr, prev) ->
  if typeof f is "object" and prev is null and curr is null
    # Finished walking the tree
  else if prev is null
    # f is a new file
    logger.debug "#{f} is a new file"
    posts.initCache().then(
      () -> return
      (err) -> logger.error err
    )
  else if curr.nlink is 0
    # f was removed
    logger.debug "#{f} was removed"
    posts.initCache().then(
      () -> return
      (err) -> logger.error err
    )
  else
    # f was changed
    logger.debug "#{f} was changed"
    posts.initCache().then(
      () -> return
      (err) -> logger.error err
    )

# Setup the listener for the app
logger.info "[Server] All systems ready to go! The magic happens on port #{port}"
app.listen port

module.exports = app
