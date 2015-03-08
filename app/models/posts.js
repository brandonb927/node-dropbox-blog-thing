var Q          = require('q');
var fs         = require('graceful-fs')
var cache      = require('memory-cache');
var nunjucks   = require('nunjucks');
var htmlToText = require('html-to-text');
var marked     = require('marked');
var moment     = require('moment');
var pagination = require('pagination');
var path       = require('path');
var slugify    = require('slug');
var shortcode  = require('shortcode-parser');
var MMD        = require('marked-metadata');

var app        = require('../../server');
var config     = require('../../config.json');
var logger     = require('../../config/logger');
var p          = require('../../config/promise');


// Wrap images in a div to center them
var renderer = new marked.Renderer();
renderer.image = function (src, title, text) {
  return '<div class="post-image"><a href="'+src+'" target="_blank"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="'+src+'" alt="'+title+'" /></a><noscript><img src="'+src+'" alt="'+title+'" style="opacity:1;"/></noscript></div>';
};

// Process the markdown file given a filename/filepath
// and return an object containing the data to be sent to the view
function getPost (filePath) {
  var deferred = Q.defer();

  // Render the shortcodes on the page
  p.fs.readFile(filePath, { encoding: 'utf8' })
    // .then(function (fileContent) {
    //   return p.shortcode.parse(fileContent);
    // })
    .done(function (fileContent) {
      var tags    = [];
      var options = {
        renderer  : renderer,
        gfm       : true,
        tables    : true,
        breaks    : true
      };
      var parsedContent = shortcode.parse(fileContent);
      var md      = new MMD(parsedContent);
      var meta    = md.metadata();
      var content = md.markdown(options);
      var slug    = slugify(meta.title).toLowerCase();
      var title   = (!Array.isArray(meta.title) ? meta.title : meta.title.join(', '));

      if (typeof(meta.tags) !== 'undefined') {
        tags = (Array.isArray(meta.tags) ? meta.tags : [meta.tags]);
      }

      if (tags[0] === '') {
        tags = [];
      }

      var post = {
        date    : moment(meta.date).format(config.site.settings.formatDate),
        dateObj : moment(meta.date).toDate(),
        title   : title,
        slug    : slug,
        tags    : tags,
        url     : app.locals.baseUrl + '/' + slug,
        isPage  : (meta.type === 'page' ? true : false)
      };

      // Return the HTML-safe content that will be rendered to the page
      // post.content = new nunjucks.runtime.SafeString(content); // This is commented in favour of turning autoescape off app-wide
      post.content = content;
      post.text    = htmlToText.fromString(post.content);

      // remove these duplicates from the meta
      delete meta.title;
      delete meta.date;
      delete meta.tags;
      delete meta.type;
      post.meta = meta;
      deferred.resolve(post);
    });

  return deferred.promise;
}

function getAllPosts (includePages) {
  var deferred = Q.defer();

  // Check the cache to see if we already have the posts available
  if (cache.get('posts')) {
    var cachePosts = cache.get('posts');
    var postsArr = [];

    cachePosts.forEach(function (post, i) {
      var postData = post[Object.keys(post)[0]];

      if (includePages && postData.isPage) {
        postsArr.push(postData);
      }

      if (!postData.isPage) {
        postsArr.push(postData);
      }
    });

    // logger.info('[Cache] Getting all posts from cache');
    deferred.resolve(postsArr);

    return deferred.promise;
  }

  // Otherwise query the filesystem and get the posts
  return p.fs.readdir('posts')
    .then(function (files) {
      // Build the proper file list
      postFiles = [];
      files.forEach(function (fileName) {
        if (fileName.endsWith(config.postFileExt)) {
          postFiles.push(fileName);
        }
      });

      // Loop through the files, get data, and return them as promises
      return Q.all(postFiles.map(function (fileName) {
        var filePath = app.locals.basePath + '/posts/' + fileName;

        return getPost(filePath)
          .then(function (post) {
            if (includePages && post.isPage) {
              return post;
            }

            if (!post.isPage) {
              return post;
            }
          });
      }));
    })
    .then(function (posts) {
      // TODO: better way to do this if file order changes
      // Rudimentary way to reverse the order of the posts from the files list
      posts.reverse();

      return posts;
    });
}


