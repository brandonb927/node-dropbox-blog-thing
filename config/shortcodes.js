var winston   = require('winston');
var shortcode = require('shortcode-parser');
var request   = require('sync-request');


/**
 * We use sync-request in getEmbedCode because we need to return the result of the http
 * call directly, not through a callback. If `shortcode-parser` allowed
 * async functions, we'd use something like `request` here (which was initially
 * used) but it proved impossible to use in this situation
 */
function getEmbedCode (url, options) {
  if (typeof url === 'undefined') return;

  var secure      = false;
  var responsive  = false;

  if (typeof options !== 'undefined') {
    if (options.hasOwnProperty('secure')) secure = options.secure;
    if (options.hasOwnProperty('responsive')) responsive = options.responsive;
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      winston.info('[Shortcode] Getting embed for ' + url + '');
    }

    var httpResp  = request('GET', url);
    var res       = JSON.parse(httpResp.getBody().toString('utf-8'));
    var embed     = res.html;

    if (secure) {
      embed = embed.replace(/http:\/\//i, 'https://'); // Youtube hasn't added HTTPS support to oembed yet :(
    }
  }
  catch (e) {
    winston.error('[Shortcode] Error with embed "' + url + '":', e.statusCode);
    embed = '<div class="embed-error"><p><strong>Error</strong>: There\'s an issue with this embed!</p><p>' + url + '</p></div>';
  }

  if (responsive) {
    return '<div class="embed-container">' + embed + '</div>';
  }

  return embed;
};

shortcode.add('gist', function(str, opts) {
  if (typeof opts.url === 'undefined') return;
  return '<script src="' + opts.url + '.js"></script>';
});

shortcode.add('codepen', function (str, opts) {
  return getEmbedCode('https://codepen.io/api/oembed?format=json&url=' + encodeURIComponent(opts.url));
});

shortcode.add('instagram', function (str, opts) {
  return getEmbedCode('https://api.instagram.com/oembed?format=json&url=' + encodeURIComponent(opts.url));
});

shortcode.add('slideshare', function (str, opts) {
  return getEmbedCode('https://www.slideshare.net/api/oembed/2?format=json&url=' + encodeURIComponent(opts.url));
});

shortcode.add('soundcloud', function (str, opts) {
  return getEmbedCode('http://soundcloud.com/oembed?format=json&url=' + encodeURIComponent(opts.url));
});

shortcode.add('twitter', function (str, opts) {
  return getEmbedCode('https://api.twitter.com/1/statuses/oembed.json?url=' + encodeURIComponent(opts.url));
});

shortcode.add('vimeo', function (str, opts) {
  return getEmbedCode('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(opts.url), {
    responsive: true
  });
});

shortcode.add('vine', function (str, opts) {
  return getEmbedCode('https://vine.co/oembed.json?url=' + encodeURIComponent(opts.url), {
    responsive: true
  });
});

shortcode.add('youtube', function (str, opts) {
  return getEmbedCode('https://youtube.com/oembed?url=' + encodeURIComponent(opts.url), {
    secure: true
  });
});


// The rest of the embeds use the oembed.io api
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
