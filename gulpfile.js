// Get the task from the gulp/tasks folder
function getTask (task, cb) {
  return require('./gulp/tasks/' + task)(gulp, config, cb);
}

// Configuration paths and data - change to suit your needs
var logger      = require('./config/logger');
var config      = require('./gulp/config.json');
var del         = require('del');
var runSequence = require('run-sequence');
var gulp        = require('gulp');
var gutil       = require('gulp-util');
var nodemon     = require('nodemon');
var browserSync = require('browser-sync');
var reload      = browserSync.reload;

var isWatching  = false;
var reloadDelay = 2000;


// Error handler
// Add the error handler to the config
config.errorHandler = function (err) {
  logger.error(gutil.colors.red('✗') + ' Error: ' + err.message);
  this.emit('end');
};

// View templates task
gulp.task('templates', function () {
  return gulp.src(config.paths.templates.src)
             .pipe(gulp.dest(config.paths.templates.dest));
});

// Clean the assets folder
gulp.task('clean', function () {
  return gulp.src('public/{images,assets,views}', { read: false }).pipe(del());
});

// Individual tasks
gulp.task('images', getTask('images'));
gulp.task('styles', getTask('styles'));
gulp.task('fonts', getTask('fonts'));
gulp.task('hint', getTask('hint'));
gulp.task('scripts', ['hint'], getTask('scripts'));

// Use the tasks below for running on the command line
// Default task
gulp.task('default', function () {
  gulp.start([
    'templates',
    'images',
    'styles',
    'fonts',
    'hint',
    'scripts',
    'watch'
  ]);
});

// Watch task
gulp.task('watch', function () {
  isWatching = true;

  // Watch .js files everywhere in the app
  gulp.watch([
    'app/**/*.js',
    'config/*.js',
    'src/scripts/site.js',
    '!gulpfile.js',
    '!src/scripts/vendor-pack.js',
  ], ['hint', 'scripts']);

  // Copy templates from the src directory to the public dir
  gulp.watch(config.paths.templates.src, ['templates', reload]);

  // Copy images from src to public dir
  gulp.watch(config.paths.images.src, ['images', reload]);

  // Watch .less files
  gulp.watch(config.paths.styles.src_all, ['styles', reload]);

  // Watch for font files
  gulp.watch(config.paths.fonts.src, ['fonts', reload]);
});

gulp.task('browser-sync', function () {
  browserSync.init({
    proxy:       'localhost:3000',
    notify:      false,
    open:        false,
    browser:     ['google chrome'],
    ui: {
      port: 9001
    }
  });
});

// Run the server
gulp.task('nodemon', function (cb) {
  var called = false;
  nodemon({
    script: 'server.js',
    ext: '.js',
    ignore: [
      'gulpfile.js',
      'gulp/*',
      'bower_components/*',
      'node_modules/*'
    ],
    env: { 'NODE_ENV': 'development' }
    // env: { 'NODE_ENV': 'production' }
  })
  .on('start', function () {
    logger.info('[nodemon] Server started');
    // Ensure start only gets called once
    if (!called) {
      called = true;
      setTimeout(function() {
        cb();
      }, reloadDelay);
    }
  })
  .on('restart', function (files) {
    if (files) {
      logger.info('Files that changed: ', files);
    }

    // Reload connected browsers after a slight delay.
    // Tweak the timeout value for restarting browsersync after nodemon
    setTimeout(function () {
      reload({stream:false});
    }, reloadDelay);

    logger.warn('[nodemon] Server restarted!');
  });
});

gulp.task('serve', function () {
  isWatching = true;
  runSequence(
    'watch',
    'nodemon',
    'browser-sync'
  );
});

// Hack to keep build task from hanging
gulp.on('stop', function () {
  if (!isWatching) {
    process.nextTick(function () {
      process.exit(0);
    });
  }
});
