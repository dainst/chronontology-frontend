var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync').create();
var url = require('url');
var proxy = require('proxy-middleware');
var modRewrite = require('connect-modrewrite');
var reload = browserSync.reload;
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var sort = require('gulp-sort');
var addSrc = require('gulp-add-src');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var argv = require('yargs').argv;
var ngHtml2Js = require("gulp-ng-html2js");
var minifyHtml = require("gulp-minify-html");
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');

var pkg = require('./package.json');

var cfg = require('./dev-config.json');

var paths = cfg.paths;

var cssDeps = [
    //paths.lib + 'bootstrap-css-only/css/bootstrap.min.css'
    paths.lib + 'angular-tag-cloud/src/css/ng-tag-cloud.css'
];

var jsDeps = [
    paths.lib + 'file-saver/FileSaver.min.js',
    paths.lib + 'd3/d3.min.js',
    paths.lib + 'leaflet/dist/leaflet.js',
    paths.lib + 'leaflet-fullscreen/dist/Leaflet.fullscreen.min.js',
    paths.lib + 'leaflet.markercluster/dist/leaflet.markercluster.js',
    paths.lib + 'leaflet-draw/dist/leaflet.draw.js',
    paths.lib + 'leaflet-geodesy/leaflet-geodesy.js',
    paths.lib + 'leaflet-search/dist/leaflet-search.min.js',
    paths.lib + 'leaflet-minimap/dist/Control.MiniMap.min.js',
    paths.lib + 'turf/turf.min.js',
    paths.lib + 'tablesort/dist/tablesort.min.js',
    paths.lib + 'angular/angular.min.js',
    paths.lib + 'angular-route/angular-route.min.js',
    paths.lib + 'angular-ui-bootstrap/dist/ui-bootstrap.js',
    paths.lib + 'angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
    paths.lib + 'angular-resource/angular-resource.min.js',
    paths.lib + 'angular-i18n/angular-locale_de-de.js',
    paths.lib + 'angular-ui-scroll/dist/ui-scroll-jqlite.js',
    paths.lib + 'angular-ui-scroll/dist/ui-scroll.js',
    paths.lib + 'angulartics/dist/angulartics.min.js',
    paths.lib + 'angulartics-piwik/dist/angulartics-piwik.min.js',
    paths.lib + 'angular-cookies/angular-cookies.min.js',
    paths.lib + 'angular-md5/angular-md5.js',
    paths.lib + 'idai-components/dist/idai-components.js',
    paths.lib + 'idai-cookie-notice/idai-cookie-notice.js',
    paths.lib + 'angular-tag-cloud/src/ng-tag-cloud.js'
];

var widgets = ['period-info'];

gulp.task('compile-css', function () {

    return gulp.src('scss/app.scss')
        .pipe(sass({
            includePaths: [
                'node_modules/bootstrap-sass/assets/stylesheets/',
                'node_modules/idai-components/src/'
            ],
            precision: 8
        }))
        .pipe(addSrc(cssDeps))
        .pipe(concat(pkg.name + '.css'))
        .pipe(gulp.dest(paths.build + '/css'))
        .pipe(reload({stream: true}));
});

// minify css files in build dir
gulp.task('minify-css', gulp.series('compile-css', function () {

    return gulp.src('dist/css/*.css')
        .pipe(minifyCss())
        .pipe(concat(pkg.name + '.min.css'))
        .pipe(gulp.dest('dist/css'));
}));

// concatenates and minifies all dependecies into a single file in build dir
gulp.task('concat-deps', function () {

    return gulp.src(jsDeps)
        .pipe(sourcemaps.init())
        .pipe(concat(pkg.name + '-deps.js'))
        //.pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js/'));
});

// concatenates all js files in src into a single file in build dir
gulp.task('concat-js', function () {

    return gulp.src(['js/**/*.js'])
        .pipe(sourcemaps.init())
        .pipe(sort())
        .pipe(concat(pkg.name + '.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js/'))
        .pipe(reload({stream: true}));
});

// converts, minifies and concatenates html partials
// to a single js file in build dir
gulp.task('html2js', function () {

    return gulp.src('partials/**/*.html')
        .pipe(minifyHtml())
        .pipe(ngHtml2Js({moduleName: pkg.name + '.templates', prefix: 'partials/'}))
        .pipe(concat(pkg.name + '-tpls.js'))
        .pipe(gulp.dest('dist/js'));
});

// minifies and concatenates js files in build dir
gulp.task('minify-js', gulp.series('concat-js', 'html2js', function () {
    var gutil = require('gulp-util');
    return gulp.src([paths.build + 'js/' + pkg.name + '.js',
        paths.build + 'js/' + pkg.name + '-tpls.js'])
        .pipe(concat(pkg.name + '.js'))
        .pipe(gulp.dest(paths.build + 'js'))
        .pipe(uglify())
        .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
        .pipe(concat(pkg.name + '.min.js'))
        .pipe(gulp.dest(paths.build + 'js'));
}));

