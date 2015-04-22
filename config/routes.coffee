###
# Site-wide routes
###

router          = require('express').Router()
PostsController = require '../app/controllers/posts'
config          = require '../config.json'

posts           = new PostsController()

# Handle main routes in PostsController
router.get '/', posts.index

# Some 301 redirects first
router.get /^\/feed(?:\.xml)?$/, (req, res, next) ->
  return res.redirect 301, "#{req.protocol}://#{req.hostname}#{(if process.env.PORT then '' else ":#{config.port}")}/rss"

# Because we do slug-lookups, we have to put /rss and /sitemap routes first
router.get /^\/rss(?:\.xml)?$/, posts.rss
router.get /^\/sitemap(?:\.xml)?$/, posts.sitemap

# Posts slug page
router.get '/:slug', posts.post

# Used for pagination
router.get '/page/:num', posts.pagination

# Tag list page
router.get '/tag/:tag', posts.tag

module.exports = router
