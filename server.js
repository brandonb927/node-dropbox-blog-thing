var morgan    = require('morgan');
var favicon   = require('serve-favicon');
var nunjucks  = require('nunjucks');
var express   = require('express');
var chokidar  = require('chokidar');
var fs        = require('fs');

var app       = module.exports = express();

var config    = require('./config.json');
var routes    = require('./config/routes');
var logger    = require('./config/logger');
var port      = process.env.PORT || config.port;
var Posts     = require('./app/models/posts');

var loggingString = ((process.env.NODE_ENV === 'production') ? config.logging.morgan : 'dev');

// Use Nunjucks rather than Jade
// and setup the views folder
app.set('views', __dirname + '/public/views');
app.set('view engine', 'nunjucks');

var env = nunjucks.configure(__dirname + '/public/views', {
  autoescape: true,
  express:    app
});

// Setup some nunjucks helpers
require('./config/nunjucks_helpers')(env);

// Setup some variables to be used in the site
// and allow locals to be used in views
require('./config/locals');

// Add some prototype helpers
require('./config/helpers.js');

// Add shortcode parsing
require('./config/shortcodes.js');

// Setup to serve from these folders
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/posts/images'));
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// Setup logging
app.use(morgan(loggingString, { 'stream': logger.stream }));

// Routes & Middleware
app.use(routes);

// 404
app.use(function (req, res, next) {
  res.status(404);

  var title           = '404: Not Found';
  var error           = 'Looks like that content has gone missing!';
  var url             = app.locals.baseUrl + req.url;
  var fuzzyMatchSlug  = req.url.replace('/','')

  var errorData = {
    title:  title,
    error:  error,
    url:    url
  };

  var jsonErrorData = {
    code:   404,
    error:  error,
    url:    url
  };

  Posts.searchBySlug(fuzzyMatchSlug, function (err, matches) {
    if (!err && matches) {
      errorData.postMatches      = matches;
      jsonErrorData.postMatches  = matches;
    }

    // Respond with an HTML page
    if (req.accepts('html')) {
      return res.render('error.html', errorData);
    }

    // Respond with JSON
    if (req.accepts('json')) {
      return res.send(jsonErrorData);
    }
  });
});

// Everything else
app.use(function (err, req, res, next) {
  var statusText;
  var statusCode  = err.status || 500;
  var errorDetail = (process.env.NODE_ENV === 'production') ? err.toString() : err.stack;

  switch (statusCode) {
    case 400:
      statusText = 'Bad Request';
      break;
    case 401:
      statusText = 'Unauthorized';
      break;
    case 403:
      statusText = 'Forbidden';
      break;
    case 500:
      statusText = 'Internal Server Error';
      break;
  }

  res.status(statusCode);

  if (process.env.NODE_ENV !== 'production') {
    logger.error(errorDetail);
  }

  var title = statusCode + ': ' + statusText;
  var error = errorDetail;
  var url   = app.locals.baseUrl + req.url;

  // Respond with an HTML page
  if (req.accepts('html')) {
    return res.render('error.html', {
      title:  title,
      error:  error.toString(),
      url:    url
    });
  }

  // Respond with JSON
  if (req.accepts('json')) {
    return res.send({
      code:   statusCode,
      error:  error.toString(),
      url:    url
    });
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

// require('./config/middleware');

// Setup the posts cache
Posts.initCache(function () {
  // Setup file-watching in posts folder
  // to re-fill post cache when files are updated
  var watcher = chokidar.watch(__dirname + '/posts', {
    ignored: function (_path) {
      if (_path.match(/\./) || _path.match(/Icon/)) {
        return !_path.match(/\.(md|markdown|txt)$/);
      }
    },
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('add', function (filename) {
    logger.debug('[ADDED]', filename);
    Posts.initCache();
  })
  .on('change', function (filename) {
    logger.debug('[CHANGED]', filename);
    Posts.initCache();
  })
  .on('unlink', function (filename) {
    logger.debug('[REMOVED]', filename);
    Posts.initCache();
  })
  .on('ready', function () {
    app.listen(port);
    logger.info('All systems ready to go! The magic happens on port ' + port);
  });
});

module.exports = app;
