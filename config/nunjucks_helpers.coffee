###
# Setup the nunjucks helpers
###

module.exports = (env) ->
  # Strip HTML tags
  env.addFilter 'striptags', (txt, count) ->
    # exit now if text is undefined
    return if typeof txt is 'undefined'
    # the regular expresion
    regexp   = new RegExp '<(?:.|\n)*?>', 'gm'
    brRegexp = new RegExp '<br[^>]*>', 'gi'
    # replacing the text
    txt = txt.replace brRegexp, ' '
    txt = txt.replace regexp, ''

    return txt

  return env
