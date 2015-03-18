Q           = require('q')
fs          = require('graceful-fs')
cache       = require('memory-cache')
nunjucks    = require('nunjucks')
htmlToText  = require('html-to-text')
marked      = require('marked')
moment      = require('moment')
pagination  = require('pagination')
path        = require('path')
slugify     = require('slug')
MMD         = require('marked-metadata')
highlight   = require('highlight.js')
jsdom       = require("jsdom").jsdom
config      = require('../../config.json')
logger      = require('../../config/logger')
p           = require('../../config/promise')


# Wrap images in a div to center them
renderer = new marked.Renderer()

renderer.image = (src, title, text) ->
  return "<figure>
            <img src=\"#{src}\" alt=\"#{if title? then title else ''}\">
          </figure>"

# Process the markdown file given a filename/filepath
# and return an object containing the data to be sent to the view
getPost = (filePath) ->
  deferred = Q.defer()

  p.fs.readFile(filePath, encoding: 'utf8')
    .then (fileContent) ->
      tags = []
      options =
        renderer: renderer
        gfm:      true
        tables:   true
        breaks:   true
        highlight: (code, lang) ->
          return highlight.highlightAuto(code).value

      md            = new MMD fileContent
      meta          = md.metadata()
      content       = md.markdown options
      slug          = slugify(meta.title).toLowerCase()
      title         = if not Array.isArray meta.title then meta.title else meta.title.join ', '
      tags          = []

      if meta.tags?
        tags = if Array.isArray meta.tags  then meta.tags else [meta.tags]

      tags = [] if tags[0] is '' # Reset the tags if the meta.tags is blank

      post =
        date:     moment(meta.date).format(config.site.settings.formatDate)
        dateObj:  moment(meta.date).toDate()
        title:    title
        slug:     slug
        tags:     tags
        isPage:   if meta.type is 'page' then true else false

      # Strip blank <p> tags from around figure elements
      document = jsdom(content)
      window = document.defaultView
      body = window.document.body.innerHTML
      content = body.replace /\<p\>\<\/p\>/g, ''

      # Return the HTML-safe content that will be rendered to the page
      # post.content = new nunjucks.runtime.SafeString(content); // This is commented in favour of turning autoescape off app-wide
      post.content  = content
      post.text     = htmlToText.fromString post.content

      # remove these duplicates from the meta
      delete meta.title
      delete meta.date
      delete meta.tags
      delete meta.type
      post.meta = meta
      deferred.resolve post

  return deferred.promise

getAllPosts = (includePages) ->
  deferred = Q.defer()

  # Check the cache to see if we already have the posts available
  if cache.get 'posts'
    cachePosts = cache.get 'posts'
    postsArr = []
    cachePosts.forEach (post, i) ->
      postData = post[Object.keys(post)[0]]
      postsArr.push postData if includePages and postData.isPage or not postData.isPage

    deferred.resolve postsArr
    return deferred.promise
  else
    # Otherwise query the filesystem and get the posts
    return p.fs.readdir 'posts'
      .then (files) ->
        # Build the proper file list
        postFiles = []
        files.forEach (fileName) ->
          postFiles.push fileName if fileName.endsWith config.postFileExt

        # Loop through the files, get data, and return them as promises
        return Q.all postFiles.map (fileName) ->
          filePath = "#{config.basePath}/posts/#{fileName}"
          getPost filePath
            .then (post) ->
              return post if includePages and post.isPage or not post.isPage

      .then (posts) ->
        # TODO: better way to do this if file order changes
        # Rudimentary way to reverse the order of the posts from the files list
        return posts.reverse()

PostsModel =
  getAll: (includePages) ->
    deferred = Q.defer()
    getAllPosts includePages
      .then (posts) ->
        return deferred.reject(Error('Posts not found :(')) if not posts

        deferred.resolve posts

    return deferred.promise

  getAllPages: () ->
    deferred = Q.defer()
    getAllPosts true
      .then (posts) ->
        return deferred.reject(Error('Posts not found :(')) if not posts

        pagesArr = []
        for post in posts
          pagesArr.push post if post.isPage

        deferred.resolve pagesArr

    return deferred.promise

  getBySlug: (slug) ->
    deferred = Q.defer()
    getAllPosts(true)
      .then (posts) ->
        return deferred.reject(Error('Posts not found :(')) if not posts

        post = posts.filter((p) ->
          p.slug is slug
        )[0]

        deferred.resolve(post)

    return deferred.promise

  getByPagination: (pageNum) ->
    deferred = Q.defer()
    getAllPosts(false)
      .then (allPosts) ->
        return deferred.reject(Error('Posts not found :(')) if not allPosts

        postsPerPage = config.site.settings.postsPerPage
        pageNum = parseInt(pageNum)
        paginator = new (pagination.SearchPaginator)
          current: pageNum or 1
          rowsPerPage: postsPerPage
          totalResult: allPosts.length

        pgData = paginator.getPaginationData()

        return deferred.reject Error 'Pagination out of range' if pageNum > pgData.pageCount

        posts = []

        i = if pgData.fromResult is 1 then pgData.fromResult - 1 else pgData.fromResult
        while i <= pgData.toResult
          posts.push allPosts[i] if allPosts[i]
          i++

        deferred.resolve
          pageNum: pgData.current
          posts: posts
          pagination:
            next: pgData.next
            prev: pgData.previous

    return deferred.promise

  getByTag: (tag) ->
    deferred = Q.defer()
    getAllPosts false
      .then (posts) ->
        return deferred.reject Error "No posts found with tag #{tag} :(" if not posts

        postsArr = []
        for post in posts
          postsArr.push post if tag in post.tags

        deferred.resolve
          tag: tag
          posts: postsArr

    return deferred.promise

  initCache: (returnPages = false) ->
    deferred = Q.defer()

    # Clear the current posts cache
    cache.del 'posts'

    # Get all the posts
    Q.when getAllPosts true
      .then (posts) ->
        return deferred.reject Error 'Posts not found :(' if not posts

        postsAssoc = []
        posts.forEach (post, i) ->
          postObj = {}
          postObj[post.slug] = post
          postsAssoc.push postObj

        logger.debug '[Cache] Adding posts to cache'
        cache.put 'posts', postsAssoc

        logger.debug '[Cache] Posts cache size',cache.size
        logger.debug '[Cache] %d posts indexed and added to cache', posts.length

        # Add pages for use in navigation
        unless returnPages
          deferred.resolve()
        else
          Q.when PostsModel.getAllPages()
            .then (pages) ->
              deferred.resolve pages

    return deferred.promise

module.exports = PostsModel
