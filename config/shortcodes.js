var winston   = require('winston');
var shortcode = require('shortcode-parser');
var request   = require('sync-request');


/**
 * We use sync-request in getEmbedCode because we need to return the result of the http
 * call directly, not through a callback. If `shortcode-parser` allowed
 * async functions, we'd use something like `request` here (which was initially
 * used) but it proved impossible to use in this situation
 */
function getEmbedCode (url) {
  if (typeof url === 'undefined') return;
  try {
    var res = request('GET', url);
    var embed = JSON.parse(res.getBody().toString('utf-8')).html;
  }
  catch (e) {
    winston.error('Error with embed "' + url + '":', e.statusCode);
    embed = '<div class="embed-error"><p><strong>Error</strong>: There\'s an issue with this embed!</p><p>' + url + '</p></div>';
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

shortcode.add('instagram', function (str, opts) {
  return getEmbedCode('http://api.instagram.com/oembed?url=' + encodeURIComponent(opts.url) + '&format=json');
});

shortcode.add('slideshare', function (str, opts) {
  return getEmbedCode('http://www.slideshare.net/api/oembed/2?url=' + encodeURIComponent(opts.url) + '&format=json');
});

shortcode.add('soundcloud', function (str, opts) {
  return getEmbedCode('http://soundcloud.com/oembed?url=' + encodeURIComponent(opts.url) + '&format=json');
});

shortcode.add('twitter', function (str, opts) {
  return getEmbedCode('https://api.twitter.com/1/statuses/oembed.json?url=' + encodeURIComponent(opts.url));
});

shortcode.add('vimeo', function (str, opts) {
  return getEmbedCode('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(opts.url));
});

shortcode.add('vine', function (str, opts) {
  return getEmbedCode('https://vine.co/oembed.json?url=' + encodeURIComponent(opts.url));
});

shortcode.add('youtube', function (str, opts) {
  return getEmbedCode('https://youtube.com/oembed?url=' + encodeURIComponent(opts.url));
});


/**
 * The rest of the embeds use the oembed.io api
 */
var embeds = [
  // Add the name of a shortcode you want to have
  // that doesn't have their own oembed endpoint
];

embeds.forEach(function (embed, index) {
  shortcode.add(embed, function (str, opts) {
    if (config.hasOwnProperty(embedKit)) {
      return getEmbedCode('https://embedkit.com/api/v1/embed?api_key=' + config.embedKit + '&url=' + encodeURIComponent(opts.url));
    } else {
      return getEmbedCode('http://oembed.io/api?url=' + encodeURIComponent(opts.url));
    }
  });
});
