var gravatar = require('nodejs-gravatar');
var config   = require('../config.json');
var app      = require('../server');

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

app.locals.gravatar = gravatar.imageUrl(config.site.author.email, { s: '256', d: '404' });

// Set the baseUrl for use in templates and generating URLs to different pages/posts
if (process.env.NODE_ENV !== 'production') {
  app.locals.baseUrl = config.protocol + '://localhost:' + config.port;
} else {
  app.locals.baseUrl = config.protocol + '://' + config.site.domain;
}
