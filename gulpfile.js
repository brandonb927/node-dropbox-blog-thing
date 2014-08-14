var gulp          = require('gulp');
var less          = require('gulp-less');
var autoprefixer  = require('gulp-autoprefixer');
var jshint        = require('gulp-jshint');
var stylish       = require('jshint-stylish');
var clean         = require('gulp-rimraf');
var minifycss     = require('gulp-minify-css');
var concat        = require('gulp-concat');
var uglify        = require('gulp-uglify');
var nodemon       = require('gulp-nodemon');
var rename        = require('gulp-rename');


// Styles task
gulp.task('styles', function () {
  return gulp.src('src/styles/site.less')
    .pipe(less())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('public/assets/css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('public/assets/css'));
});

// Linting task
gulp.task('lint', function () {
  return gulp.src('app/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter(stylish));
});

// Scripts task
gulp.task('scripts', function () {
  return gulp.src('src/scripts/**/*.js')
    .pipe(concat('site.js'))
    .pipe(gulp.dest('public/assets/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('public/assets/js'));
});

// Images task
gulp.task('images', function () {
  return gulp.src('src/images/**/*')
    // .pipe(clean())
    .pipe(gulp.dest('public/images'));
});

// View templates task
gulp.task('templates', function () {
  return gulp.src('src/views/**/*.hbs')
    .pipe(gulp.dest('public/views'));
});

// Clean the assets folder
gulp.task('clean', function () {
  return gulp.src('public', { read: false }).pipe(clean());
});

// Default task
gulp.task('default', ['clean'], function () {
  gulp.start('styles', 'lint', 'scripts');
});

// Watch task
gulp.task('watch', function () {
  // Watch .js files everywhere in the app
  gulp.watch([
    'gulpfile.js',
    'app/**/*.js',
    'config/**/*.js',
    // 'src/scripts/**/*.js',
    // 'test/**/*.js'
  ], ['lint']);

  // Copy templates from the src directory to the public dir
  gulp.watch(['src/views/**/*.hbs'], ['templates']);

  // Copy images from src to public dir
  gulp.watch(['src/images/**/*.{png,gif,jpg,jpeg,ico}'], ['images']);

  // Watch .less files and .js files
  gulp.watch('src/styles/**/*.less', ['styles']);
  gulp.watch('src/scripts/**/*.js', ['scripts']);
});

// Run the server
gulp.task('server', function () {
  nodemon({
    script: 'server.js',
    ext: 'js',
    env: { 'NODE_ENV': 'development' },
    ignore: [
      'node_modules/**'
    ]
  })
  .on('start', ['watch'])
  .on('change', ['watch'])
  .on('restart', function () {
    console.log('restarted!');
  });
});
