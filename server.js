var logger        = require('morgan');
var favicon       = require('serve-favicon');
var hbs           = require('hbs');
var express       = require('express');

var app = module.exports = express();

var config        = require('./config.json');
var routes        = require('./config/routes');
var route_errors  = require('./config/route_errors');
var port          = process.env.PORT || 8080;


// Use Handlebars rather than Jade
// and setup the views folder
app.set('views', __dirname + '/public/views');
app.set('view engine', 'hbs');
// app.use(require('./config/hbs_helpers')(app, hbs));
// hbs.registerPartials(__dirname + 'public/views/partials');

// Setup some variables to be used in the site
// and allow locals to be used in views
// hbs.localsAsTemplateData(app);
require('./config/locals')(app, config);

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
// app.use(route_errors);
// require('./config/middleware')(app);

// Start this server!
app.listen(port);
// console.log(app);
console.log('Magic happens on port ' + port);
module.exports = app;
