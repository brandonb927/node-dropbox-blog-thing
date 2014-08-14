var shortcode = require('shortcode-parser');
var oembed    = require('node-oembed-io');
var httpsync  = require('httpsync');


/**
 * We use httpsync in getEmbedCode because we need to return the result of the http
 * call directly, not through a callback. If `shortcode-parser` allowed
 * async functions, we'd use something like `request` here (which was initially
 * used) but it proved impossible to use in this situation
 */
function getEmbedCode (url) {
  var req = httpsync.get(url);
  var res = req.end();
  var data = new Buffer(res.data);
  var embed = JSON.parse(data.toString('utf-8')).html;
  console.log(embed);
  return embed;
};

shortcode.add('gist', function(str, opts) {
  return '<script src="' + opts.url + '.js"></script>';
});

shortcode.add('codepen', function (str, opts) {
  return getEmbedCode('http://codepen.io/api/oembed?url=' + encodeURIComponent(opts.url) + '&format=json');
});
