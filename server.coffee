Q             = require('q')
morgan        = require('morgan')
favicon       = require('serve-favicon')
nunjucks      = require('nunjucks')
express       = require('express')
chokidar      = require('chokidar')
fs            = require('graceful-fs')
robots        = require('robots.txt')
app           = module.exports = express()
config        = require('./config.json')
routes        = require('./config/routes')
logger        = require('./config/logger')
locals        = require('./config/locals')
Posts         = require('./app/models/posts')

morganString  = '[:date[web]] :remote-addr - :method :url :status (:response-time ms) ":referrer" ":user-agent"'
loggingString = if process.env.NODE_ENV is 'production' then morganString else 'development'
port          = config.port = process.env.PORT or 3000

config.basePath = process.env.PWD

# Use Nunjucks rather than Jade
# and setup the views folder
app.set('views', "#{__dirname}/public/views")
app.set('view engine', 'nunjucks')

env = nunjucks.configure("#{__dirname}/public/views", {
  autoescape: false
  express: app
})

# Setup some nunjucks helpers
require('./config/nunjucks_helpers')(env)

# Setup some variables to be used in the site
# and allow locals to be used in views
app.use(locals)

# Add some prototype helpers
# require('./config/helpers')

# Setup to serve from these folders
app.use(express.static("#{__dirname}/public"))
app.use(express.static("#{__dirname}/posts/images"))
app.use(favicon("#{__dirname}/public/images/favicon.ico"))

# Pass in the absolute path to your robots.txt file
app.use(robots("#{__dirname}/robots.txt"))

# Setup logging
app.use(morgan(loggingString, { 'stream': logger.stream }))

# Routes & Middleware
app.use(routes)

# Set the current url for the view of the request
app.use (req, res, next) ->
  console.log req
  # console.log res
  # res.app.url = "#{app.locals.baseUrl}/#{slug}"

# 404
app.use (req, res, next) ->
  res.status 404
  title = '404: Not Found'
  error = 'Looks like that content has gone missing!'
  url   = "#{app.locals.baseUrl}#{req.url}"

  # Respond with an HTML page
  return res.render('error.html',{
    title: title
    error: error
    url: url
  }) if req.accepts('html')

  # Respond with JSON
  return res.send({
    code: 404
    error: error
    url: url
  }) if req.accepts('json')

# Everything else
app.use (err, req, res, next) ->
  statusText  = undefined
  statusCode  = err.status or 500
  errorDetail = if process.env.NODE_ENV is 'production' then err.toString() else err.stack

  switch statusCode
    when 400
      statusText = 'Bad Request'
    when 401
      statusText = 'Unauthorized'
    when 403
      statusText = 'Forbidden'
    when 500
      statusText = 'Internal Server Error'

  res.status(statusCode)

  logger.error(errorDetail)

  title = "#{statusCode}: #{statusText}"
  error = errorDetail
  url   = "#{app.locals.baseUrl}#{req.url}"

  # Respond with an HTML page
  return res.render('error.html',{
    title: title
    error: error.toString()
    url: url
  }) if req.accepts('html')

  # Respond with JSON
  return res.send({
    code: statusCode
    error: error.toString()
    url: url
  }) if req.accepts('json')

  # default to plain-text. send()
  res.type('txt').send('Not found')

# Add shortcode parsing
require('./config/shortcodes')().then () ->
  logger.info('[Shortcodes] All shortcodes added and ready to parse')

# Setup the posts cache
Posts.initCache(returnPages = true)
  .then (pages) ->
    # console.log pages
    app.locals.pages = pages

    deferred = Q.defer()

    # Setup file-watching in posts folder
    # to re-fill post cache when files are updated
    watcher = chokidar.watch("#{__dirname}/posts/*.md",{
      persistent: true
      ignoreInitial: true
    })

    watcher.on('add', (filename) ->
      logger.info('[ADDED]', filename)
      Posts.initCache().then () ->
        deferred.resolve()
    )
    .on('change', (filename) ->
      logger.info('[CHANGED]', filename)
      Posts.initCache().then () ->
        deferred.resolve()
    )
    .on('unlink', (filename) ->
      logger.info('[REMOVED]', filename)
      Posts.initCache().then ->
        deferred.resolve()
    )
    .close()
  .then () ->
    logger.info("[Server] All systems ready to go! The magic happens on port #{port}")
    app.listen(port)

module.exports = app
