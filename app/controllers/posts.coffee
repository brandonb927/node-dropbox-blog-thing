sm          = require('sitemap')
qs          = require('querystring')
Feed        = require('feed')
config      = require('../../config.json')
PostsModel  = require('../models/posts')


PostsController = {
  index: (req, res, next) ->
    PostsModel.getByPagination(1)
      .done (data) ->
        return next() if not data

        for post in data.posts
          post.url = "#{res.locals.baseUrl}/#{post.slug}"

        pageData = {
          page: data.pageNum
          posts: data.posts
          pagination: data.pagination
        }

        if req.accepts('html')
          return res.render('index.html', pageData)

        if req.accepts('json')
          return res.send(pageData)

  post: (req, res, next) ->
    PostsModel.getBySlug(req.params.slug)
      .done (post) ->
        return next() if not post

        # Set the current url for the view of the request
        res.locals.url = "#{res.locals.baseUrl}/#{post.slug}"

        if req.accepts('html')
          return res.render('post.html', { post: post })

        if req.accepts('json')
          return res.send({ post: post })

  pagination: (req, res, next) ->
    PostsModel.getByPagination(req.params.num)
      .done (data) ->
        return next() if not data

        for post in data.posts
          post.url = "#{res.locals.baseUrl}/#{post.slug}"

        pageData = {
          page:       data.pageNum
          posts:      data.posts
          pagination: data.pagination
        }

        if req.accepts('html')
          return res.render('index.html', pageData)

        if req.accepts('json')
          return res.send(pageData)

  tag: (req, res, next) ->
    PostsModel.getByTag(req.params.tag)
      .done (data) ->
        return next() if not data

        for post in data.posts
          post.url = "#{res.locals.baseUrl}/#{post.slug}"

        pageData = {
          tag: data.tag
          posts: data.posts
        }

        if req.accepts('html')
          return res.render('index.html', pageData)

        if req.accepts('json')
          return res.send(pageData)

  rss: (req, res, next) ->
    PostsModel.getAll()
      .done (posts) ->
        return next() if not posts

        # Initializing feed object
        feed = new Feed({
          title:        config.site.title
          description:  config.site.description
          link:         res.locals.baseUrl
          image:        res.locals.gravatar
          author: {
            name:       config.site.author.name
            email:      config.site.author.email
          }
        })

        # Add the posts to the feed
        for post in posts
          feed.addItem({
            title:       post.title
            date:        post.dateObj
            link:        "#{res.locals.baseUrl}/#{post.slug}"
            description: post.description
          })

        # Render the feed
        return res.send(feed.render('atom-1.0'))

  sitemap: (req, res, next) ->
    PostsModel.getAll(true)
      .done (posts) ->
        return next() if not posts

        sitemap = sm.createSitemap({
          hostname:  config.site.base_url
          cacheTime: 600000
        })

        # Add the posts to the feed
        for post in posts
          sitemap.add({ url: "#{res.locals.baseUrl}/#{post.slug}" })

        # Set the content type to xml and send the response back
        res.header('Content-Type', 'application/xml')
        return res.send(sitemap.toString())
}

module.exports = PostsController
