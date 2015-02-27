var plumber = require('gulp-plumber');
var jshint  = require('gulp-jshint');
var cached  = require('gulp-cached');

// Hint ALL THE JS
module.exports = function hint (gulp, config) {
  return function () {
    return gulp.src(config.paths.scripts.src)
               .pipe(plumber({errorHandler: config.errorHandler}))
               .pipe(cached('hinting'))
               .pipe(jshint())
               .pipe(jshint.reporter('jshint-stylish'));
  }
};
