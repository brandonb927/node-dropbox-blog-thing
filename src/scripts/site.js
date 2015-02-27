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

    highlightCode();
    initImageUnveil();

  });

})(window, document, jQuery);
