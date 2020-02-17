const
	fs = require('fs'),
	path = require('path'),
	https = require('https');
	gulp = require('gulp'),
	plumber = require('gulp-plumber'),
	sass = require('gulp-sass'),
	cleanCSS = require('gulp-clean-css'),
	closureCompiler = require('google-closure-compiler').gulp(),
	browserSync = require('browser-sync');

get = (url, cb) => https.get(url, d => {
	let body = '';
	d.on('data', dd => (body += dd)).on('end', () => cb(body));
});
gulp.task('colors', done => {
	let fn = path.join(__dirname, '/dist/json/colors.json'),
		dn = path.dirname(fn);
	if (fs.existsSync(fn))
		done();
	else
		get('https://material.io/resources/color/', body => {
			get('https://material.io/resources/color/scripts/'+body.split('src="scripts/')[2].split('"')[0], body => {
				let r = JSON.parse(('{shades:'+body.split('={shades:')[1].split(';')[0]).replace(/(shades|palettes|name|hexes)/g, '"$1"')),
					ar = [].concat([[''].concat(r.shades)], r.palettes.map(v => [v.name].concat(v.hexes)));
				if (!fs.existsSync(dn))
					fs.mkdirSync(dn, { recursive: true });
				fs.writeFile(fn, JSON.stringify(ar), err => {
					if (err)
						return console.log(err);
					done();
				});
			});
		});
});
gulp.task('icons', done => {
	let fn = path.join(__dirname, '/dist/json/icons.json'),
		dn = path.dirname(fn);
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
			if (!fs.existsSync(dn))
				fs.mkdirSync(dn, { recursive: true });
			fs.writeFile(fn, JSON.stringify(icons), err => {
				if (err)
					return console.log(err);
				done();
			});
		});
});
gulp.task('css', done => {
	gulp.src('src/scss/**/*.scss')
		.pipe(plumber())
		.pipe(sass())
		.pipe(cleanCSS())
		.pipe(gulp.dest('dist/css'))
		.on('end', () => done())
		.pipe(browserSync.stream());
});
gulp.task('js', done => {
	let task = gulp.src([
		'src/js/client.js'
	]).pipe(plumber());
	if (typeof(closureCompiler) != 'undefined')
		task = task.pipe(closureCompiler({
			compilation_level: 'SIMPLE',
			js_output_file: 'client.js'
		}, { platform: ['native', 'java', 'javascript'] }));
	task.pipe(gulp.dest('dist/js')).on('end', () => done()).pipe(browserSync.stream());
});
gulp.task('html', done => {
	let fn = path.join(__dirname, '/dist/json/query.json');
	if (!fs.existsSync(fn))
		fs.writeFile(fn, JSON.stringify([
			{"title":"Neo","img":"https://st.kp.yandex.net/images/film_iphone/iphone360_462851.jpg","value":"Neo"},
			{"title":"Olayinka","img":"https://st.kp.yandex.net/images/film_iphone/iphone360_462851.jpg","value":"Olayinka"},
			{"title":"Jonathan","img":"https://st.kp.yandex.net/images/film_iphone/iphone360_462851.jpg","value":"Jonathan"},
			{"title":"Mezie","img":"https://st.kp.yandex.net/images/film_iphone/iphone360_462851.jpg","value":"Mezie"},
			{"title":"Oreoluwa","img":"https://st.kp.yandex.net/images/film_iphone/iphone360_462851.jpg","value":"Oreoluwa"},
			{"title":"Jordan","img":"https://st.kp.yandex.net/images/film_iphone/iphone360_462851.jpg","value":"Jordan"},
			{"title":"Michelle","img":"https://st.kp.yandex.net/images/film_iphone/iphone360_462851.jpg","value":"Michelle"},
			{"title":"Jessica","img":"https://st.kp.yandex.net/images/film_iphone/iphone360_462851.jpg","value":"Jessica"}
		]), err => {});
	browserSync.init({ server: './' });
	gulp.watch('src/scss/**/*.scss', gulp.series('css'));
	gulp.watch('src/js/**/*.js', gulp.series('js'));
	gulp.watch('*.html').on('change', () => {
		browserSync.reload();
		done();
	});
	done();
});
gulp.task('default', gulp.series('colors', 'icons', 'css', 'js', 'html'));
