"use strict"

const path = require('path');
const async = require('async');
const gulp = require('gulp');
const _ = require('lodash');
const del = require('del');
const sftp = require('gulp-sftp');
const util = require('./lib/util');
const Common = require(path.join(__dirname, '../common'));

module.exports = function (projectPath, log, callback) {

    let projectConfigPath = path.join(projectPath, 'weflow.config.json');
    let config = null;

    if (Common.fileExist(projectConfigPath)) {
        config = Common.requireUncached(projectConfigPath);
    } else {
        config = Common.requireUncached(path.join(__dirname, '../../weflow.config.json'));
    }

    let configSFTP = config.ftp;

    if (configSFTP.host === '' || configSFTP.pass === '' || configSFTP.user === '') {
        callback('sftp config');
        return;
    }

    let projectName = path.basename(projectPath);

    //清除目标目录
    function delDist(cb) {
        del(path.join(projectPath, './dist'), {force: true}).then(function () {
            cb && cb();
        })
    }

    function remoteSftp(cb) {
        let remotePath = config['ftp']['remotePath'] || "";
        let sftpConfig = _.extend(config['ftp'], {
            remotePath: path.join(remotePath, projectName)
        });
        let distPath = config['ftp']['includeHtml'] ? path.join(projectPath, './dist/**/*') : [path.join(projectPath, './dist/**/*'), path.join(projectPath, '!./dist/html/**/*.html')];

        gulp.src(distPath)
            .pipe(sftp(sftpConfig))
            .on('finish', function(){
                console.log('sftp success.');
                log('sftp success.');
                cb && cb();
            })
            .on('end', function () {
                console.log('sftp success.');
                log('sftp success.');
                cb && cb();
            });
    }

    async.series([
        function (next) {
            remoteSftp(next);
        }
    ], function (err) {
        if (err) {
            throw new Error(err);
        }

        delDist();

        callback && callback();
    });
};
