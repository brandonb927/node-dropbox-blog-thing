$(document).ready(function () {
  var $htmlBody     = $('html, body');
  var $body         = $('body');
  var $bodyWrapper  = $('#body_wrapper');
  var disqus_div    = $("#disqus_thread");

  // init Fastclick on the body
  FastClick.attach($body[0]);

  $('.menu-trigger').on('click', function () {
    $body.addClass('menu-open');
  });

  $('.overlay').on('click', function () {
    $body.removeClass('menu-open');
  });

  $(document).keydown(function (e) {
    if (e.keyCode == 27) { // esc pressed
      $body.removeClass('menu-open');
    }
  });

  $("img").unveil(500, function() {
    $(this).load(function () {
      this.style.opacity = 1;
    });
  });

  $('pre code').each(function (i, e) {
    $(e).addClass('hljs-code'); // to help with styling of `pre` block
    hljs.configure({ languages: [e.className] });
    hljs.highlightBlock(e);
  });

  if (disqus_div.size() > 0 ) {
    var ds_loaded   = false;
    var top         = disqus_div.offset().top;
    var disqus_data = disqus_div.data();

    var check = function () {
      if ( !ds_loaded && $(window).scrollTop() + $(window).height() > top ) {
        ds_loaded = true;
        for (var key in disqus_data) {
          if (key.substr(0,6) == 'disqus') {
            window['disqus_' + key.replace('disqus','').toLowerCase()] = disqus_data[key];
          }
        }
        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true; dsq.src = '//' + window.disqus_shortname + '.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
      }
    };

    $(window).scroll(check);
    check();
  }

  var content = $bodyWrapper.smoothState({
    onStart : {
      duration: 250,
      render: function () {
        content.toggleAnimationClass('is-exiting');
        $htmlBody.animate({ 'scrollTop': 0 });
      }
    }
  }).data('smoothState');
});
