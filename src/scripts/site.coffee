###
# Site JS
###

((window, document, $) ->
  'use strict'

  $(document).ready () ->
    $htmlBody     = $('html, body')
    $body         = $('body')
    $bodyWrapper  = $('#body_wrapper')
    $menuTrigger  = $('.menu-trigger')
    $overlay      = $('.overlay')

    highlightCode = () ->
      # to help with styling of `pre` block
      $('pre code').each (i, e) ->
        $(e).addClass 'hljs-code'
        hljs.configure languages: [ e.className ]
        hljs.highlightBlock e

    initImageUnveil = () ->
      $('img').unveil 500, () ->
        $(this).load () ->
          @style.opacity = 1

    # Menu trigger click handler
    $menuTrigger.on 'click', () ->
      $body.addClass 'menu-open'

    # overlay click handler when menu is open
    $overlay.on 'click', () ->
      $body.removeClass 'menu-open'

    # Esc-key handler when menu is open
    $(document).keydown (e) ->
      # esc pressed
      $body.removeClass 'menu-open' if e.keyCode == 27

    highlightCode()
    initImageUnveil()

) window, document, jQuery
