var browserify  = require('browserify');
var concat      = require('gulp-concat');
var plumber     = require('gulp-plumber');
var sourcemaps  = require('gulp-sourcemaps');
var uglify      = require('gulp-uglify');
var gutil       = require('gulp-util');
var buffer      = require('vinyl-buffer');
var source      = require('vinyl-source-stream')
var transform   = require('vinyl-transform');
var watchify    = require('watchify');

var browserSync = require('browser-sync');
var reload      = browserSync.reload;

// Browserify the JS
//
// This is alittle more complex than it should probably be...
module.exports = function scripts (gulp, config) {
  return function () {
    function rebundle () {
      return this.bundle()
                 .on('end', gutil.log.bind(gutil, gutil.colors.green('✓') + ' Rebuilding JS...'))
                 .on('error', gutil.log.bind(gutil, gutil.colors.red('✗') + ' Error rebuilding JS...'))
                 .pipe(source(config.vars.site_js))
                 .pipe(buffer())
                 .pipe(gulp.dest(config.paths.scripts.dest))
                 .pipe(sourcemaps.init({loadMaps: true}))
                   .pipe(uglify())
                 .pipe(sourcemaps.write())
                 .pipe(concat(config.vars.site_min_js))
                 .pipe(gulp.dest(config.paths.scripts.dest))
                 .pipe(reload({stream:true}));
    };

    var watchified = transform(function (filename) {
      var b = browserify(filename, {
        debug: true,
        cache: {}, packageCache: {}, fullPaths: true // Required Watchify args
      });

      var bundler = watchify(b);

      bundler.on('update', rebundle.bind(bundler));

      return bundler.bundle();
    });

    gulp.src(config.paths.vendor.scripts)
        .pipe(concat(config.vars.vendor_pack))
        .pipe(gulp.dest(config.paths.src.scripts));

    return gulp.src(config.paths.scripts.src)
               .pipe(plumber({errorHandler: config.errorHandler}))
               .pipe(watchified)
               .pipe(gulp.dest(config.paths.scripts.dest));
  }
};