// converts html partials to js files so they can be concatenated
gulp.task('html2js-widgets', function (done) {

    widgets.forEach(function(widget) {
        gulp.src('js/widgets/' + widget + '/*.html', { base: 'js/widgets/'})
            .pipe(minifyHtml())
            .pipe(ngHtml2Js({
                moduleName: pkg.name + '.widgets.' + widget,
                prefix: 'widgets/',
                extension: '.tpl.js'
            }))
            .pipe(gulp.dest(paths.build + 'js/widgets'));
    });
    done();
});

// minifies and concatenates js files in build dir
gulp.task('concat-widgets', function () {

    widgets.forEach(function(widget) {
        gulp.src([
                'dist/js/widgets/' + widget + '/*.js',
                'js/widgets/' + widget + '/*.js'
            ])
            .pipe(concat('widgets/' + widget + '.js'))
            .pipe(gulp.dest('dist/js'));
    });
    return gulp.src([
            paths.lib + 'angular/angular.min.js',
            'dist/js/widgets/*.js'
        ])
        .pipe(concat(pkg.name + '-widgets.js'))
        .pipe(gulp.dest('dist/js'))
});

gulp.task('copy-fonts', function () {

    var bsFontPath = paths.lib + 'bootstrap-sass/assets/fonts/';
    return gulp.src(bsFontPath + '**/*', {base: bsFontPath})
        .pipe(gulp.dest(paths.build + '/fonts'));
});

gulp.task('copy-imgs', function () {

    return gulp.src('img/**/*', {base: 'img'})
        .pipe(gulp.dest(paths.build + '/img'));
});

gulp.task('copy-partials', function () {

    return gulp.src('partials/**/*', {base: 'partials'})
        .pipe(gulp.dest(paths.build + '/partials'));
});

// copy index.html to dist and set version
gulp.task('copy-index', function () {

    var buildNo = "SNAPSHOT";
    if (argv.build) buildNo = argv.build;
    var versionString = pkg.version + " (build #" + buildNo + ")";
    return gulp.src(['index.html'])
        .pipe(replace(/version="[^"]*"/g, 'version="v' + versionString + '"'))
        .pipe(replace(/build=BUILD_NO/g, 'build=' + buildNo))
        .pipe(gulp.dest(paths.build));
});

gulp.task('copy-info', function () {
    return gulp.src('info/**/*', {base: 'info'})
        .pipe(gulp.dest(paths.build + '/info'));
});

gulp.task('copy-pages', function () {
    return gulp.src('pages/**/*', {base: 'pages'})
        .pipe(gulp.dest(paths.build + '/pages'));
});

gulp.task('copy-config', function () {
    return gulp.src('config/**/*', {base: 'config'})
        .pipe(gulp.dest(paths.build + '/config'));
});

gulp.task('copy-resources', gulp.series('copy-fonts', 'copy-imgs', 'copy-index',
    'copy-info', 'copy-pages', 'copy-config', 'copy-partials'));

gulp.task('build-app', gulp.series(
    'minify-css',
    'concat-deps',
    'minify-js',
    'copy-resources'
));

gulp.task('build-widgets', gulp.series(
    'html2js-widgets',
    'concat-widgets'
));

gulp.task('build', gulp.series(
    'build-app',
    'build-widgets'
));

gulp.task('clean', function () {
    return del(paths.build + '/**/*');
});

// runs the development server and sets up browser reloading
gulp.task('server', gulp.series('build', function() {

    var dataProxyOptions = url.parse(cfg.dataUri);
    dataProxyOptions.route = '/data';

    var spiProxyOptions = url.parse(cfg.spiUri);
    spiProxyOptions.route = '/spi';

    browserSync.init({
        server: {
            baseDir: 'dist',
            middleware: [
                proxy(dataProxyOptions),
                proxy(spiProxyOptions),
                // rewrite for AngularJS HTML5 mode, redirect all non-file urls to index.html
                modRewrite(['!\\.html|\\.js|\\.svg|\\.css|\\.png|\\.jpg|\\.gif|\\.json|\\.woff2|\\.woff|\\.ttf$ /index.html [L]']),
            ]
        },
        port: 8085
    });

    gulp.watch('scss/**/*.scss', gulp.series('compile-css'));
    gulp.watch('js/**/*.js', gulp.series('minify-js'));
    gulp.watch('pages/**/*.html', gulp.series('copy-pages'));
    gulp.watch('partials/**/*.html', gulp.series('copy-partials'));
    gulp.watch('index.html', gulp.series('copy-index'));

    gulp.watch(['index.html', 'partials/**/*.html', 'js/**/*.js'], reload);
}));

gulp.task('default', function () {
    runSequence('clean', 'build');
});
