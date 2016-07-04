"use strict";

const path = require('path');
const fs = require('fs');

class Common {
	constructor() {
		this.NAME = 'WeFlow';
		this.WORKSPACE = `${this.NAME}_workspace`;
		this.CONFIGNAME = 'weflow.config.json';
		this.CONFIGPATH = path.join(__dirname, '../', this.CONFIGNAME);
		this.PLATFORM = process.platform;
		this.DEFAULT_PATH = this.PLATFORM === 'win32' ? 'desktop' : 'home';
		this.TEMPLAGE_PROJECT = path.resolve(path.join(__dirname, '../templates/project.zip'));
		this.TEMPLAGE_EXAMPLE = path.resolve(path.join(__dirname, '../templates/example.zip'));
		this.EXAMPLE_NAME = 'WeFlow-example';
	};

	requireUncached(module) {
		delete require.cache[require.resolve(module)];
		return require(module);
	}

	fileExist(filePath) {
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
	};

	alert(msg, callback) {
		let $box = $('.alert_box');
		if (!$box.length) {
			$('body').append(`<div class="alert_mask">
    <div class="alert_box">
        <div class="alert_top">
            提示
            <div class="option">
                <a id="boxClose" href="javascript:;" class="close"></a>
            </div>
        </div>
        <p class="alert_content"></p>
        <div class="alert_bottom">
            <span id="boxConfirm"  class="about__buttom-list-item">确定</span>
        </div>
    </div>
</div>`);
			$('#boxClose').on('click', function () {
				$('.alert_mask').hide();
			});
			$('#boxConfirm').on('click', function () {
				$('.alert_mask').hide();
				callback && callback();
			});
		}

		$('.alert_content').text(msg);
		$('.alert_mask').show();
	};

	dirExist(dirPath) {
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
	};

	getStorage() {
		let storage = window.localStorage;
		if (storage.getItem(this.NAME)) {
			return JSON.parse(storage.getItem(this.NAME));
		} else {
			return false;
		}
	};

	setStorage(storage) {
		localStorage.setItem(this.NAME, JSON.stringify(storage));
	};
}

// Common.NAME = 'WeFlow';
// Common.WORKSPACE = `${Common.NAME}_workspace`;
// Common.CONFIGNAME = 'weflow.config.json';
// Common.CONFIGPATH = path.join(__dirname, '../', Common.CONFIGNAME);
// Common.PLATFORM = process.platform;
// Common.DEFAULT_PATH = Common.PLATFORM === 'win32' ? 'desktop' : 'home';
// Common.TEMPLAGE_PROJECT = path.resolve(path.join(__dirname, '../templates/project.zip'));
// Common.TEMPLAGE_EXAMPLE = path.resolve(path.join(__dirname, '../templates/example.zip'));
// Common.EXAMPLE_NAME = 'WeFlow-example';
// Common.CHECKURL = 'https://raw.githubusercontent.com/weixin/WeFlow/master/package.json';
// Common.DOWNLOADURL = 'https://github.com/weixin/WeFlow/releases';
//
// Common.requireUncached = function (module) {
//     delete require.cache[require.resolve(module)];
//     return require(module);
// }
//
// Common.fileExist = function (filePath) {
//     try {
//         var stat = fs.statSync(filePath);
//         if (stat.isFile()) {
//             return true;
//         } else {
//             return false;
//         }
//     } catch (err) {
//         if (err.code === 'ENOENT') {
//             return false;
//         } else {
//             throw new Error(err);
//         }
//     }
// };
//
// Common.dirExist = function (dirPath) {
//     try {
//         var stat = fs.statSync(dirPath);
//         if (stat.isDirectory()) {
//             return true;
//         } else {
//             return false;
//         }
//     } catch (err) {
//         if (err.code === 'ENOENT') {
//             return false;
//         } else {
//             throw new Error(err);
//         }
//     }
// }
//
// Common.getStorage = function () {
//     let storage = window.localStorage;
//
//     if (storage.getItem(Common.NAME)) {
//         return JSON.parse(storage.getItem(Common.NAME));
//     } else {
//         return false;
//     }
// };
//
// Common.setStorage = function (storage) {
//     localStorage.setItem(Common.NAME, JSON.stringify(storage));
// };
//
// Common.resetStorage = function () {
//     let storage = localStorage.getItem(Common.NAME);
//
//     if (storage) {
//         storage.removeItem(Common.NAME);
//     }
// };

module.exports = new Common;
