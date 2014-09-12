/**
 * Site JS
 */
;(function (window, document, $) {
  'use strict';

  $(document).ready(function () {
    var $htmlBody     = $('html, body');
    var $body         = $('body');
    var $bodyWrapper  = $('#body_wrapper');
    var $buttonSearch = $('#button_search');
    var $inputSearch  = $('#input_search');
    var $postsList    = $('#posts_list')

    var smoothStateSettings = {
      onStart : {
        duration: 250,
        render: function () {
          content.toggleAnimationClass('is-exiting');
          $htmlBody.animate({ 'scrollTop': 0 });
        }
      },
      callback: function (url, $container, $content) {
        highlightCode();
        initImageUnveil();
      }
    };

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

    function doSearch () {
      var inputSearchVal = $inputSearch.val().trim().toLowerCase();

      if (inputSearchVal !== '') {
        $postsList.load(
          '/search?q=' + encodeURIComponent(inputSearchVal),
          function () {
            highlightCode();
            initImageUnveil();
          }
        );
      }
    }

    // init Fastclick on the body
    FastClick.attach($body[0]);

    $('.menu-trigger').on('click', function () {
      $body.addClass('menu-open');
    });

    $('.overlay').on('click', function () {
      $body.removeClass('menu-open');
    });

    $buttonSearch.on('click', function (e) {
      e.preventDefault();
      doSearch();
    });

    $inputSearch.keypress(function (e) {
      if(e.which == 13) {
        doSearch();
      }
    });

    $(document).keydown(function (e) {
      if (e.keyCode === 27) { // esc pressed
        $body.removeClass('menu-open');
      }
    });

    highlightCode();
    initImageUnveil();

    var content = $bodyWrapper.smoothState(smoothStateSettings).data('smoothState');
  });

})(window, document, jQuery);
