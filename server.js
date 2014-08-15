var logger        = require('morgan');
var favicon       = require('serve-favicon');
var hbs           = require('hbs');
var express       = require('express');
var watchr        = require('watchr');

var app = module.exports = express();

var config        = require('./config.json');
var routes        = require('./config/routes');
var port          = process.env.PORT || config.port;
var Posts         = require('./app/models/posts');


// Use Handlebars rather than Jade
// and setup the views folder
app.set('views', __dirname + '/public/views');
app.set('view engine', 'hbs');
// app.use(require('./config/hbs_helpers'));
// hbs.registerPartials(__dirname + 'public/views/partials');

// Setup some variables to be used in the site
// and allow locals to be used in views
require('./config/locals');

// Add some prototype helpers
require('./config/helpers.js');

// Add shortcode parsing
require('./config/shortcodes.js');

// Setup to serve from the public folder
app.use(express.static(__dirname + '/public'));
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// Setup logging
app.use(logger('dev'));

// Routes & Middleware
app.use(routes);

// 404
app.use(function (req, res, next) {
  res.status(404);

  var title = '404: Not Found';
  var error = 'Looks like that content has gone missing!';
  var url   = app.locals.baseUrl + req.url;

  // Respond with an HTML page
  if (req.accepts('html')) {
    return res.render('error', { title: title, error: error, url: url });
  }

  // Respond with JSON
  if (req.accepts('json')) {
    return res.send({ code: 404, error: error, url: url });
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
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
    console.log(errorDetail);
  }

  var title = statusCode + ': ' + statusText;
  var error = errorDetail;
  var url   = app.locals.baseUrl + req.url;

  // Respond with an HTML page
  if (req.accepts('html')) {
    return res.render('error', {
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
Posts.initCache();

// Setup file-watching in posts folder to re-fill post cache when files are updated
watchr.watch({
  paths: ['posts'],
  listeners: {
    change: function (changeType, filePath, fileCurrentStat, filePreviousStat) {
      // TODO
      // Update only changed/update file using filePath in arguments
      Posts.initCache();
    }
  }
});


// Start this server!
app.listen(port);

console.log('All systems ready to go! The magic happens on port ' + port);
module.exports = app;
