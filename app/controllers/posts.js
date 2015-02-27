var app       = require('../../server');
var sm        = require('sitemap');
var qs        = require('querystring');
var Feed      = require('feed');

var config    = require('../../config.json');

var Posts     = require('../models/posts');


module.exports = {

  index: function (req, res, next) {
    return Posts.getByPagination(1)
      .then(function (data) {
        if (!data) return next();

        var pageData = {
          page        : data.pageNum,
          posts       : data.posts,
          pagination  : data.pagination
        };

        if (req.accepts('html')) {
          return res.render('index.html', pageData);
        }

        if (req.accepts('json')) {
          return res.send(pageData);
        }
      });
  },

  post: function (req, res, next) {
    return Posts.getBySlug(req.params.slug)
      .then(function (post) {
        if (!post) return next();

        if (req.accepts('html')) {
          return res.render('post.html', { post: post });
        }

        if (req.accepts('json')) {
          return res.send({ post: post });
        }
      });
  },

  pagination: function (req, res, next) {
    return Posts.getByPagination(req.params.num)
      .then(function (data) {
        if (!data) return next();

        var pageData = {
          page        : data.pageNum,
          posts       : data.posts,
          pagination  : data.pagination
        };

        if (req.accepts('html')) {
          return res.render('index.html', pageData);
        }

        if (req.accepts('json')) {
          return res.send(pageData);
        }
      });
  },

  tag: function (req, res, next) {
    return Posts.getByTag(req.params.tag)
      .then(function (data) {
        if (!data) return next();

        var pageData = {
          tag   : data.tag,
          posts : data.posts
        };

        if (req.accepts('html')) {
          return res.render('index.html', pageData);
        }

        if (req.accepts('json')) {
          return res.send(pageData);
        }
      });
  },

  // The RSS feed for the site
  rss: function (req, res, next) {
    return Posts.getAll()
      .then(function (posts) {
        if (!posts) return next();

        // Initializing feed object
        var feed = new Feed({
          title       : config.site.title,
          description : config.site.description,
          link        : app.locals.baseUrl,
          image       : app.locals.gravatar,
          author: {
            name  : config.site.author.name,
            email : config.site.author.email
          }
        });

        // Add the posts to the feed
        for(var key in posts) {
          feed.addItem({
            title:       posts[key].title,
            date:        posts[key].dateObj,
            link:        posts[key].url,
            description: posts[key].description
          });
        }

        // Render the feed
        return res.send(feed.render('atom-1.0'));
      });
  },

  // Generate the sitemap.xml page
  sitemap: function (req, res, next) {
    return Posts.getAll(true)
      .then(function (posts) {
        if (!posts) return next();

        var sitemap = sm.createSitemap ({
          hostname  : config.site.base_url,
          cacheTime : 600000
        });

        // Add the posts to the feed
        for(var key in posts) {
          sitemap.add({ url: posts[key].url });
        }

        // Set the content type to xml and send the response back
        res.header('Content-Type', 'application/xml');
        return res.send(sitemap.toString());
      });
  }

};
