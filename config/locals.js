var gravatar = require('nodejs-gravatar');

/**
 * Globals for use in templates and remove the dropbox key from the config
 * as this is a major security risk showing the app_secret in the views
 */

module.exports = function (app, config) {

  for (var key in config) {
    // remove the following key from app.locals, useful for removing
    // private strings, 3rd-party app config keys, etc.
    // if (key !== 'blah') {
    app.locals[key] = config[key];
    // }
  }

  app.locals.gravatar = gravatar.imageUrl(config.site.author.email, { s: '256', d: '404' });

  // This should be a middleware but becasue we're setting an app.locals
  // variable, it's here for now. Should be move elsewhere though..
  app.use(function (req, res, next) {
    app.locals.baseUrl = req.protocol + '://' + req.get('host');
    // console.log(app.locals.baseUrl);
    next();
  });

};
