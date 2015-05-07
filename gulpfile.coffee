# Configuration paths and data - change to suit your needs
logger        = require './config/logger'
config        = require './gulp_config.json'
del           = require 'del'
runSequence   = require 'run-sequence'
notifier      = require 'node-notifier';
nodemon       = require 'nodemon'
browserSync   = require 'browser-sync'
reload        = browserSync.reload

gulp          = require 'gulp'
autoprefixer  = require 'gulp-autoprefixer'
cached        = require 'gulp-cached'
coffee        = require 'gulp-coffee'
coffeelint    = require 'gulp-coffeelint'
concat        = require 'gulp-concat'
cssmin        = require 'gulp-cssmin'
htmlmin       = require 'gulp-htmlmin'
imagemin      = require 'gulp-imagemin'
less          = require 'gulp-less'
pixrem        = require 'gulp-pixrem'
plumber       = require 'gulp-plumber'
sourcemaps    = require 'gulp-sourcemaps'
uglify        = require 'gulp-uglify'
gutil         = require 'gulp-util'
pngcrush      = require 'imagemin-pngcrush'

isWatching  = false
reloadDelay = 2000

# Error handler
# Add the error handler to the config
# Get the task from the gulp/tasks folder
errorHandler = (err) ->
  notifier.notify
    title: 'Something wicked happened...'
    message: "Error: #{err.message}"

  logger.error "#{gutil.colors.red '✗' } Error: #{err.message}"

  @emit 'end'


# View templates task
gulp.task 'templates', () ->
  gulp.src config.paths.templates.src
    .pipe htmlmin { collapseWhitespace: true }
    .pipe gulp.dest config.paths.templates.dest


# Clean the assets folder
gulp.task 'clean', () ->
  gulp.src 'public/{images,assets,views}', { read: false }
    .pipe del()


# Images stuff
gulp.task 'images', () ->
  return gulp.src config.paths.images.src
    .pipe plumber { errorHandler: errorHandler }
    .pipe imagemin {
      optimizationLevel: 5
      progressive: true
      interlaced: true
      use: [ pngcrush() ]
    }
    .pipe gulp.dest config.paths.images.dest
    .pipe reload { stream: true }


# Compile CSS styles
gulp.task 'styles', () ->
  # The process goes alitle somethin like dis:
  #  - run the less through
  #    -- less to css
  #    -- autoprefixer for vendor prefxing, etc.
  #    -- pixrem to generate pixel values from rem values alongside eachother
  #  - concatenate everything into one file
  #  - reload browsersync so the new css can be injected into the page
  return gulp.src config.paths.styles.src
    .pipe plumber { errorHandler: errorHandler }
    .pipe sourcemaps.init()
    .pipe less()
    .pipe autoprefixer()
    .pipe pixrem()
    .pipe cssmin()
    .pipe concat config.vars.site_min_css
    .pipe sourcemaps.write()
    .pipe gulp.dest config.paths.styles.dest
    .pipe reload { stream: true }


# Deal with fonts
gulp.task 'fonts', () ->
  return gulp.src config.paths.fonts.src
    .pipe gulp.dest config.paths.fonts.dest


# run CoffeeLint on the scripts
gulp.task 'lint', () ->
  return gulp.src [config.paths.scripts.src, config.paths.app.src]
    .pipe plumber { errorHandler: errorHandler }
    .pipe cached 'linting'
    .pipe coffeelint()
    .pipe coffeelint.reporter()


# Build scripts
gulp.task 'scripts:vendor', () ->
  return gulp.src config.paths.vendor.scripts
    .pipe plumber { errorHandler: errorHandler }
    .pipe sourcemaps.init { loadMaps: true }
    .pipe sourcemaps.write()
    .pipe concat config.vars.vendor_pack_js
    .pipe gulp.dest config.paths.src.scripts


gulp.task 'scripts', ['lint'], () ->
  return gulp.src config.paths.scripts.src
    .pipe plumber { errorHandler: errorHandler }
    .pipe sourcemaps.init { loadMaps: true }
    .pipe coffee { bare: true }
    .pipe sourcemaps.write()
    .pipe gulp.dest config.paths.scripts.dest
    .pipe reload { stream: true }

gulp.task 'scripts:minify', () ->
  return gulp.src [
      "#{config.paths.src.scripts}/#{config.vars.vendor_pack_js}"
      "#{config.paths.scripts.dest}/#{config.vars.site_js}"
    ]
    .pipe plumber { errorHandler: errorHandler }
    .pipe concat config.vars.site_min_js
    .pipe sourcemaps.init { loadMaps: true }
    .pipe uglify()
    .pipe sourcemaps.write()
    .pipe gulp.dest config.paths.scripts.dest



# Use the tasks below for running on the command line
# Default task
gulp.task 'default', () ->
  runSequence(
    [
      'templates'
      'images'
      'styles'
      'fonts'
    ]
    [
      'scripts:vendor'
      'scripts'
    ]
    'scripts:minify'
    'watch'
  )


gulp.task 'build', () ->
  runSequence(
    [
      'templates'
      'images'
      'styles'
      'fonts'
    ]
    [
      'scripts:vendor'
      'scripts'
    ]
    'scripts:minify'
  )


# Watch task
gulp.task 'watch', () ->
  isWatching = true

  # Watch .coffee files everywhere in the app
  gulp.watch [
    'app/**/*.coffee'
    'config/*.coffee'
    config.paths.scripts.src,
    '!gulpfile.coffee'
    '!src/scripts/vendor-pack.js'
  ], [
    'scripts:vendor'
    'scripts'
    'scripts:minify'
  ]

  # Copy templates from the src directory to the public dir
  gulp.watch config.paths.templates.src, ['templates', reload]

  # Copy images from src to public dir
  gulp.watch config.paths.images.src, ['images', reload]

  # Watch .less files
  gulp.watch config.paths.styles.src_all, ['styles', reload]

  # Watch for font files
  gulp.watch config.paths.fonts.src, ['fonts', reload]


gulp.task 'browser-sync', () ->
  browserSync.init
    proxy: 'localhost:3000'
    notify: false
    open: false
    browser: [ 'google chrome' ]
    ui: port: 9001


# Run the server
gulp.task 'nodemon', (cb) ->
  called = false
  nodemon
    script: 'server.coffee'
    ext:    '.coffee'
    ignore: [
      'gulpfile.coffee'
      'gulp/*'
      'bower_components/*'
      'node_modules/*'
    ]
    env: { 'NODE_ENV': 'development' }

  .on 'start', () ->
    logger.info '[nodemon] Server started'

    # Ensure start only gets called once
    if !called
      called = true
      setTimeout () ->
        cb()
      , reloadDelay

  .on 'restart', (files) ->
    logger.info 'Files that changed: ', files if files

    # Reload connected browsers after a slight delay.
    # Tweak the timeout value for restarting browsersync after nodemon
    setTimeout () ->
      reload stream: false
    , reloadDelay

    logger.warn '[nodemon] Server restarted!'


gulp.task 'serve', () ->
  isWatching = true
  runSequence(
    'watch'
    'nodemon'
    'browser-sync'
  )


# Hack to keep build task from hanging
gulp.on 'stop', () ->
  if !isWatching
    process.nextTick () ->
      process.exit 0
