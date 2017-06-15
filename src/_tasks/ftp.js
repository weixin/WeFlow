"use strict"

const path = require('path');
const async = require('async');
const gulp = require('gulp');
const _ = require('lodash');
const del = require('del');
const ftp = require('gulp-ftp');
const gutil = require('gulp-util');
const Common = require(path.join(__dirname, '../common'));

module.exports = function (projectPath, log, callback) {

  let distDir = path.join(projectPath, './dist');

  let projectConfigPath = path.join(projectPath, 'weflow.config.json');
  let config = null;

  if (Common.fileExist(projectConfigPath)) {
    config = Common.requireUncached(projectConfigPath);
  } else {
    config = Common.requireUncached(path.join(__dirname, '../../weflow.config.json'));
  }

  let configFTP = config.ftp;

  if (configFTP.host === '' || configFTP.pass === '' || configFTP.user === '') {
    callback('ftp config');
    return;
  }

  let projectName = path.basename(projectPath);

  //清除目标目录
  function delDist(cb) {
    del(path.join(projectPath, './dist'), {force: true}).then(function () {
      cb && cb();
    })
  }

  function remoteFtp(cb) {
    let remotePath = config['ftp']['remotePath'] || "";
    let ftpConfig = _.extend(config['ftp'], {
      remotePath: path.join(remotePath, projectName)
    });
    let distPath = config['ftp']['includeHtml'] ? path.join(projectPath, './dist/**/*') : [path.join(projectPath, './dist/**/*'), path.join(projectPath, '!./dist/html/**/*.html')];

    gulp.src(distPath)
      .pipe(ftp(ftpConfig))
      .pipe(gutil.noop())
      .pipe(gulp.dest(distDir))
      .on('end', function () {
        console.log('ftp success.');
        log('ftp success.');
        cb && cb();
      })
  }

  async.series([
    function (next) {
      remoteFtp(next);
    }
  ], function (err) {
    if (err) {
      throw new Error(err);
    }

    delDist();

    callback && callback();
  });
};
