var fs            = require('fs');
var cache         = require('memory-cache');
var hbs           = require('hbs');
var moment        = require('moment');
var pagination    = require('pagination');
var slugify       = require('slug');
var shortcode     = require('shortcode-parser');
var MMD           = require('marked-metadata');

var app           = require('../../server');
var config        = require('../../config.json');


// Init the markdown parser options
var markedOptions = {
  gfm         : true,
  tables      : true,
  breaks      : true
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
    var md = new MMD(parsedContent);
    var meta = md.metadata();
    var content = md.markdown(markedOptions);
    var slug = slugify(meta.title);
    slug = slug.toLowerCase();

    var post = {
      date    : moment(meta.date).format(config.site.settings.formatDate),
      dateObj : moment(meta.date).toDate(),
      title   : (!Array.isArray(meta.title) ? meta.title : meta.title.join(', ')),
      tags    : (Array.isArray(meta.tags) ? meta.tags : [meta.tags]) || [],
      slug    : slug,
      url     : app.locals.baseUrl + '/' + slug
    };

    renderContent(content, function (err, renderedContent) {
      post.content = renderedContent;

      // remove these duplicates from the meta
      delete meta.title;
      delete meta.date;
      delete meta.tags;
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

      if (postData.meta.type !== 'undefined') {
        if (includePages && postData.meta.type === 'page') {
          postsArr.push(postData);
        }
      }

      if (postData.meta.type !== 'page') {
        postsArr.push(postData);
      }
    });

    console.log('[Cache] Getting all posts');
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
      if (post.meta.type !== 'undefined') {
        // type must contain the page attribute
        if (includePages && post.meta.type === 'page') {
          // we want to include pages into the posts array
          posts.push(post);
        }
      }

      if (post.meta.type !== 'page') {
        // Must be a post, just add it
        posts.push(post);
      }
    });
  });

  // TODO: better way to do this if file order changes
  // Rudimentary way to reverse the order of the posts from the files list
  posts.reverse();

  callback(null, posts);
}

// Initialize the posts cache
exports.initCache = function (callback) {
  // Clear the current posts cache
  cache.del('posts');

  // Get all the posts
  getAllPosts(true, function (err, posts) {
    if (err || !posts) {
      return callback(Error('Posts not found :('));
    }

    var postsAssoc = [];

    for (var i in posts) {
      var postObj = {};
      postObj[posts[i].slug] = posts[i];
      postsAssoc.push(postObj);
    }

    cache.put('posts', postsAssoc);
    console.log('[Cache] Posts inserted into cache');
    // console.log('[Cache] Posts cache size', cache.size());
    // console.log('[Cache] Posts cache memsize', cache.memsize());

    callback();
  });
};

// Get all posts
exports.getAll = function (includePages, callback) {
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
};

// Get all post
exports.getAllPages = function (callback) {
  getAllPosts(true, function (err, posts) {
    if (err || !posts) {
      return callback(Error('Posts not found :('));
    }

    var pagesArr = [];

    for (var i in posts) {
      if (posts[i].meta.type !== 'undefined' && posts[i].meta.type === 'page') {
        pagesArr.push(posts[i]);
      }
    }

    callback(null, pagesArr);
  });
};

// Get post by it's slug
exports.getBySlug = function (slug, callback) {
  console.log('Getting post by slug');
  getAllPosts(false, function (err, posts) {
    var post = posts.filter(function (p) { return p.slug === slug; })[0];

    if (err || !posts) {
      return callback(err);
    }

    callback(null, post);
  });

};

// Get all posts by a given pagination number based on postsPerPage in config.json
exports.getByPagination = function (pageNum, callback) {
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
};

// Get all posts by a given tag
exports.getByTag = function (tag, callback) {
  getAllPosts(false, function (err, posts) {
    if (err || !posts) {
      return callback(Error('No posts found with tag' + tag + ' :('));
    }

    var postsArr = [];

    for (var i in posts) {
      if (posts[i].tags !== 'undefined' && posts[i].tags.indexOf(tag) !== -1) {
        postsArr.push(posts[i]);
      }
    }

    var data = {
      tag   : tag,
      posts : postsArr
    };

    callback(null, data);
  });
};
