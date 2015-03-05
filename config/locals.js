var gravatar = require('gravatar');
var config   = require('../config.json');
var app      = require('../server');

var protocol = ((process.env.NODE_ENV !== 'production') ? 'http' : 'https');

/**
 * Globals for use in templates and remove the dropbox key from the config
 * as this is a major security risk showing the app_secret in the views
 */

for (var key in config) {
  // remove the following key from app.locals, useful for removing
  // private strings, 3rd-party app config keys, etc.
  // if (key !== 'blah') {
  app.locals[key] = config[key];
  // }
}

// Setup gravatar options to get HTTP/HTTPS url to image
var gravatarOptions = { s: '256', d: '404' }
if (process.env.NODE_ENV !== 'production') {
  app.locals.gravatar = gravatar.url(config.site.author.email, gravatarOptions);
}
else {
  app.locals.gravatar = gravatar.url(config.site.author.email, gravatarOptions, true);
}

app.locals.debug = (process.env.NODE_ENV !== 'production' ? true : false);

// Set the baseUrl for use in templates and generating URLs to different pages/posts
if (process.env.NODE_ENV !== 'production') {
  app.locals.baseUrl = 'http://localhost:' + config.port;
} else {
  app.locals.baseUrl = protocol + '://' + config.site.domain;
}

app.locals.basePath = process.env.PWD;
