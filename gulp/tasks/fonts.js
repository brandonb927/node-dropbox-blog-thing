// Fonts
module.exports = function styles (gulp, config) {
  return function () {
    return gulp.src(config.paths.vendor.fonts)
               .pipe(gulp.dest(config.paths.fonts.dest));
  }
};