var Posts = {

  // Get all posts
  getAll: function (includePages) {
    var deferred = Q.defer();

    getAllPosts(includePages)
      .then(function (posts) {
        if (!posts) {
          return deferred.reject(Error('Posts not found :('));
        }

        deferred.resolve(posts);
      });

    return deferred.promise;
  },

  // Get all post
  getAllPages: function () {
    var deferred = Q.defer();

    getAllPosts(true)
      .then(function (posts) {
        if (!posts) {
          return deferred.reject(Error('Posts not found :('));
        }

        var pagesArr = [];

        for (var i in posts) {
          if (posts[i].isPage) {
            pagesArr.push(posts[i]);
          }
        }

        deferred.resolve(pagesArr);
      });

    return deferred.promise;
  },

  // Get post by it's slug
  getBySlug: function (slug) {
    var deferred = Q.defer();

    getAllPosts(true)
      .then(function (posts) {
        if (!posts) {
          return deferred.reject(Error('Posts not found :('));
        }

        var post = posts.filter(function (p) { return p.slug === slug; })[0];
        deferred.resolve(post);
      });

    return deferred.promise;
  },

  // Get all posts by a given pagination number based on postsPerPage in config.json
  getByPagination: function (pageNum) {
    var deferred = Q.defer();

    getAllPosts(false)
      .then(function (allPosts) {
        if (!allPosts) {
          return deferred.reject(Error('Posts not found :('));
        }

        var postsPerPage = config.site.settings.postsPerPage;
        pageNum = parseInt(pageNum);

        var paginator = new pagination.SearchPaginator({
          current     : pageNum || 1,
          rowsPerPage : postsPerPage,
          totalResult : allPosts.length
        });

        var pgData = paginator.getPaginationData();

        if (pageNum > pgData.pageCount) {
          return deferred.reject(Error('Pagination out of range'));
        }

        var posts = [];

        for (var i = (pgData.fromResult === 1 ? pgData.fromResult - 1 : pgData.fromResult); i <= pgData.toResult; i++) {
          if (allPosts[i]) {
            posts.push(allPosts[i]);
          }
        }

        var data = {
          pageNum : pgData.current,
          posts   : posts,
          pagination: {
            next  : pgData.next,
            prev  : pgData.previous
          }
        };


        deferred.resolve(data);
      });

      return deferred.promise;
  },

  // Get all posts by a given tag
  getByTag: function (tag) {
    var deferred = Q.defer();

    getAllPosts(false)
      .then(function (posts) {
        if (!posts) {
          return deferred.reject(Error('No posts found with tag' + tag + ' :('));
        }

        var postsArr = [];

        for (var i in posts) {
          if (posts[i].tags.indexOf(tag) !== -1) {
            postsArr.push(posts[i]);
          }
        }

        var data = {
          tag   : tag,
          posts : postsArr
        };

        deferred.resolve(data);
      });

      return deferred.promise;
  },

  // Initialize the posts cache
  initCache: function () {
    var deferred = Q.defer();

    // Clear the current posts cache
    cache.del('posts');

    // Get all the posts
    Q.when(getAllPosts(true))
      .done(function (posts) {
        if (!posts) {
          return deferred.reject(Error('Posts not found :('));
        }

        var postsAssoc = [];

        posts.forEach(function (post, i) {
          var postObj = {};
          postObj[post.slug] = post;
          postsAssoc.push(postObj);
        });

        logger.debug('[Cache] Adding posts to cache');
        cache.put('posts', postsAssoc);

        if (process.env.NODE_ENV !== 'production') {
          logger.debug('[Cache] Posts cache size', cache.size());
          logger.debug('[Cache] Posts cache memsize', cache.memsize());
        }

        logger.debug('[Cache] %d posts indexed and added to cache', posts.length);

        // Add pages for use in navigation
        Q.when(Posts.getAllPages())
          .done(function (pages) {
            app.locals.pages = pages;
            deferred.resolve();
          });
      });

    return deferred.promise;
  }

};

module.exports = Posts;
