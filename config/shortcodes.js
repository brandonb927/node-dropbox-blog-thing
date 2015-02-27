var Q         = require('q');
var shortcode = require('shortcode-parser');

var logger    = require('./logger');
var p         = require('./promise');
var config    = require('../config.json');


/**
 * We use sync-request in getEmbedCode because we need to return the result of the http
 * call directly, not through a callback. If `shortcode-parser` allowed
 * async functions, we'd use something like `request` here (which was initially
 * used) but it proved impossible to use in this situation
 */
function getEmbedCode (url, options) {
  if (typeof url === 'undefined' && typeof options === 'undefined') return;

  var deferred   = Q.defer();
  var secure     = false;
  var responsive = false;

  if (typeof options !== 'undefined') {
    if (options.hasOwnProperty('secure')) secure = options.secure;
    if (options.hasOwnProperty('responsive')) responsive = options.responsive;
  }

  if (process.env.NODE_ENV !== 'production') {
    logger.info('[Shortcode] Getting embed for ' + url + '');
  }

  p.request.get(url)
    .then(function (res, body) {
      var embed = res.body.html;

      if (secure) {
        embed = embed.replace(/http:\/\//i, 'https://'); // If an embed hasn't added HTTPS support yet
      }

      if (responsive) {
        embed = '<div class="embed-container">' + embed + '</div>';
      }

      return deferred.resolve(embed);
    }, function (err) {
        logger.error('[Shortcode] Error with embed "' + url + '":', e.statusCode);
        return deferred.reject('<div class="embed-error"><p><strong>Error</strong>: There\'s an issue with this embed!</p><p>' + url + '</p></div>');
    });

  return deferred.promise;
};

exports.shortcodes = function () {
  return Q.all([
    p.shortcode.add('gist')
      .then(function(str, opts) {
        if (typeof opts.url === 'undefined') return;
        return '<script src="' + opts.url + '.js"></script>';
      }),

    p.shortcode.add('codepen')
      .then(function (str, opts) {
        return getEmbedCode('https://codepen.io/api/oembed?format=json&url=' + encodeURIComponent(opts.url))
          .then(function (embed) {
            return embed;
          });
      }),

    p.shortcode.add('instagram')
      .then(function (str, opts) {
        return getEmbedCode('https://api.instagram.com/oembed?format=json&url=' + encodeURIComponent(opts.url))
          .then(function (embed) {
            return embed;
          });
      }),

    p.shortcode.add('slideshare')
      .then(function (str, opts) {
        return getEmbedCode('https://www.slideshare.net/api/oembed/2?format=json&url=' + encodeURIComponent(opts.url))
          .then(function (embed) {
            return embed;
          });
      }),

    p.shortcode.add('soundcloud')
      .then(function (str, opts) {
        return getEmbedCode('https://soundcloud.com/oembed?format=json&url=' + encodeURIComponent(opts.url))
          .then(function (embed) {
            return embed;
          });
      }),

    p.shortcode.add('twitter')
      .then(function (str, opts) {
        return getEmbedCode('https://api.twitter.com/1/statuses/oembed.json?url=' + encodeURIComponent(opts.url))
          .then(function (embed) {
            return embed;
          });
      }),

    p.shortcode.add('vimeo')
      .then(function (str, opts) {
        return getEmbedCode('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(opts.url), { responsive: true })
        .then(function (embed) {
          return embed;
        });
      }),

    p.shortcode.add('vine')
      .then(function (str, opts) {
        return getEmbedCode('https://vine.co/oembed.json?url=' + encodeURIComponent(opts.url))
          .then(function (embed) {
            return embed;
          })
      }),

    p.shortcode.add('youtube')
      .then(function (str, opts) {
        return getEmbedCode('https://youtube.com/oembed?url=' + encodeURIComponent(opts.url))
          .then(function (embed) {
            return embed;
          })
      })
  ]);

  // The rest of the embeds use the oembed.io api
  // var embeds = [
  //   // Add the name of a shortcode you want to have
  //   // that doesn't have their own oembed endpoint
  // ];

  // embeds.forEach(function (embed, index) {
  //   shortcode.add(embed, function (str, opts) {
  //     if (config.hasOwnProperty(embedKit)) {
  //       return getEmbedCode('https://embedkit.com/api/v1/embed?api_key=' + config.embedKit + '&url=' + encodeURIComponent(opts.url));
  //     } else {
  //       return getEmbedCode('http://oembed.io/api?url=' + encodeURIComponent(opts.url));
  //     }
  //   });
  // });
};
