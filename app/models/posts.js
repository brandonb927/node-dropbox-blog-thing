var fs              = require('fs');
var hbs             = require('hbs');
var moment          = require('moment');
var pagination      = require('pagination');
var slugify         = require('slug');
var shortcode       = require('shortcode-parser');
var MarkedMetaData  = require('marked-metadata');

var app             = require('../../server');
var config          = require('../../config.json');


// Init the markdown parser options
var markedOptions = {
  gfm         : true,
  tables      : true,
  breaks      : true,
  // smartypants : true
};

// Used to render the content of a post/page
function renderContent (content, callback) {
  // Return the HTML-safe content that will be rendered to the page
  callback(null, new hbs.handlebars.SafeString(content));
}

function renderShortcodes (content, callback) {
  callback(null, shortcode.parse(content));
}

// Process the markdown file given a filename/filepath
// and return an object containing the data to be sent to the view
function getPost (filePath, callback) {
  var fileContents = String(fs.readFileSync(filePath));

  renderShortcodes(fileContents, function (err, parsedContent) {
    // if (err) throw Error('Could not parse shortcode content');

    var md = new MarkedMetaData(parsedContent);
    var meta = md.metadata();
    var content = md.markdown(markedOptions);
    var slug = slugify(meta.title);
    slug = slug.toLowerCase();

    // Some titles come as an array if they have commas,
    // so we rebuild them as a string
    if (Array.isArray(meta.title)) {
      meta.title = meta.title.join(', ');
    }

    var post = {
      date    : moment(meta.date).format(config.site.settings.formatDate),
      dateObj : moment(meta.date).toDate(),
      title   : meta.title,
      tags    : meta.tags || [],
      slug    : slug,
      url     : app.locals.baseUrl + '/' + slug
    };

    renderContent(content, function (err, renderedContent) {
      // if (err) throw Error('Could not render HTML safely');
      post.content = renderedContent;
    });

    // remove these duplicates from the meta
    delete meta.title;
    delete meta.date;
    delete meta.tags;
    post.meta = meta;

    callback(null, post);
  });
}

// TODO cache this somewhere so we don't have to do a filesystem lookup on every request
function getAllPosts (includePages, callback) {
  var posts = [];
  var files = fs.readdirSync('posts');

  files.forEach(function (fileName, i) {
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

// Get all post
exports.getAll = function (includePages, callback) {
  if (typeof callback === 'undefined') {
    callback = includePages;
    includePages = false;
  }

  getAllPosts(includePages, function (err, posts) {
    callback(null, posts);
  });
};

// Get post by it's slug
exports.getBySlug = function (slug, callback) {
  if (slug !== 'test') throw Error();

  var fileName = slug.replace('-','_');
  var filePath = 'posts/' + fileName + '.' + config.postFileExt;

  getPost(filePath, function (post) {
    callback(null, post);
  });
};

// Get all posts by a given pagination number based on postsPerPage in config.json
exports.getByPagination = function (pageNum, callback) {
  var data  = {};
  var posts = [];
  var postsPerPage = config.site.settings.postsPerPage;

  getAllPosts(false, function (err, allPosts) {
    pageNum = parseInt(pageNum);

    var paginator = new pagination.SearchPaginator({
      current: pageNum || 1,
      rowsPerPage: postsPerPage,
      totalResult: allPosts.length
    });

    var pgData = paginator.getPaginationData();
    if (pageNum > pgData.pageCount) throw Error('Pagination number too high');
    for (var i = (pgData.fromResult === 1 ? pgData.fromResult - 1 : pgData.fromResult); i <= pgData.toResult; i++) {
      posts.push(allPosts[i]);
    }

    data.pagination = {};
    data.pagination.next = pgData.next;
    data.pagination.prev = pgData.previous;

    data.pageNum = pgData.current;
    data.posts = posts;
    callback(null, data);
  });
};

// Get all posts by a given tag
// exports.getByTag = function (tag, callback) {
//   var data  = {};
//   var posts = [];
//   var allPosts = getAllPosts();

//   // for (var post in allPosts) {
//   //   if () {
//   //     posts.push(post)
//   //   }
//   // }

//   data.posts  = posts;
//   data.tag    = tag;

//   callback(null, data);
// };
