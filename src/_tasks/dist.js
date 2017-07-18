"use strict";

const _ = require('lodash');
const async = require('async');
const gulp = require('gulp');
const fs = require('fs');
const del = require('del');
const path = require('path');
const ejs = require('gulp-ejs');
const gulpif = require('gulp-if');
const less = require('gulp-less');
const util = require(path.join(__dirname, './lib/util'));
const uglify = require('gulp-uglify');
const useref = require('gulp-useref');
const lazyImageCSS = require('gulp-lazyimagecss');  // 自动为图片样式添加 宽/高/background-size 属性
const minifyCSS = require('gulp-cssnano');
const imagemin = require('weflow-imagemin');
const tmtsprite = require('gulp-tmtsprite');   // 雪碧图合并
const pngquant = require('imagemin-pngquant');
const ejshelper = require('tmt-ejs-helper');
const postcss = require('gulp-postcss');  // CSS 预处理
const postcssPxtorem = require('postcss-pxtorem'); // 转换 px 为 rem
const postcssAutoprefixer = require('autoprefixer');
const posthtml = require('gulp-posthtml');
const posthtmlPx2rem = require('posthtml-px2rem');
const RevAll = require('weflow-rev-all');   // reversion
const revDel = require('gulp-rev-delete-original');
const sass = require('gulp-sass');

//svg转换用到的组件
const rename = require('gulp-rename');
const svgmin = require('gulp-svgmin');
const svgInline = require('gulp-svg-inline');
const replace = require('gulp-replace');
const parseSVG = require(path.join(__dirname, './common/parseSVG'));
const svgToPng = require(path.join(__dirname, './common/svgToPng'));
const svgSymbol = require('gulp-svg-sprite');

//es6
const babel = require('gulp-babel');

const Common = require(path.join(__dirname, '../common'));

let webp = require(path.join(__dirname, './common/webp'));
let changed = require(path.join(__dirname, './common/changed'))();

