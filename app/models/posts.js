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
  // smartypants : true,
  highlight: function (code) {
    return require('highlight.js').highlightAuto(code).value;
  }
};

var _safe = function (string) {
  return new hbs.handlebars.SafeString(string);
};

// Used to render the content of a post/page
var renderContent = function (content) {
  var newContent = shortcode.parse(content);
  // console.log(shortcode);
  // console.log(newContent);

  // Finally, return the HTML-safe content that will be rendered to the page
  return _safe(newContent);
};

// private-ish method
// Process the markdown file given a filename/filepath
// and return an object containing the data to be sent to the view
var _getPostData = function (file_path) {
  var md = new MarkedMetaData(file_path);
  md.defineTokens('---', '---');

  var meta = md.metadata();
  var content = md.markdown(markedOptions);
  var slug = slugify(meta.title);
  slug = slug.toLowerCase();

  // Some titles come as an array if they have commas,
  // so we rebuild them as a string
  if (Array.isArray(meta.title)) {
    meta.title = meta.title.join(', ');
  }

  var postData = {
    date    : moment(meta.date).format(config.site.settings.formatDate),
    dateObj : moment(meta.date).toDate(),
    title   : meta.title,
    tags    : meta.tags || [],
    slug    : slug,
    url     : app.locals.baseUrl + '/' + slug,
    content : renderContent(content)
  };

  // remove these duplicates from the meta
  delete meta.title;
  delete meta.date;
  delete meta.tags;

  postData.meta = meta;

  return postData;
};

// private-ish method
// TODO cache this somewhere so we don't have to do a filesystem lookup on every request
var _getAllPosts = function (includePages) {
  var posts = [];
  var files = fs.readdirSync('posts');

  files.forEach(function(file_name, i) {
    if (!file_name.endsWith(config.postFileExt)) {
      return;
    }

    // console.log(file_name);
    var file_path = 'posts/' + file_name;
    // console.log(file_path);

    var post = _getPostData(file_path);
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

  // TODO: better way to do this if file order changes
  // Rudimentary way to reverse the order of the posts from the files list
  posts.reverse();

  return posts;
};

// Get all post
exports.getAll = function (includePages, callback) {
  if (typeof callback === 'undefined') {
    callback = includePages;
    includePages = false;
  }
  var posts = _getAllPosts(includePages);
  callback(null, posts);
};

// Get post by it's slug
exports.getBySlug = function (slug, callback) {
  if (slug !== 'test') throw Error();

  var file_name = slug.replace('-','_');
  var file_path = 'posts/' + file_name + '.' + config.postFileExt;
  var post = _getPostData(file_path);

  callback(null, post);
};

// Get all posts by a given pagination number based on postsPerPage in config.json
exports.getByPagination = function (pageNum, callback) {
  var data  = {};
  var posts = [];
  var allPosts = _getAllPosts();
  var postsPerPage = config.site.settings.postsPerPage;

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
};

// Get all posts by a given tag
// exports.getByTag = function (tag, callback) {
//   var data  = {};
//   var posts = [];
//   var allPosts = _getAllPosts();

//   // for (var post in allPosts) {
//   //   if () {
//   //     posts.push(post)
//   //   }
//   // }

//   data.posts  = posts;
//   data.tag    = tag;

//   callback(null, data);
// };
