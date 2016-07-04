"use strict";
const path = require('path');
const del = require('del');
const ejs = require('gulp-ejs');
const ejshelper = require('tmt-ejs-helper');
const async = require('async');
const gulp = require('gulp');
const less = require('gulp-less');
const lazyImageCSS = require('gulp-lazyimagecss');  // 自动为图片样式添加 宽/高/background-size 属性
const postcss = require('gulp-postcss');   // CSS 预处理
const posthtml = require('gulp-posthtml');  // HTML 预处理
const sass = require('gulp-sass');
const Common = require(path.join(__dirname, '../common.js'));

function dev(projectPath, log, callback) {

    const bs = require('browser-sync').create();  // 自动刷新浏览器

    let projectConfigPath = path.join(projectPath, 'weflow.config.json');
    let config = null;

    if (Common.fileExist(projectConfigPath)) {
        config = Common.requireUncached(projectConfigPath);
    } else {
        config = Common.requireUncached(path.join(__dirname, '../../weflow.config.json'));
    }

    let lazyDir = config.lazyDir || ['../slice'];

    if (Common.PLATFORM === 'win32') {
        for (let i = 0; i < lazyDir.length; i++) {
            lazyDir[i] = lazyDir[i].replace(/\//g, '\\');
        }
    }


    let paths = {
        src: {
            dir: path.join(projectPath, './src'),
            img: path.join(projectPath, './src/img/**/*.{JPG,jpg,png,gif}'),
            slice: path.join(projectPath, './src/slice/**/*.png'),
            js: path.join(projectPath, './src/js/**/*.js'),
            media: path.join(projectPath, './src/media/**/*'),
            less: [path.join(projectPath, './src/css/style-*.less'), path.join(projectPath, './src/css/**/*.css')],
            lessAll: path.join(projectPath, './src/css/**/*.less'),
            sass: path.join(projectPath, './src/css/style-*.scss'),
            sassAll: path.join(projectPath, './src/css/**/*.scss'),
            html: [path.join(projectPath, './src/html/**/*.html'), path.join(projectPath, '!./src/html/_*/**/**.html')],
            htmlAll: path.join(projectPath, './src/html/**/*.html')
        },
        dev: {
            dir: path.join(projectPath, './dev'),
            css: path.join(projectPath, './dev/css'),
            html: path.join(projectPath, './dev/html')
        }
    };

    // 复制操作
    function copyHandler(type, file, cb) {
        if (typeof file === 'function') {
            cb = file;
            file = paths['src'][type];
        }

        gulp.src(file, {base: paths.src.dir})
            .pipe(gulp.dest(paths.dev.dir))
            .on('end', function () {
                console.log(`copy ${type} success.`);
                log(`copy ${type} success.`);
                cb ? cb() : reloadHandler();
            });
    }

    // 自动刷新
    function reloadHandler() {
        config.livereload && bs.reload();
    }

    function compileLess(cb) {
        gulp.src(paths.src.less)
            .pipe(less({relativeUrls: true}))
            .on('error', function (error) {
                console.log(error.message);
            })
            .pipe(lazyImageCSS({imagePath: lazyDir}))
            .pipe(gulp.dest(paths.dev.css))
            .on('data', function () {
            })
            .on('end', function () {
                if (cb) {
                    console.log('compile Less success.');
                    log('compile Less success.');
                    cb();
                } else {
                    reloadHandler();
                }
            })
    }

    //编译 sass
    function compileSass(cb) {
        gulp.src(paths.src.sass)
            .pipe(sass())
            .on('error', function(error){
                console.log(error.message);
                log(error.message);
            })
            .pipe(lazyImageCSS({imagePath: lazyDir}))
            .pipe(gulp.dest(paths.dev.css))
            .on('data', function () {
            })
            .on('end', function () {
                if (cb) {
                    console.log('compile Sass success.');
                    log('compile Sass success.');
                    cb();
                } else {
                    reloadHandler();
                }
            })
    }

    //编译 html
    function compileHtml(cb) {
        gulp.src(paths.src.html)
            .pipe(ejs(ejshelper()).on('error', function (error) {
                console.log(error.message);
                log(error.message);
            }))
            .pipe(gulp.dest(paths.dev.html))
            .on('data', function () {
            })
            .on('end', function () {
                if (cb) {
                    console.log('compile Html success.');
                    log('compile Html success.');
                    cb();
                } else {
                    reloadHandler();
                }
            })
    }

//监听文件
    function watch(cb) {
        var watcher = gulp.watch([
                paths.src.img,
                paths.src.slice,
                paths.src.js,
                paths.src.media,
                paths.src.lessAll,
                paths.src.sassAll,
                paths.src.htmlAll
            ],
            {ignored: /[\/\\]\./}
        );

        watcher
            .on('change', function (file) {
                console.log(file + ' has been changed');
                log(file + ' has been changed');
                watchHandler('changed', file);
            })
            .on('add', function (file) {
                console.log(file + ' has been added');
                log(file + ' has been added');
                watchHandler('add', file);
            })
            .on('unlink', function (file) {
                console.log(file + ' is deleted');
                log(file + ' is deleted');
                watchHandler('removed', file);
            });

        console.log('watching...');
        log('watching...');

        cb();
    }

    function watchHandler(type, file) {

        let target = file.split('src')[1].match(/[\/\\](\w+)[\/\\]/);

        if (target.length && target[1]) {
            target = target[1];
        }

        switch (target) {
            case 'img':
                if (type === 'removed') {
                    let tmp = file.replace(/src/, 'dev');
                    del([tmp], {force: true}).then(function () {
                        reloadHandler();
                    });
                } else {
                    copyHandler('img', file);
                }
                break;

            case 'slice':
                if (type === 'removed') {
                    var tmp = file.replace(/src/, 'dev');
                    del([tmp], {force: true});
                } else {
                    copyHandler('slice', file);
                }
                break;

            case 'js':
                if (type === 'removed') {
                    var tmp = file.replace(/src/, 'dev');
                    del([tmp], {force: true});
                } else {
                    copyHandler('js', file);
                }
                break;

            case 'media':
                if (type === 'removed') {
                    var tmp = file.replace(/src/, 'dev');
                    del([tmp], {force: true});
                } else {
                    copyHandler('media', file);
                }
                break;

            case 'css':

                var ext = path.extname(file);

                if (type === 'removed') {
                    var tmp = file.replace(/src/, 'dev').replace('.less', '.css');
                    del([tmp], {force: true});
                } else {
                    if (ext === '.less') {
                        compileLess();
                    } else {
                        compileSass();
                    }
                }

                break;

            case 'html':
                if (type === 'removed') {
                    let tmp = file.replace(/src/, 'dev');
                    del([tmp], {force: true}).then(function () {
                    });
                } else {
                    compileHtml();
                }

                break;
        }

    };

    //启动 livereload
    function startServer(cb) {
        bs.init({
            server: {
                baseDir: paths.dev.dir,
                directory: true
            },
            startPath: "/html",
            port: 8080,
            reloadDelay: 0,
            timestamps: true,
            notify: {      //自定制livereload 提醒条
                styles: [
                    "margin: 0",
                    "padding: 5px",
                    "position: fixed",
                    "font-size: 10px",
                    "z-index: 9999",
                    "bottom: 0px",
                    "right: 0px",
                    "border-radius: 0",
                    "border-top-left-radius: 5px",
                    "background-color: rgba(60,197,31,0.5)",
                    "color: white",
                    "text-align: center"
                ]
            }
        });

        cb();
    }

    async.series([
        /**
         * 先删除目标目录,保证最新
         * @param next
         */
            function (next) {
            del(paths.dev.dir, {force: true}).then(function () {
                next();
            })
        },
        /**
         * 一些可以同步的操作
         * 复制 img, slice, js, media
         * 编译LESS
         * 编译HTML
         * @param next
         */
            function (next) {
            async.parallel([
                function (cb) {
                    copyHandler('img', cb);
                },
                function (cb) {
                    copyHandler('slice', cb);
                },
                function (cb) {
                    copyHandler('js', cb);
                },
                function (cb) {
                    copyHandler('media', cb);
                },
                function (cb) {
                    compileLess(cb);
                },
                function (cb) {
                    compileSass(cb);
                },
                function (cb) {
                    compileHtml(cb);
                }
            ], function (error) {
                if (error) {
                    throw new Error(error);
                }

                next();
            })
        },
        function (next) {
            watch(next);
        },
        function (next) {
            startServer(next);
        }
    ], function (error) {
        if (error) {
            throw new Error(error);
        }

        callback && callback(bs);
    });
}

module.exports = dev;