function dist(projectPath, log, callback) {

    let projectConfigPath = path.join(projectPath, 'weflow.config.json');
    let config = null;

    if (Common.fileExist(projectConfigPath)) {
        config = Common.requireUncached(projectConfigPath);
    } else {
        config = Common.requireUncached(path.join(__dirname, '../../weflow.config.json'));
    }

    let lazyDir = config.lazyDir || ['../slice'];
    let outputPath = config.outputPath || '/';

    let postcssOption = [];

    if (config.supportREM) {
        postcssOption = [
            postcssAutoprefixer({browsers: ['last 9 versions']}),
            postcssPxtorem({
                root_value: '20', // 基准值 html{ font-zise: 20px; }
                prop_white_list: [], // 对所有 px 值生效
                minPixelValue: 2 // 忽略 1px 值
            })
        ]
    } else {
        postcssOption = [
            postcssAutoprefixer({browsers: ['last 9 versions']})
        ]
    }

    let paths = {
        src: {
            dir: path.join(projectPath, './src'),
            img: path.join(projectPath, './src/img/**/*.{JPG,jpg,png,gif,svg}'),
            slice: path.join(projectPath, './src/slice/**/*.png'),
            js: path.join(projectPath, './src/js/**/*.js'),
            media: path.join(projectPath, './src/media/**/*'),
            less: path.join(projectPath, './src/css/style-*.less'),
            sass: path.join(projectPath, './src/css/style-*.scss'),
            html: [path.join(projectPath, './src/html/**/*.html'), path.join(projectPath, '!./src/html/_*/**.html')],
            htmlAll: path.join(projectPath, './src/html/**/*'),
            svg: path.join(projectPath, './src/svg/**/*.svg')
        },
        tmp: {
            dir: path.join(projectPath, './tmp'),
            dirAll: path.join(projectPath, './tmp/**/*'),
            css: path.join(projectPath, './tmp/css'),
            cssAll: path.join(projectPath, './tmp/css/style-*.css'),
            img: path.join(projectPath, './tmp/img'),
            html: path.join(projectPath, `./tmp${outputPath}`),
            js: path.join(projectPath, './tmp/js'),
            sprite: path.join(projectPath, './tmp/sprite'),
            spriteAll: path.join(projectPath, './tmp/sprite/**/*'),
            svg: path.join(projectPath, './tmp/svg'),
            symboltemp: path.join(projectPath, './tmp/symboltemp/'),
            symbol: path.join(projectPath, './tmp/symbolsvg')
        },
        dist: {
            dir: path.join(projectPath, './dist'),
            css: path.join(projectPath, './dist/css'),
            img: path.join(projectPath, './dist/img'),
            svg: path.join(projectPath, './dist/svg'),
            html: path.join(projectPath, `./dist${outputPath}`),
            sprite: path.join(projectPath, './dist/sprite')
        }
    };

    // 清除 dist 目录
    function delDist(cb) {
        del(paths.dist.dir, {force: true}).then(function () {
            cb();
        })
    }

    // 清除 svg 过渡目录
    function delSVG(cb) {
        del(paths.tmp.symboltemp, {force: true}).then(function () {
            cb();
        })
    }

    function condition(file) {
        return path.extname(file.path) === '.png';
    }

    //编译 less
    function compileLess(cb) {
        gulp.src(paths.src.less)
            .pipe(less({relativeUrls: true}))
            .on('error', function (error) {
                console.log(error.message);
                log(error.message);
            })
            .pipe(lazyImageCSS({imagePath: lazyDir, SVGGracefulDegradation:config.SVGGracefulDegradation}))
            .pipe(tmtsprite({margin: 4}))
            .pipe(gulpif(condition, gulp.dest(paths.tmp.sprite), gulp.dest(paths.tmp.css)))
            .on('data', function () {
            })
            .on('end', function () {
                console.log('compileLess success.');
                log('compileLess success.');
                cb && cb();
            })
    }

    //编译 sass
    function compileSass(cb) {
        gulp.src(paths.src.sass)
            .pipe(sass())
            .on('error', function (error) {
                console.log(error.message);
                log(error.message);
            })
            .pipe(lazyImageCSS({imagePath: lazyDir, SVGGracefulDegradation:config.SVGGracefulDegradation}))
            .pipe(tmtsprite({margin: 4}))
            .pipe(gulpif(condition, gulp.dest(paths.tmp.sprite), gulp.dest(paths.tmp.css)))
            .on('data', function () {
            })
            .on('end', function () {
                console.log('compileSass success.');
                log('compileSass success.');
                cb && cb();
            })
    }

    //自动补全
    function compileAutoprefixer(cb) {
        gulp.src(paths.tmp.cssAll)
            .pipe(svgInline({
                maxImageSize: 10*1024*1024,
                extensions: [/.svg/ig],
            }))
            .pipe(postcss(postcssOption))
            .pipe(gulp.dest(paths.tmp.css))
            .on('end', function () {
                console.log('compileAutoprefixer success.');
                log('compileAutoprefixer success.');
                cb && cb();
            });
    }

    //CSS 压缩
    function miniCSS(cb) {
        gulp.src(paths.tmp.cssAll)
            .pipe(minifyCSS({
                safe: true,
                reduceTransforms: false,
                advanced: false,
                compatibility: 'ie7',
                keepSpecialComments: 0
            }))
            .pipe(gulp.dest(paths.tmp.css))
            .on('end', function () {
                console.log('miniCSS success.');
                log('miniCSS success.');
                cb && cb();
            });
    }

    //图片压缩
    function imageminImg(cb) {
        gulp.src(paths.src.img)
            .pipe(imagemin({
                use: [pngquant()]
            }))
            .pipe(gulp.dest(paths.tmp.img))
            .on('end', function () {
                console.log('imageminImg success.');
                log('imageminImg success.');
                cb && cb();
            });
    }

    //雪碧图压缩
    function imageminSprite(cb) {
        gulp.src(paths.tmp.spriteAll)
            .pipe(imagemin({
                use: [pngquant()]
            }))
            .pipe(gulp.dest(paths.tmp.sprite))
            .on('end', function () {
                console.log('imageminSprite success.');
                log('imageminSprite success.');
                cb && cb();
            });
    }

    //复制媒体文件
    function copyMedia(cb) {
        gulp.src(paths.src.media, {base: paths.src.dir})
            .pipe(gulp.dest(paths.dist.dir))
            .on('end', function () {
                console.log('copyMedia success.');
                log('copyMedia success.');
                cb && cb();
            });
    }

    //编译 JS
    function compileJs(cb) {

        return gulp.src(paths.src.js)
            .pipe(babel({
                presets: ["babel-preset-es2015", "babel-preset-stage-2"].map(require.resolve)
            }))
            .pipe(uglify())
            .pipe(gulp.dest(paths.tmp.js))
            .on('end', function () {
                console.log('compileJs success.');
                log('compileJs success.');
                cb && cb();
            });
    }

    //JS 压缩
    // function uglifyJs(cb) {
    //     gulp.src(paths.src.js, {base: paths.src.dir})
    //         .pipe(uglify())
    //         .pipe(gulp.dest(paths.tmp.dir))
    //         .on('end', function () {
    //             console.log('uglifyJs success.');
    //             log('uglifyJs success.');
    //             cb && cb();
    //         });
    // }

    //html 编译
    function compileHtml(cb) {
        gulp.src(paths.src.html)
            .pipe(ejs(ejshelper()))
            .pipe(gulpif(
                config.supportREM,
                posthtml(
                    posthtmlPx2rem({
                        rootValue: 20,
                        minPixelValue: 2
                    })
                ))
            )
            .pipe(parseSVG({devPath:projectPath + '/tmp',SVGGracefulDegradation:config.SVGGracefulDegradation}))
            .pipe(gulp.dest(paths.tmp.html))
            .pipe(useref())
            .pipe(gulp.dest(paths.tmp.html))
            .on('end', function () {
                console.log('compileHtml success.');
                log('compileHtml success.');
                cb && cb();
            });
    }

    //新文件名(md5)
    function reversion(cb) {
        var revAll = new RevAll({
            fileNameManifest: 'manifest.json',
            dontRenameFile: ['.html', '.php']
        });

        if (config['reversion']) {
            gulp.src(paths.tmp.dirAll)
                .pipe(revAll.revision())
                .pipe(gulp.dest(paths.tmp.dir))
                .pipe(revDel({
                    exclude: /(.html|.htm)$/
                }))
                .pipe(revAll.manifestFile())
                .pipe(gulp.dest(paths.tmp.dir))
                .on('end', function () {
                    console.log('reversion success.');
                    log('reversion success.');
                    cb && cb();
                })
        } else {
            cb && cb();
        }
    }

    //webp 编译
    function supportWebp(cb) {
        if (config['supportWebp']) {
            webp(projectPath, cb);
        } else {
            cb();
        }
    }

    // 清除 tmp 目录
    function delTmp(cb) {
        del(paths.tmp.dir, {force: true}).then(function (delpath) {
            cb();
        })
    }

    function miniSVG(cb) {
        if(config.SVGGracefulDegradation){
            return gulp.src(paths.src.svg)
                .pipe(svgmin({
                    plugins: [{
                        convertPathData: true
                    }, {
                        removeTitle: true
                    }, {
                        mergePaths: false
                    }, {
                        removeUnknownsAndDefaults: false
                    }, {
                        removeDoctype: true
                    }, {
                        removeComments: true
                    }, {
                        cleanupNumericValues: {
                            floatPrecision: 2
                        }
                    }, {
                        convertColors: {
                            names2hex: true,
                            rgb2hex: true
                        }
                    }]
                }))
                .pipe(svgToPng())
                .pipe(gulp.dest(paths.tmp.svg))
                .on('end', function () {
                    console.log('miniSVG success.');
                    log('miniSVG success.');
                    cb && cb();
                })
        }else{
            return gulp.src(paths.src.svg)
                .pipe(svgmin({
                    plugins: [{
                        convertPathData: true
                    }, {
                        removeTitle: true
                    }, {
                        mergePaths: false
                    }, {
                        removeUnknownsAndDefaults: false
                    }, {
                        removeDoctype: true
                    }, {
                        removeComments: true
                    }, {
                        cleanupNumericValues: {
                            floatPrecision: 2
                        }
                    }, {
                        convertColors: {
                            names2hex: true,
                            rgb2hex: true
                        }
                    }]
                }))
                .pipe(gulp.dest(paths.tmp.svg))
                .on('end', function () {
                    console.log('miniSVG success.');
                    log('miniSVG success.');
                    cb && cb();
                })
        }
    }

    function svgSymbols(cb){
        return gulp.src(paths.tmp.symboltemp + '**/*.svg')
            .pipe(svgSymbol({
                mode:{
                    inline:true,
                    symbol:true
                },
                shape:{
                    id:{
                        generator:function(id){
                            var ids = id.replace(/.svg/ig,'');
                            return ids;
                        }
                    }
                }
            }))
            .pipe(rename(function (path){
                path.dirname = './';
                path.basename = 'symbol';
            }))
            .pipe(gulp.dest(paths.tmp.symbol))
            .on('end', function () {
                console.log('svgSymbols success.');
                log('svgSymbols success.');
                cb && cb();
            })
    }

    function findChanged(cb) {

        if (!config['supportChanged']) {
            gulp.src(paths.tmp.dirAll, {base: paths.tmp.dir})
                .pipe(gulp.dest(paths.dist.dir))
                .on('end', function () {
                    delTmp(cb);
                })
        } else {
            var diff = changed(paths.tmp.dir);
            var tmpSrc = [];

            if (!_.isEmpty(diff)) {

                //如果有reversion
                if (config['reversion'] && config['reversion']['available']) {
                    var keys = _.keys(diff);

                    //先取得 reversion 生成的manifest.json
                    var reversionManifest = require(path.join(paths.tmp.dir, './manifest.json'));

                    if (reversionManifest) {
                        reversionManifest = _.invert(reversionManifest);

                        reversionManifest = _.pick(reversionManifest, keys);

                        reversionManifest = _.invert(reversionManifest);

                        _.forEach(reversionManifest, function (item, index) {
                            tmpSrc.push(path.join(paths.tmp.dir, item));
                            console.log('[changed:] ' + util.colors.blue(index));
                        });

                        //将新的 manifest.json 保存
                        fs.writeFileSync(path.join(paths.tmp.dir, './manifest.json'), JSON.stringify(reversionManifest));

                        tmpSrc.push(path.join(paths.tmp.dir, './manifest.json'));
                    }
                } else {
                    _.forEach(diff, function (item, index) {
                        tmpSrc.push(path.join(paths.tmp.dir, index));
                        console.log('[changed:] ' + util.colors.blue(index));
                    });
                }

                gulp.src(tmpSrc, {base: paths.tmp.dir})
                    .pipe(gulp.dest(paths.dist.dir))
                    .on('end', function () {
                        delTmp(cb);
                    })

            } else {
                console.log('Nothing changed!');
                delTmp(cb);
            }
        }

    }

    async.series([
        /**
         * 先删除目标目录,保证最新
         * @param next
         */
            function (next) {
            delDist(next);
        },
        function (next) {
            compileLess(next);
        },
        function (next) {
            compileSass(next);
        },
        function (next) {
            compileAutoprefixer(next);
        },
        function (next) {
            miniCSS(next);
        },
        function (next) {
            async.parallel([
                function (cb) {
                    imageminImg(cb);
                },
                function (cb) {
                    imageminSprite(cb);
                },
                function (cb) {
                    copyMedia(cb);
                },
                function (cb) {
                    compileJs(cb);
                },
                function (cb) {
                    miniSVG(cb);
                }
            ], function (error) {
                if (error) {
                    throw new Error(error);
                }

                next();
            })
        },
        function (next) {
            compileHtml(next);
        },
        function(next){
            svgSymbols(next);
        },
        function (next) {
            reversion(next);
        },
        function (next) {
            supportWebp(next);
        },
        function (next) {
            delSVG(next);
        },
        function (next) {
            findChanged(next);
        }
    ], function (error) {
        if (error) {
            throw new Error(error);
        }

        callback && callback();
    });

}

module.exports = dist;
