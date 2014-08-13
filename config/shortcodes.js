var shortcode = require('shortcode-parser');
var oembed    = require('node-oembed-io');

shortcode.add('gist', function(str, opts) {
  return '<script src="' + opts.url + '.js"></script>';
});

// oembed.providers(function (err, providers) {
//   providers.forEach(function (provider, index) {

//   });
// });
