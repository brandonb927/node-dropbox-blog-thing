/**
 * Setup the nunjucks helpers
 */
module.exports = function (env) {

  // Strip HTML tags
  env.addFilter('striptags', function(txt, count) {
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

}
