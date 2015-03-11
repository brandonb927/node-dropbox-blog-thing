###
# Site-wide routes
###

router          = require('express').Router()
PostsController = require '../app/controllers/posts'
config          = require '../config.json'

# Handle main routes in PostsController
router.get '/', PostsController.index

# Some 301 redirects first
router.get /^\/feed(?:\.xml)?$/, (req, res, next) ->
  return res.redirect 301, "#{req.protocol}://#{req.hostname}#{(if process.env.PORT then '' else ":#{config.port}")}/rss"

# Because we do slug-lookups, we have to put /rss and /sitemap routes first
router.get /^\/rss(?:\.xml)?$/, PostsController.rss
router.get /^\/sitemap(?:\.xml)?$/, PostsController.sitemap

# Posts slug page
router.get '/:slug', PostsController.post

# Used for pagination
router.get '/page/:num', PostsController.pagination

# Tag list page
router.get '/tag/:tag', PostsController.tag

module.exports = router
