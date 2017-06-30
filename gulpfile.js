var gulp = require('gulp');
var gulpif = require('gulp-if');
var clean = require('gulp-clean');
var useref = require('gulp-useref');
var sequence = require('gulp-sequence');
var cleanCSS = require('gulp-clean-css');
var closureCompiler = require('google-closure-compiler').gulp();

gulp.task('clean', function() {
  return gulp.src('./dist', { read: false })
    .pipe(clean());
});

gulp.task('css', function() {
  return gulp.src('.src/styles/*.css')
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(gulp.dest('./dist/styles/'));
});

gulp.task('js', function() {
  return gulp.src('./src/scripts/*.js')
    .pipe(closureCompiler({
      compilation_level: 'ADVANCED',
      warning_level: 'VERBOSE',
      language_in: 'ECMASCRIPT6_STRICT',
      language_out: 'ECMASCRIPT5_STRICT',
      // output_wrapper: '(function(){\n%output%\n}).call(this)',
      js_output_file: 'main.min.js'
    }))
    .pipe(gulp.dest('./dist/scripts/'));
});

gulp.task('combine', function() {
  return gulp.src('./src/*.html')
    .pipe(useref())
    .pipe(gulpif('*.css', (cleanCSS({ compatibility: 'ie8' }))))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('compile', function() {
  return gulp.src('./src/scripts/*.js')
    .pipe(closureCompiler({
      compilation_level: 'ADVANCED',
      warning_level: 'VERBOSE',
      language_in: 'ECMASCRIPT6_STRICT',
      language_out: 'ECMASCRIPT5_STRICT',
      js_output_file: 'main.js'
    }))
    .pipe(gulp.dest('./dist/scripts/'));;
});

gulp.task('build', sequence('combine', 'compile'));

gulp.task('watch', function() {
  gulp.watch('./src/**/*.*', function() {
    sequence('clean', 'build');
  });
});

gulp.task('default', sequence('clean', 'watch', 'build'));