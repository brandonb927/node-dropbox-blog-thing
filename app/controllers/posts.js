var app       = require('../../server');
var sm        = require('sitemap');
var Feed      = require('feed');

var config    = require('../../config.json');
var settings  = config.settings;

var Posts     = require('../models/posts');


module.exports = {

  index: function (req, res, next) {
    Posts.getByPagination(1, function (err, data) {
      if(err || !data) return next(err);

      var pageData = {
        page        : data.pageNum,
        posts       : data.posts,
        pagination  : data.pagination
      };

      if (req.accepts('html')) {
        return res.render('index', pageData);
      }

      if (req.accepts('json')) {
        return res.send(pageData);
      }
    });
  },

  post: function (req, res, next) {
    Posts.getBySlug(req.params.slug, function (err, post) {
      if(err || !post) return next(err);

      if (req.accepts('html')) {
        return res.render('post', post);
      }

      if (req.accepts('json')) {
        return res.send(post);
      }
    });
  },

  pagination: function (req, res, next) {
    Posts.getByPagination(req.params.num, function (err, data) {
      if(err || !data) return next(err);

      var pageData = {
        page        : data.pageNum,
        posts       : data.posts,
        pagination  : data.pagination
      };

      if (req.accepts('html')) {
        return res.render('index', pageData);
      }

      if (req.accepts('json')) {
        return res.send(pageData);
      }
    });
  },

  tag: function (req, res, next) {
    Posts.getByTag(req.params.tag, function (err, data) {
      if(err || !data) return next(err);

      var pageData = {
        tag   : data.tag,
        posts : data.posts
      };

      if (req.accepts('html')) {
        return res.render('index', pageData);
      }

      if (req.accepts('json')) {
        return res.send(pageData);
      }
    });
  },

  // The RSS feed for the site
  rss: function (req, res, next) {
    Posts.getAll(function (err, posts) {
      if(err || !posts) return next(err);

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
      res.send(feed.render('atom-1.0'));
    });
  },

  // Generate the sitemap.xml page
  sitemap: function (req, res, next) {
    Posts.getAll(true, function (err, posts) {
      if(err || !posts) return next(err);

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
      res.send(sitemap.toString());
    });
  }

};
