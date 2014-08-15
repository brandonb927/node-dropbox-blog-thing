var shortcode     = require('shortcode-parser');
var requestSync   = require('request-sync');


/**
 * We use httpsync in getEmbedCode because we need to return the result of the http
 * call directly, not through a callback. If `shortcode-parser` allowed
 * async functions, we'd use something like `request` here (which was initially
 * used) but it proved impossible to use in this situation
 */
function getEmbedCode (url) {
  // console.log(url);
  if (typeof url === 'undefined') return;
  var res = requestSync(url);
  var embed = JSON.parse(res.body.toString('utf-8')).html;
  // console.log(embed);
  if (!embed) {
    embed = '<div class="embed-error"><p><strong>Error</strong>: There\'s and issue with this embed!</p><p>' + url + '</p></div>';
  }

  return embed;
};

shortcode.add('gist', function(str, opts) {
  if (typeof opts.url === 'undefined') return;
  return '<script src="' + opts.url + '.js"></script>';
});

shortcode.add('codepen', function (str, opts) {
  return getEmbedCode('http://codepen.io/api/oembed?url=' + encodeURIComponent(opts.url) + '&format=json');
});

shortcode.add('twitter', function (str, opts) {
  return getEmbedCode('https://api.twitter.com/1/statuses/oembed.json?url=' + encodeURIComponent(opts.url));
});

// The rest of the embeds use the oembed.io api
var embeds = [
  'instagram',
  'slideshare',
  'soundcloud',
  'vimeo',
  'vine',
  'youtube'
];

embeds.forEach(function (embed, index) {
  shortcode.add(embed, function (str, opts) {
    return getEmbedCode('http://oembed.io/api?url=' + encodeURIComponent(opts.url));
  });
});
