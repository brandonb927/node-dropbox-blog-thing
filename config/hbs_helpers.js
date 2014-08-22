var hbs = require('hbs');

// Setup the handlebars helpers
// hbs.registerHelper('socialLinks', function() {
//   console.log(app.locals);
// });

// Strip HTML tags
hbs.registerHelper('striptags', function (txt) {
  // exit now if text is undefined
  if(typeof txt == "undefined") {
    return;
  }

  // the regular expresion
  var regexp    = new RegExp('<(?:.|\n)*?>','gm');
  var brRegexp  = new RegExp('<br[^>]*>','gi')

  // replacing the text
  txt = txt.replace(brRegexp, ' ');
  txt = txt.replace(regexp, '');
  return txt;
});
