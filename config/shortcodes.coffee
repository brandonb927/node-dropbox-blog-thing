Q         = require('q')
shortcode = require('shortcode-parser')
logger    = require('./logger')
p         = require('./promise')
config    = require('../config.json')

###
# We use sync-request in getEmbedCode because we need to return the result of the http
# call directly, not through a callback. If `shortcode-parser` allowed
# async functions, we'd use something like `request` here (which was initially
# used) but it proved impossible to use in this situation
###

getEmbedCode = (url, options) ->
  return if typeof url is 'undefined' and typeof options is 'undefined'

  secure = false
  responsive = false

  if typeof options isnt 'undefined'
    secure = options.secure if options.hasOwnProperty('secure')
    responsive = options.responsive if options.hasOwnProperty('responsive')

  logger.debug("[Shortcode] Getting embed for #{url}")

  p.request.get(url)
    .then(
      (res, body) ->
        embed = JSON.parse(res.body).html
        embed = embed.replace(/http:\/\//i, 'https://') if secure # If an embed hasn't added HTTPS support yet
        embed = "<div class=\"embed-container\">#{embed}</div>" if responsive # Wrap the embed in a responsive container
        return embed
      (err) ->
        logger.error("[Shortcode] Error with embed #{url}:", e.statusCode)
        return "<div class=\"embed-error\"><p><strong>Error</strong>: There's an issue with this embed!</p><p>#{url}</p></div>"
    )

module.exports = () ->
  deferred = Q.defer()

  shortcode.add('gist', (str, opts) ->
    return if typeof opts.url is 'undefined'
    logger.debug('[Shortcode] Adding gist')
    return "<script src=\"#{opts.url}.js\"></script>"
  )

  shortcode.add('codepen', (str, opts) ->
    logger.debug('[Shortcode] Adding codepen')
    return getEmbedCode("https://codepen.io/api/oembed?format=json&url=#{encodeURIComponent(opts.url)}")
  )

  shortcode.add('instagram', (str, opts) ->
    logger.debug('[Shortcode] Adding instagram')
    return getEmbedCode("https://api.instagram.com/oembed?format=json&url=#{encodeURIComponent(opts.url)}")
  )

  shortcode.add('slideshare', (str, opts) ->
    logger.debug('[Shortcode] Adding slideshare')
    return getEmbedCode("https://www.slideshare.net/api/oembed/2?format=json&url=#{encodeURIComponent(opts.url)}")
  )

  shortcode.add('soundcloud', (str, opts) ->
    logger.debug('[Shortcode] Adding soundcloud')
    return getEmbedCode("https://soundcloud.com/oembed?format=json&url=#{encodeURIComponent(opts.url)}")
  )

  shortcode.add('twitter', (str, opts) ->
    logger.debug('[Shortcode] Adding twitter')
    return getEmbedCode("https://api.twitter.com/1/statuses/oembed.json?url=#{encodeURIComponent(opts.url)}")
  )

  shortcode.add('vimeo', (str, opts) ->
    logger.debug('[Shortcode] Adding vimeo')
    return getEmbedCode("https://vimeo.com/api/oembed.json?url=#{encodeURIComponent(opts.url)}", { responsive: true })
  )

  shortcode.add('vine', (str, opts) ->
    logger.debug('[Shortcode] Adding vine')
    return getEmbedCode("https://vine.co/oembed.json?url=#{encodeURIComponent(opts.url)}")
  )

  shortcode.add('youtube', (str, opts) ->
    logger.debug('[Shortcode] Adding youtube')
    return getEmbedCode("https://youtube.com/oembed?url=#{encodeURIComponent(opts.url)}")
  )

  deferred.resolve()

  # The rest of the embeds use the oembed.io api
  embeds = []
  embeds.forEach (embed, index) ->
    shortcode.add(embed, (str, opts) ->
      if process.env.EMBEDKIT_API_KEY
        return getEmbedCode("https://embedkit.com/api/v1/embed?api_key=#{config.embedKit}&url=#{encodeURIComponent(opts.url)}")
      else
        return getEmbedCode("http://oembed.io/api?url=#{encodeURIComponent(opts.url)}")
    )
  return deferred.promise
