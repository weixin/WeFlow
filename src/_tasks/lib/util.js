"use strict";

const path = require('path');
const util = require('gulp-util');
let config = require(path.join(__dirname, '../../../weflow.config.json'));


var tmt_util = {
    log: function (task_name) {
        util.log.apply(util, arguments);
    },
    task_log: function (task_name) {
        this.log(util.colors.magenta(task_name), util.colors.green.bold('√'));
    },
    colors: util.colors,
    dirExist: function (dirPath) {
        try {
            var stat = fs.statSync(dirPath);
            if (stat.isDirectory()) {
                return true;
            } else {
                return false;
            }
        } catch (err) {
            if (err.code === 'ENOENT') {
                return false;
            } else {
                throw new Error(err);
            }
        }
    },
    fileExist: function (filePath) {
        try {
            var stat = fs.statSync(filePath);
            if (stat.isFile()) {
                return true;
            } else {
                return false;
            }
        } catch (err) {
            if (err.code === 'ENOENT') {
                return false;
            } else {
                throw new Error(err);
            }
        }
    }
};

module.exports = tmt_util;
