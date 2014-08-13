/**
 * Site-wide routes
 */
var express     = require('express');
var router      = express.Router();
var controllers = require('../app/controllers');

// Handle main routes in controllers
router.get('/',               controllers.posts.index);

// because we do slug-lookups, we have to put the /rss  and /sitemap routes first
router.get('/rss(.xml)',      controllers.posts.rss);
router.get('/sitemap(.xml)',  controllers.posts.sitemap);
router.get('/:slug',          controllers.posts.post);

// used for pagination
router.get('/page/:num',      controllers.posts.pagination);

// Tag list page
// router.get('/tag/:tag',     controllers.posts.tag);

module.exports = router;
