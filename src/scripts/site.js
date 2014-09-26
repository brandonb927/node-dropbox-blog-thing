/**
 * Site JS
 */
;(function (window, document, $) {
  'use strict';

  $(document).ready(function () {
    var $htmlBody      = $('html, body');
    var $body          = $('body');
    var $bodyWrapper   = $('#body_wrapper');
    var $menuTrigger   = $('.menu-trigger');
    var $overlay       = $('.overlay');
    var buttonSearchId = '#button_search';
    var inputSearchId  = '#input_search';

    function highlightCode () {
      $('pre code').each(function (i, e) {
        $(e).addClass('hljs-code'); // to help with styling of `pre` block
        hljs.configure({ languages: [e.className] });
        hljs.highlightBlock(e);
      });
    }

    function initImageUnveil () {
      $('img').unveil(500, function() {
        $(this).load(function () {
          this.style.opacity = 1;
        });
      });
    }

    function doSearch (content) {
      var inputSearchVal = $(inputSearchId).val().trim().toLowerCase();

      if (inputSearchVal !== '') {
        content.load('search?q=' + encodeURIComponent(inputSearchVal));
      }
    }

    // This is a hack to get smoothState to recognize things when it reloads
    function initSite (content) {
      highlightCode();
      initImageUnveil();

      $bodyWrapper
        .on('click', buttonSearchId, function (e) {
          e.preventDefault();
          doSearch(content);
        })
        .on('keypress', inputSearchId, function (e) {
          if(e.which === 13) {
            e.preventDefault();
            doSearch(content);
          }
        });
    }

    // Menu trigger click handler
    $menuTrigger.on('click', function () {
      $body.addClass('menu-open');
    });

    // overlay click handler when menu is open
    $overlay.on('click', function () {
      $body.removeClass('menu-open');
    });

    // Esc-key handler when menu is open
    $(document).keydown(function (e) {
      if (e.keyCode === 27) { // esc pressed
        $body.removeClass('menu-open');
      }
    });

    var content = $bodyWrapper.smoothState({
      prefetch:      true,
      development:   true,
      pageCacheSize: 4,
      onStart: {
        duration: 250,
        render: function () {
          content.toggleAnimationClass('is-exiting');
          $htmlBody.animate({ 'scrollTop': 0 });
        }
      },
      callback: function (url, $container, $content) {
        initSite(content);
      }
    }).data('smoothState');

    initSite(content);

  });

})(window, document, jQuery);
