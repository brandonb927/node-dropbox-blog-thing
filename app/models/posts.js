var fs            = require('fs');
var cache         = require('memory-cache');
var lunr          = require('lunr');
var hbs           = require('hbs');
var htmlToText    = require('html-to-text');
var marked        = require('marked');
var moment        = require('moment');
var pagination    = require('pagination');
var slugify       = require('slug');
var shortcode     = require('shortcode-parser');

var MMD           = require('marked-metadata');
var renderer      = new marked.Renderer();

var app           = require('../../server');
var config        = require('../../config.json');


// Wrap images in a div to center them
renderer.image = function (src, title, text) {
  return '<div class="post-image"><a href="'+src+'" target="_blank"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="'+src+'" alt="'+title+'" /></a><noscript><img src="'+src+'" alt="'+title+'" style="opacity:1;"/></noscript></div>';
};

// Init the markdown parser options
var markedOptions = {
  renderer  : renderer,
  gfm       : true,
  tables    : true,
  breaks    : true
};

// Return the HTML-safe content that will be rendered to the page
function renderContent (content, callback) {
  callback(null, new hbs.handlebars.SafeString(content));
}

// Render the shortcodes on the page
function renderShortcodes (content, callback) {
  callback(null, shortcode.parse(content));
}

// Process the markdown file given a filename/filepath
// and return an object containing the data to be sent to the view
function getPost (filePath, callback) {
  var fileContents = fs.readFileSync(filePath, 'utf-8');

  renderShortcodes(fileContents, function (err, parsedContent) {
    var tags    = [];

    var md      = new MMD(parsedContent);
    var meta    = md.metadata();
    var content = md.markdown(markedOptions);

    var slug    = slugify(meta.title).toLowerCase();
    var title   = (!Array.isArray(meta.title) ? meta.title : meta.title.join(', '));

    if (typeof meta.tags !== 'undefined') {
      tags = (Array.isArray(meta.tags) ? meta.tags : [meta.tags]);
    }

    var post = {
      date    : moment(meta.date).format(config.site.settings.formatDate),
      dateObj : moment(meta.date).toDate(),
      title   : title,
      tags    : tags,
      slug    : slug,
      url     : app.locals.baseUrl + '/' + slug,
      isPage  : (meta.type === 'page' ? true : false),
    };

    renderContent(content, function (err, renderedContent) {
      post.content = renderedContent;
      post.text    = htmlToText.fromString(content);

      // remove these duplicates from the meta
      delete meta.title;
      delete meta.date;
      delete meta.tags;
      delete meta.type;
      post.meta = meta;

      callback(null, post);
    });
  });
}

function getAllPosts (includePages, callback) {
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

    // console.log('[Cache] Getting all posts from cache');
    return callback(null, postsArr);
  }

  // Otherwise query the filesystem and get the posts
  var posts = [];
  var files = fs.readdirSync('posts');

  files.forEach(function (fileName) {
    if (!fileName.endsWith(config.postFileExt)) {
      return;
    }

    var filePath = 'posts/' + fileName;

    getPost(filePath, function (err, post) {
      if (includePages && post.isPage) {
        posts.push(post);
      }

      if (!post.isPage) {
        posts.push(post);
      }
    });
  });

  // TODO: better way to do this if file order changes
  // Rudimentary way to reverse the order of the posts from the files list
  posts.reverse();

  callback(null, posts);
}

var Posts = {
  // Initialize the posts cache
  initCache: function (callback) {
    // Clear the current posts cache
    cache.del('posts');

    // Get all the posts
    getAllPosts(true, function (err, posts) {
      if (err || !posts) {
        return callback(Error('Posts not found :('));
      }

      var postsAssoc = [];

      var searchIndex = lunr(function () {
        this.field('title', { boost: 10 });
        this.field('tags', { boost: 100 });
        this.ref('slug');
      });

      for (var i in posts) {
        var postObj = {};
        postObj[posts[i].slug] = posts[i];
        postsAssoc.push(postObj);
        searchIndex.add(posts[i]);
      }

      console.log('[Cache] Adding posts to cache');
      cache.put('posts', postsAssoc);
      // console.log('[Cache] Posts cache size', cache.size());
      // console.log('[Cache] Posts cache memsize', cache.memsize());

      console.log('[Cache] Adding posts to search index');
      cache.put('searchIndex', searchIndex);

      console.log('[Cache] %d posts indexed and added to cache', posts.length);

      if (typeof callback !== 'undefined') {
        callback();
      }
    });
  },

  // Get all posts
  getAll: function (includePages, callback) {
    if (typeof callback === 'undefined') {
      callback = includePages;
      includePages = false;
    }

    getAllPosts(includePages, function (err, posts) {
      if (err || !posts) {
        return callback(Error('Posts not found :('));
      }

      callback(null, posts);
    });
  },

  // Get all post
  getAllPages: function (callback) {
    getAllPosts(true, function (err, posts) {
      if (err || !posts) {
        return callback(Error('Posts not found :('));
      }

      var pagesArr = [];

      for (var i in posts) {
        if (posts[i].isPage) {
          pagesArr.push(posts[i]);
        }
      }

      callback(null, pagesArr);
    });
  },

  // Get post by it's slug
  getBySlug: function (slug, callback) {
    getAllPosts(true, function (err, posts) {
      var post = posts.filter(function (p) { return p.slug === slug; })[0];

      if (err || !posts) {
        return callback(err);
      }

      callback(null, post);
    });
  },

  // Get all posts by a given pagination number based on postsPerPage in config.json
  getByPagination: function (pageNum, callback) {
    getAllPosts(false, function (err, allPosts) {
      var postsPerPage = config.site.settings.postsPerPage;
      pageNum = parseInt(pageNum);

      var paginator = new pagination.SearchPaginator({
        current     : pageNum || 1,
        rowsPerPage : postsPerPage,
        totalResult : allPosts.length
      });

      var pgData = paginator.getPaginationData();

      if (pageNum > pgData.pageCount) {
        return callback(Error('Pagination out of range'));
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

      callback(null, data);
    });
  },

  // Get all posts by a given tag
  getByTag: function (tag, callback) {
    getAllPosts(false, function (err, posts) {
      if (err || !posts) {
        return callback(Error('No posts found with tag' + tag + ' :('));
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

      callback(null, data);
    });
  },

  // Get a fuzzy-search post list using a 404 slug
  searchBySlug: function (slug, callback) {
    getAllPosts(true, function (err, posts) {
      if (err || !posts) {
        return callback(err);
      }

      var resultsArray = [];
      var searchString = decodeURI(slug).split('-').join(' ');
      var searchIndex = cache.get('searchIndex');
      var results = searchIndex.search(searchString);

      results.forEach(function (result) {
        Posts.getBySlug(result.ref, function (err, post) {
          resultsArray.push(post);
        });
      });

      callback(null, resultsArray);
    });
  },

  // Search by search term
  searchByTerm: function (searchString, callback) {
    getAllPosts(true, function (err, posts) {
      if (err || !posts) {
        return callback(err);
      }

      var resultsArray = [];
      var searchIndex = cache.get('searchIndex');
      var results = searchIndex.search(searchString);

      results.forEach(function (result) {
        Posts.getBySlug(result.ref, function (err, post) {
          resultsArray.push(post);
        });
      });

      callback(null, resultsArray);
    });
  }
};

module.exports = Posts;
