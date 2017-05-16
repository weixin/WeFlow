/**
 * Created by doubleluo on 15/5/3.
 */
var gulp = require('gulp');
var replace = require('gulp-replace');
var through = require('through2');
var fs = require('fs');
var path = require('path');
var util = require(path.join(__dirname, '../lib/util'));
var File = require('vinyl');
var svg_to_png = require('svg-to-png');

module.exports = function (options) {
	return through.obj(function (file, enc, cb) {

        var _this = this;
        

        if (file.isNull()) {
            cb(null, file);
        } else {
            if (util.fileExist(file.path)) {
            	svg_to_png.convert(file.path, file.path.substr(0,file.path.lastIndexOf('/')).replace('/src/','/dist/'));

                _this.push(new File({
                    base: file.base,
                    path: file.path,
                    contents: file.contents
                }));
                cb(null);
            } else {
                cb(null, file);
            }
        }
    });
}