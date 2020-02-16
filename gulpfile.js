const
	fs = require('fs'),
	path = require('path'),
	https = require('https');
	gulp = require('gulp'),
	sass = require('gulp-sass'),
	browserSync = require('browser-sync'); // require('browser-sync').create();
/*
const cssnano = require('gulp-cssnano');
const plumber = require('gulp-plumber');
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const plumber = require('gulp-plumber');
const concat = require('gulp-concat');
const uglify = require('gulp-uglifyjs');
import rename from 'gulp-rename';
import cleanCSS from 'gulp-clean-css';
*/
get = (url, cb) => https.get(url, d => {
	let body = '';
	d.on('data', dd => (body += dd)).on('end', () => cb(body));
});
gulp.task('css', function(done) {
    gulp.src("src/scss/**/*.scss")
		// .pipe(plumber())
		.pipe(sass())
		// .pipe(cssnano())
		// .pipe(cleanCSS())
		// .pipe(rename({ basename: 'main', suffix: '.min' }))
        .pipe(gulp.dest("dist/css"))
        .pipe(browserSync.stream()); //.pipe(browserSync.reload({ stream: true }))
    done();
});
gulp.task('js', function(done) {
    gulp.src("src/js/**/*.js")
		// .pipe(uglify())
		// .pipe(concat('main.min.js'))
        .pipe(gulp.dest("dist/js"))
        .pipe(browserSync.stream());
    done();
});
gulp.task('html', function(done) {
    browserSync.init({
        server: "dist/"
    });
    gulp.watch("src/scss/**/*.scss", gulp.series('css'));
    gulp.watch("src/js/**/*.js", gulp.series('js'));
    gulp.watch("dist/*.html").on('change', () => {
      browserSync.reload();
      done();
    });
    done();
});
gulp.task('colors', function(done) {
	let fn = path.join(__dirname, '/dist/json/colors.json');
	if (fs.existsSync(fn))
		done();
	else
		get('https://material.io/resources/color/', body => {
			get('https://material.io/resources/color/scripts/'+body.split('src="scripts/')[2].split('"')[0], body => {
				let r = JSON.parse(('{shades:'+body.split('={shades:')[1].split(';')[0]).replace(/(shades|palettes|name|hexes)/g, '"$1"')),
					ar = [].concat([[''].concat(r.shades)], r.palettes.map(v => [v.name].concat(v.hexes)));
				fs.writeFile(fn, JSON.stringify(ar), err => {
					if (err)
						return console.log(err);
					done();
				});
			});
		});
});
gulp.task('icons', function(done) {
	let fn = path.join(__dirname, '/dist/json/icons.json');
	if (fs.existsSync(fn))
		done();
	else
		get('https://fonts.google.com/metadata/icons', body => {
			let icons = {};
			JSON.parse(body.slice(5)).icons.forEach(icon => {
				if (!icons[icon.categories[0]])
					icons[icon.categories[0]] = [];
				icons[icon.categories[0]].push(icon.name);
			});
			fs.writeFile(fn, JSON.stringify(icons), err => {
				if (err)
					return console.log(err);
				done();
			});
		});
});
gulp.task('default', gulp.series('colors', 'icons', 'css', 'js', 'html' ));
