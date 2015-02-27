(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/brandon/github.com/brandonb927/node-dropbox-blog-thing/src/scripts/site.js":[function(require,module,exports){
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

},{}]},{},["/Users/brandon/github.com/brandonb927/node-dropbox-blog-thing/src/scripts/site.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9zaXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIFNpdGUgSlNcbiAqL1xuOyhmdW5jdGlvbiAod2luZG93LCBkb2N1bWVudCwgJCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuICAgIHZhciAkaHRtbEJvZHkgICAgICA9ICQoJ2h0bWwsIGJvZHknKTtcbiAgICB2YXIgJGJvZHkgICAgICAgICAgPSAkKCdib2R5Jyk7XG4gICAgdmFyICRib2R5V3JhcHBlciAgID0gJCgnI2JvZHlfd3JhcHBlcicpO1xuICAgIHZhciAkbWVudVRyaWdnZXIgICA9ICQoJy5tZW51LXRyaWdnZXInKTtcbiAgICB2YXIgJG92ZXJsYXkgICAgICAgPSAkKCcub3ZlcmxheScpO1xuXG4gICAgZnVuY3Rpb24gaGlnaGxpZ2h0Q29kZSAoKSB7XG4gICAgICAkKCdwcmUgY29kZScpLmVhY2goZnVuY3Rpb24gKGksIGUpIHtcbiAgICAgICAgJChlKS5hZGRDbGFzcygnaGxqcy1jb2RlJyk7IC8vIHRvIGhlbHAgd2l0aCBzdHlsaW5nIG9mIGBwcmVgIGJsb2NrXG4gICAgICAgIGhsanMuY29uZmlndXJlKHsgbGFuZ3VhZ2VzOiBbZS5jbGFzc05hbWVdIH0pO1xuICAgICAgICBobGpzLmhpZ2hsaWdodEJsb2NrKGUpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5pdEltYWdlVW52ZWlsICgpIHtcbiAgICAgICQoJ2ltZycpLnVudmVpbCg1MDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkKHRoaXMpLmxvYWQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRoaXMuc3R5bGUub3BhY2l0eSA9IDE7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gTWVudSB0cmlnZ2VyIGNsaWNrIGhhbmRsZXJcbiAgICAkbWVudVRyaWdnZXIub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJGJvZHkuYWRkQ2xhc3MoJ21lbnUtb3BlbicpO1xuICAgIH0pO1xuXG4gICAgLy8gb3ZlcmxheSBjbGljayBoYW5kbGVyIHdoZW4gbWVudSBpcyBvcGVuXG4gICAgJG92ZXJsYXkub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgJGJvZHkucmVtb3ZlQ2xhc3MoJ21lbnUtb3BlbicpO1xuICAgIH0pO1xuXG4gICAgLy8gRXNjLWtleSBoYW5kbGVyIHdoZW4gbWVudSBpcyBvcGVuXG4gICAgJChkb2N1bWVudCkua2V5ZG93bihmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMjcpIHsgLy8gZXNjIHByZXNzZWRcbiAgICAgICAgJGJvZHkucmVtb3ZlQ2xhc3MoJ21lbnUtb3BlbicpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaGlnaGxpZ2h0Q29kZSgpO1xuICAgIGluaXRJbWFnZVVudmVpbCgpO1xuXG4gIH0pO1xuXG59KSh3aW5kb3csIGRvY3VtZW50LCBqUXVlcnkpO1xuIl19
