var gulp          = require('gulp');
var autoprefixer  = require('gulp-autoprefixer');
var concat        = require('gulp-concat');
var imagemin      = require('gulp-imagemin');
var jshint        = require('gulp-jshint');
var less          = require('gulp-less');
var minifycss     = require('gulp-minify-css');
var nodemon       = require('gulp-nodemon');
var rename        = require('gulp-rename');
var clean         = require('gulp-rimraf');
var sourcemaps    = require('gulp-sourcemaps');
var uglify        = require('gulp-uglify');
var pngcrush      = require('imagemin-pngcrush');
var stylish       = require('jshint-stylish');


// Styles tasks
gulp.task('vendor_css', function () {
  return gulp.src([
      'bower_components/highlightjs/styles/tomorrow-night-eighties.css',
      'bower_components/fontawesome/css/font-awesome.css'
    ])
    .pipe(gulp.dest('public/assets/css'));
});

gulp.task('vendor_fonts', ['vendor_css'], function () {
  return gulp.src([
      'bower_components/fontawesome/fonts/*'
    ])
    .pipe(gulp.dest('public/assets/fonts'));
});

gulp.task('styles_compile', ['vendor_fonts'], function () {
  return gulp.src('src/styles/site.less')
    // .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(autoprefixer())
    // .pipe(sourcemaps.write())
    .pipe(gulp.dest('public/assets/css'));
});

gulp.task('styles', ['styles_compile'], function () {
  return gulp.src([
      'public/assets/css/*.css'
    ])
    .pipe(concat('site-pack.css'))
    .pipe(minifycss())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('public/assets/css'));
});

// Linting task
gulp.task('lint', function () {
  return gulp.src([
      'app/**/*.js',
      'src/scripts/site.js',
    ])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter(stylish));
});

// Scripts tasks
gulp.task('vendor_scripts', function () {
  return gulp.src([
      'bower_components/jquery/dist/jquery.js',
      'bower_components/fastclick/lib/fastclick.js',
      'bower_components/highlightjs/lib/highlight.pack.js',
      'bower_components/jquery-unveil/jquery.unveil.js',
      'bower_components/smoothstate/jquery.smoothstate.js'
    ])
    .pipe(concat('vendor-pack.js'))
    .pipe(gulp.dest('src/scripts'));
});

gulp.task('scripts', ['vendor_scripts'], function () {
  return gulp.src([
      'src/scripts/vendor-pack.js',
      'src/scripts/site.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('site-pack.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('public/assets/js'))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('public/assets/js'));
});

// Images task
gulp.task('images', function () {
  return gulp.src('src/images/**/*')
    .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        use: [ pngcrush() ]
    }))
    .pipe(gulp.dest('public/images'));
});

// View templates task
gulp.task('templates', function () {
  return gulp.src('src/views/**/*.hbs')
    .pipe(gulp.dest('public/views'));
});

// Clean the assets folder
gulp.task('clean', function () {
  return gulp.src([
    'public/images',
    'public/assets',
    'public/views'
  ], { read: false })
    .pipe(clean());
});

// Use the tasks below for running on the command line
// Default task
gulp.task('default', function () {
  gulp.start(['lint', 'templates', 'images', 'styles', 'scripts', 'watch']);
});

// Clean the public folder
gulp.task('clean_build', ['clean'], function () {
  return gulp.start(['lint', 'templates', 'images', 'styles', 'scripts']);
});

// Run assets build
gulp.task('build', function () {
  return gulp.start(['templates', 'images', 'styles', 'scripts']);
});

// Watch task
// gulp.task('watch', ['clean_build'], function () {
gulp.task('watch', function () {
  // Watch .js files everywhere in the app
  gulp.watch([
    'gulpfile.js',
    'app/**/*.js',
    'config/*.js',
    'src/scripts/site.js',
    '!src/scripts/vendor-pack.js',
    // 'test/**/*.js'
  ], ['lint', 'scripts']);

  // Copy templates from the src directory to the public dir
  gulp.watch(['src/views/*.hbs'], ['templates']);

  // Copy images from src to public dir
  gulp.watch(['src/images/**/*.{png,gif,jpg,jpeg,ico}'], ['images']);

  // Watch .less files
  gulp.watch(['src/styles/**/*.less'], ['styles']);
});

// Run the server
gulp.task('server', function () {
  // gulp.start(['lint', 'templates', 'images', 'styles', 'scripts'])
  nodemon({
    script: 'server.js',
    ext: 'js',
    env: { 'NODE_ENV': 'development' },
    // env: { 'NODE_ENV': 'production' },
    ignore: [
      'node_modules/**'
    ]
  })
  .on('start', ['watch'])
  .on('change', ['watch'])
  .on('error', process.exit.bind(process, 1))
  .on('restart', function () {
    console.log('restarted!');
  });
});
