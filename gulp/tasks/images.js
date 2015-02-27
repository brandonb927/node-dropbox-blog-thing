var plumber     = require('gulp-plumber');
var imagemin    = require('gulp-imagemin');
var pngcrush    = require('imagemin-pngcrush');

var browserSync = require('browser-sync');
var reload      = browserSync.reload;

// Compresses images
module.exports = function images (gulp, config) {
  return function () {
    return gulp.src(config.paths.images.src)
               .pipe(plumber({errorHandler: config.errorHandler}))
               .pipe(
                 imagemin({
                   optimizationLevel: 5,
                   progressive: true,
                   interlaced: true,
                   use: [pngcrush()]
                 })
               )
               .pipe(gulp.dest(config.paths.images.dest))
               .pipe(reload({stream:true}));
  }
};
