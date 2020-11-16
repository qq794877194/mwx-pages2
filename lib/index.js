const {src, dest, watch, series, parallel} = require('gulp');
const load = require('gulp-load-plugins');
const del = require('del');
const browserSync = require('browser-sync');

const bs = browserSync.create();
const plugins = load();
const cwd = process.cwd();

let config = {
  build: {
    src: 'src',
    dist: 'dist',
    temp: '.temp',
    public: 'public',
    paths: {
      css: 'assets/css/*.scss',
      js: 'assets/js/*.js',
      html: '*.html',
      img: 'assets/img/**'
    }
  }
}

try{
  const loadConfig = require(`${cwd}/pages.config.js`);
  config = Object.assign({},config, loadConfig);
}catch (e) {}

const clean = () => del([config.build.dist,config.build.temp]);

const style = () => {
  return src(config.build.paths.css,{ base: config.build.src, cwd: config.build.src})
    .pipe(plugins.sass({ outputStyle: 'expanded'}))
    .pipe(dest(config.build.temp));
}

const script = () => {
  return src(config.build.paths.js, { base: config.build.src, cwd: config.build.src})
    .pipe(plugins.babel({presets: [require('@babel/preset-env')]}))
    .pipe(dest(config.build.temp))
}

const page = () => {
  return src(config.build.paths.html,{ base: config.build.src, cwd: config.build.src})
    .pipe(plugins.ejs({title: 'test title'}))
    .pipe(dest(config.build.temp));
}

const image = () => {
  return src(config.build.paths.img,{ base: config.build.src, cwd: config.build.src})
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}
const extra = () => {
  return src('**',{base: config.build.public, cwd: config.build.public})
    .pipe(dest(config.build.dist))
}
const serve = () => {
  watch(config.build.paths.css,{cwd: config.build.src},style);
  watch(config.build.paths.js,{cwd: config.build.src},script);
  watch(config.build.paths.html,{cwd: config.build.src},page);

  watch([config.build.src + + '/' + config.build.paths.img,config.build.public + '/**'],bs.reload);

  bs.init({
    notify: false,
    port: 3001,
    open: true, // 自动打开浏览器
    files: config.build.dist,
    server: {
      baseDir: [config.build.temp,config.build.src,config.build.public],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src(config.build.paths.html, {base: config.build.temp, cwd: config.build.temp})
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.']}))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest(config.build.dist));
}
const compile = parallel(style,script,page);
const build = series(clean,parallel(series(compile,useref),image,extra));
const develop = series(compile,serve);

module.exports = {
  build,
  develop,
}

