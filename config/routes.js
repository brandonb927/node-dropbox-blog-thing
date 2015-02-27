/**
 * Site-wide routes
 */
var express     = require('express');
var router      = express.Router();
var controllers = require('../app/controllers');

// Handle main routes in controllers
router.get('/', controllers.posts.index);

// Some 301 redirects first
router.get(/^\/feed(?:\.xml)?$/, function (req, res, next) {
  res.redirect(301, req.protocol + "://" + req.hostname  + '/rss');
});

// Because we do slug-lookups, we have to put /rss, /sitemap, and /search routes first
router.get(/^\/rss(?:\.xml)?$/,     controllers.posts.rss);
router.get(/^\/sitemap(?:\.xml)?$/, controllers.posts.sitemap);
router.get('/:slug',                controllers.posts.post);        // Posts slug page
router.get('/page/:num',            controllers.posts.pagination);  // Used for pagination
router.get('/tag/:tag',             controllers.posts.tag);         // Tag list page

module.exports = router;
