_           = require 'lodash'
Q           = require 'q'
fs          = require 'graceful-fs'
htmlToText  = require 'html-to-text'
marked      = require 'marked'
moment      = require 'moment'
nunjucks    = require 'nunjucks'
parsePath   = require 'parse-filepath'
pagination  = require 'pagination'
slugify     = require 'slug'
MMD         = require 'marked-metadata'
highlight   = require 'highlight.js'
config      = require '../../config.json'
logger      = require '../../config/logger'
p           = require '../../config/promise'


# Wrap images in a div to center them
renderer = new marked.Renderer()

renderer.image = (src, title, text) ->
  @src = src

  if not _.startsWith @src, 'http'
    buildRetinaPath = (scale) =>
      pathObj = parsePath @src
      dirName = if pathObj.dirname isnt '.' then pathObj.dirname else ''
      imgPath = "#{dirName}#{pathObj.name}@#{scale}#{pathObj.extname}"
      return imgPath

    @src2x = buildRetinaPath '2x'
    @src3x = buildRetinaPath '3x'

    return """
      <figure>
        <a href="#{@src2x}" target="_blank">
          <picture>
            <source srcset="#{@src}, #{@src2x} 2x, #{@src3x} 3x">
            <img src=\"#{@src}\"
              srcset="#{@src}, #{@src2x} 2x, #{@src3x} 3x"
              alt=\"#{if title? then title else ''}\">
          </picture>
        </a>
      </figure>
    """


class PostsModel

  constructor: () ->
    # Posts not found message
    @errorPostsNotFound = new Error 'Posts not found :('

  # Process the markdown file given a filename/filepath
  # and return an object containing the data to be sent to the view
  getPostFile: (filePath) ->
    return p.fs.readFile(filePath, { encoding: 'utf8' }).then (fileContent) ->
      options =
        renderer : renderer
        gfm      : true
        tables   : true
        breaks   : true
        highlight: (code, lang) -> return highlight.highlightAuto(code).value

      md       = new MMD fileContent
      meta     = md.metadata()
      content  = md.markdown options
      slug     = slugify(meta.title).toLowerCase()
      tags     = []

      if not Array.isArray meta.title
        title = meta.title
      else
        title = meta.title.join ', '

      if meta.tags?
        tags = if Array.isArray meta.tags then meta.tags else [meta.tags]

      tags = [] if tags[0] is '' # Reset the tags if the meta.tags is blank

      post =
        date    : moment(meta.date).format(config.site.settings.formatDate)
        dateObj : moment(meta.date).toDate()
        title   : title
        slug    : slug
        tags    : tags
        isPage  : if meta.type is 'page' then true else false

      # Strip blank <p> tags from around figure elements
      content = content.replace /<p><figure>/g, '<figure>'
      content = content.replace /<\/figure><\/p>/g, '</figure>'

      # Return the HTML-safe content that will be rendered to the page
      # NOTE: This is commented in favour of turning autoescape off app-wide
      # post.content = new nunjucks.runtime.SafeString(content);
      post.content  = content
      post.text     = htmlToText.fromString post.content

      # remove these duplicates from the meta
      delete meta.title
      delete meta.date
      delete meta.tags
      delete meta.type
      post.meta = meta

      return post

    .then null, logger.error

  getAll: (includePages) ->
    return @getAllPosts(includePages)
      .then (posts) =>
        return @errorPostsNotFound if not posts
        return posts

      .then null, logger.error

  getAllPosts: (includePages) ->
    reversePosts = (results) ->
      posts = []

      results.forEach (result) ->
        posts.push if result.value? then result.value else result

      # TODO: better way to do this if file order changes
      # Rudimentary way to reverse the order of the posts from the files list
      return posts.reverse()

    # Check the cache to see if we already have the posts available
    return p.cache.get('posts')
      .then (cachePosts) =>
        if cachePosts?
          logger.debug '[Cache] Posts exist in cache, serving from memory'
          posts = []
          cachePosts.forEach (post) ->
            postData = post[Object.keys(post)[0]]
            if includePages and postData.isPage or not postData.isPage
              posts.push postData

          return posts

        else
          logger.debug '[Cache] Posts don\'t exist in cache, serving from file'

          # Otherwise query the filesystem and get the posts
          return p.fs.readdir('posts').then (files) =>
            # Build the proper file list
            postFiles = []
            files.forEach (filename) ->
              if _.endsWith filename, 'md'
                isDraft = _.startsWith filename, 'draft_'

                # Add the file if it is prepended with draft
                if config.isDev and isDraft
                  postFiles.push filename
                else if not isDraft
                  # Otherwise just add it if not a draft
                  postFiles.push filename

            posts = _.map postFiles, (filename) =>
              filePath = "#{config.basePath}/posts/#{filename}"
              return @getPostFile(filePath).then (post) ->
                return post if includePages and post.isPage or not post.isPage

            return Q.allSettled posts

          .then(reversePosts)

      .then null, logger.error


  getAllPages: () ->
    return @getAllPosts(true)
      .then (posts) =>
        return @errorPostsNotFound if not posts

        postsArr = []
        for post in posts
          postsArr.push post if post.isPage

        return postsArr

      .then null, logger.error

  getBySlug: (slug) ->
    return @getAllPosts(true)
      .then (posts) =>
        return @errorPostsNotFound if not posts
        return posts.filter((p) -> return p.slug is slug)[0]

      .then null, logger.error

  getByPagination: (pageNum) ->
    return @getAllPosts(false)
      .then (allPosts) =>
        return @errorPostsNotFound if not allPosts

        postsPerPage = config.site.settings.postsPerPage
        pageNum = parseInt(pageNum)
        paginator = new (pagination.SearchPaginator)
          current     : pageNum or 1
          rowsPerPage : postsPerPage
          totalResult : allPosts.length

        pgData = paginator.getPaginationData()

        if pageNum > pgData.pageCount
          e = Error 'Pagination out of range'
          logger.error e
          return e

        posts = []

        if pgData.fromResult is 1
          i = pgData.fromResult - 1
        else
          i = pgData.fromResult

        while i <= pgData.toResult
          posts.push allPosts[i] if allPosts[i]
          i++

        return {
          pageNum: pgData.current
          posts: posts
          pagination:
            next: pgData.next
            prev: pgData.previous
        }

      .then null, logger.error

  getByTag: (tag) ->
    @getAllPosts(false)
      .then (posts) ->
        if not posts
          e = "No posts found with tag #{tag} :("
          logger.error e
          return Error e

        postsArr = []
        for post in posts
          postsArr.push post if tag in post.tags

        return {
          tag: tag
          posts: postsArr
        }

      .then null, logger.error

  initCache: (returnPages = false) ->
    # Clear the current posts cache
    return p.cache.del('posts')
      .then () =>
        return @getAllPosts(true)

      .then (results) =>
        return @errorPostsNotFound if not results

        logger.debug '[Cache] Adding posts to cache...'

        posts = []
        results.forEach (result) ->
          post = result.value? or result
          postObj = {}
          postObj[post.slug] = post
          posts.push postObj

        return p.cache.put('posts', posts).then () =>
          logger.debug "└── #{posts?.length} posts indexed and added to cache"

          # Add pages for use in navigation
          if returnPages
            return @getAllPages().then (pages) -> return pages
          else
            return

      .then null, logger.error

module.exports = PostsModel
