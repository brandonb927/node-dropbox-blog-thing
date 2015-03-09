# Configuration paths and data - change to suit your needs
logger      = require('./config/logger')
config      = require('./gulp/config.json')
del         = require('del')
runSequence = require('run-sequence')
gulp        = require('gulp')
gutil       = require('gulp-util')
nodemon     = require('nodemon')
browserSync = require('browser-sync')
reload      = browserSync.reload
isWatching  = false
reloadDelay = 2000

# Error handler
# Add the error handler to the config
# Get the task from the gulp/tasks folder
config.errorHandler = (err) ->
  logger.error "#{gutil.colors.red('✗')} Error: #{err.message}"
  @emit 'end'

getTask = (task, cb) ->
  require('./gulp/tasks/' + task)(gulp, config, cb)


# View templates task
gulp.task('templates', () ->
  gulp.src(config.paths.templates.src).pipe gulp.dest(config.paths.templates.dest)
)

# Clean the assets folder
gulp.task('clean', () ->
  gulp.src('public/{images,assets,views}', read: false).pipe del()
)

# Individual tasks
gulp.task('images', getTask('images'))
gulp.task('styles', getTask('styles'))
gulp.task('fonts', getTask('fonts'))
gulp.task('hint', getTask('hint'))
gulp.task('scripts', [ 'hint' ], getTask('scripts'))

# Use the tasks below for running on the command line
# Default task
gulp.task('default', () ->
  gulp.start [
    'templates'
    'images'
    'styles'
    'fonts'
    'hint'
    'scripts'
    'watch'
  ]
)

# Watch task
gulp.task('watch', () ->
  isWatching = true

  # Watch .coffee files everywhere in the app
  gulp.watch([
    'app/**/*.coffee'
    'config/*.coffee'
    'src/scripts/site.coffee'
    '!gulpfile.coffee'
    '!src/scripts/vendor-pack.js'
  ], [
    'hint'
    'scripts'
  ])

  # Copy templates from the src directory to the public dir
  gulp.watch(config.paths.templates.src, ['templates', reload])

  # Copy images from src to public dir
  gulp.watch(config.paths.images.src, ['images', reload])

  # Watch .less files
  gulp.watch(config.paths.styles.src_all, ['styles', reload])

  # Watch for font files
  gulp.watch(config.paths.fonts.src, ['fonts', reload])
)

gulp.task('browser-sync', () ->
  browserSync.init
    proxy: 'localhost:3000'
    notify: false
    open: false
    browser: [ 'google chrome' ]
    ui: port: 9001
)

# Run the server
gulp.task('nodemon', (cb) ->
  called = false
  nodemon(
    script: 'server.coffee'
    ext: '.coffee'
    ignore: [
      'gulpfile.coffee'
      'gulp/*'
      'bower_components/*'
      'node_modules/*'
    ]
    env: {'NODE_ENV': 'development'}
  )
  .on('start', () ->
    logger.info('[nodemon] Server started')

    # Ensure start only gets called once
    if !called
      called = true
      setTimeout () ->
        cb()
      , reloadDelay
  )
  .on('restart', (files) ->
      logger.info('Files that changed: ', files) if files

      # Reload connected browsers after a slight delay.
      # Tweak the timeout value for restarting browsersync after nodemon
      setTimeout () ->
        reload stream: false
      , reloadDelay

      logger.warn('[nodemon] Server restarted!')
  )
)

gulp.task('serve', () ->
  isWatching = true
  runSequence(
    'watch'
    'nodemon'
    'browser-sync'
  )
)

# Hack to keep build task from hanging
gulp.on('stop', () ->
  if !isWatching
    process.nextTick () ->
      process.exit 0
)
