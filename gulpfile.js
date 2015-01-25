// Configuration paths and data - change to suit your needs
var config      = require('./gulp/config.json')

// Init Gulp and lazyload the gulp plugins
var gulp        = require('gulp');
var plugins     = require('gulp-load-plugins')(config.plugins);

// Load non-gulp plugins seperately
var del         = require('del');
var nodemon     = require('gulp-nodemon');
var pngcrush    = require('imagemin-pngcrush');


// Styles tasks
gulp.task('vendor_fonts', function () {
  return gulp.src(config.paths.vendor.fonts)
             .pipe(gulp.dest(config.paths.fonts.dest));
});

gulp.task('styles', ['vendor_fonts'], function () {
  return gulp.src(config.paths.styles.src)
             .pipe(plugins.sourcemaps.init())
             .pipe(plugins.less())
             .pipe(plugins.autoprefixer())
             .pipe(plugins.cssmin())
             .pipe(plugins.rename({ suffix: '.min' }))
             .pipe(plugins.sourcemaps.write())
             .pipe(gulp.dest(config.paths.styles.dest));
});

// hinting task
gulp.task('hint', function () {
  return gulp.src(config.paths.scripts.src)
             .pipe(plugins.jshint('.jshintrc'))
             .pipe(plugins.jshint.reporter('jshint-stylish'));
});

// Scripts tasks
gulp.task('vendor_scripts', function () {
  return gulp.src(config.paths.vendor.scripts)
             .pipe(plugins.concat(config.vars.vendor_pack))
             .pipe(gulp.dest(config.paths.src.scripts));
});

gulp.task('scripts', ['vendor_scripts'], function () {
  return gulp.src([
               config.paths.src.scripts + '/' + config.vars.vendor_pack,
               config.paths.src.scripts + '/' + config.vars.site_js
             ])
             .pipe(plugins.sourcemaps.init({loadMaps:true}))
             .pipe(plugins.concat(config.vars.site_pack))
             .pipe(plugins.uglify())
             .pipe(plugins.rename({ suffix: '.min' }))
             .pipe(plugins.sourcemaps.write())
             .pipe(gulp.dest(config.paths.scripts.dest));
});

// Images task
gulp.task('images', function () {
  return gulp.src(config.paths.images.src)
             .pipe(
               plugins.imagemin({
                 progressive: true,
                 svgoPlugins: [{ removeViewBox: false }],
                 use: [ pngcrush() ]
               })
             )
             .pipe(gulp.dest(config.paths.images.dest));
});

// View templates task
gulp.task('templates', function () {
  return gulp.src(config.paths.templates.src)
             .pipe(gulp.dest(config.paths.templates.dest));
});

// Clean the assets folder
gulp.task('clean', function () {
  return gulp.src('public/{images,assets,views}', { read: false })
             .pipe(del());
});

// Use the tasks below for running on the command line
// Default task
gulp.task('default', function () {
  gulp.start(['templates', 'images', 'styles', 'hint', 'scripts', 'watch']);
});

// Run assets build
gulp.task('build', function () {
  return gulp.start(['templates', 'images', 'styles', 'scripts']);
});


// Watch task
gulp.task('watch', function () {
  // Watch .js files everywhere in the app
  gulp.watch([
    'app/**/*.js',
    'config/*.js',
    'src/scripts/site.js',
    '!gulpfile.js',
    '!src/scripts/vendor-pack.js',
  ], ['hint', 'scripts']);

  // Copy templates from the src directory to the public dir
  gulp.watch(config.paths.templates.src, ['templates']);

  // Copy images from src to public dir
  gulp.watch(config.paths.images.src, ['images']);

  // Watch .less files
  gulp.watch(config.paths.styles.src, ['styles']);
});

// Run the server
gulp.task('server', ['watch'], function () {
  // gulp.start(['hint', 'templates', 'images', 'styles', 'scripts'])
  nodemon({
    script: 'server.js',
    ext: 'js',
    env: { 'NODE_ENV': 'development' },
    // env: { 'NODE_ENV': 'production' },
    ignore: [
      'node_modules/**',
      'gulpfile.js'
    ]
  })
  .on('start', ['watch'])
  .on('change', ['watch'])
  .on('error', process.exit.bind(process, 1))
  .on('restart', function () {
    console.log('Server restarted!');
  });
});
