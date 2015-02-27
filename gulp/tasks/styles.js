var autoprefixer  = require('gulp-autoprefixer');
var concat        = require('gulp-concat');
var less          = require('gulp-less');
var plumber       = require('gulp-plumber');
var sourcemaps    = require('gulp-sourcemaps');
var pixrem        = require('gulp-pixrem');
var cssmin        = require('gulp-cssmin');

var browserSync   = require('browser-sync');
var reload        = browserSync.reload;

// Compile CSS styles
module.exports = function styles (gulp, config) {
  // The process goes alitle somethin like dis:
  //  - run the less through
  //    -- less to css
  //    -- autoprefixer for vendor prefxing, etc.
  //    -- pixrem to generate pixel values from rem values alongside eachother
  //  - concatenate everything into one file
  //  - reload browsersync so the new css can be injected into the page
  return function () {
    return gulp.src(config.paths.styles.src)
               .pipe(plumber({errorHandler: config.errorHandler}))
               .pipe(sourcemaps.init())
                 .pipe(less())
                 .pipe(autoprefixer())
                 .pipe(pixrem())
                 .pipe(cssmin())
                 .pipe(concat(config.vars.site_min_css))
               .pipe(sourcemaps.write())
               .pipe(gulp.dest(config.paths.styles.dest))
               .pipe(reload({stream:true}));
  }
};
