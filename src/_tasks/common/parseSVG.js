/**
 * Created by doubleluo
 */
var gulp = require('gulp');
var replace = require('gulp-replace');
var through = require('through2');
var fs = require('fs');
var path = require('path');
var File = require('vinyl');
var util = require(path.join(__dirname, '../lib/util'));
var cheerio = require('cheerio');

module.exports = function (options) {

    var mkdirs = function(dirpath, callback) {
        fs.exists(dirpath, function(exists) {
            if(exists) {
                callback(dirpath);
            } else {
                mkdirs(path.dirname(dirpath), function(){
                    fs.mkdir(dirpath, callback);
                });
            }
        });
    }

    var mkdirone = false;
    var marchRegInline = /<img.*?src=['"].*?(\w+)\.svg\?i['"].*?>/gi;
    var marchRegSybmol = /<img.*?src=['"].*?(\w+)\.svg\?s['"].*?>/gi;
    var marchRegBase = /<img.*?src=['"].*?(\w+)\.svg['"].*?>/gi;
    var src = [],id,style,className,data,width,height,newcontent,$;

    function getBase(){
        id = $.attr('id');
        style = $.attr('style');
        className = $.attr('class');
        data = fs.readFileSync(path.join(options.devPath+'/img', src[0])).toString();
        width =  data.match(/<svg(.*?)width=["|'](.*?)(px)?["|']/)[2];
        height =  data.match(/<svg(.*?)height=["|'](.*?)(px)?["|']/)[2];
        fileName = src[0].substr(src[0].lastIndexOf('/')+1,src[0].indexOf('.svg')-7);
        newcontent = [];
    }

    function getAttr(){
        if(id){
            newcontent.push(' id="'+ id +'"');
        }
        if(style){
            newcontent.push(' style="'+ style +'"');
        }
        if(className){
            newcontent.push(' class="'+ className +'"');
        }
    }

    function inline(contents){
        getAttr();
        data = data.replace('<svg','<svg width="'+ width +'" height="'+ height +'"'+newcontent.join(''));
        if(options.SVGGracefulDegradation){
            data = data.replace('>','><image width="'+ width +'" height="'+ height +'" src="'+src[0].replace('.svg','.png')+'" />');
        }
        return data;
    }
    function sybmol(contents){
        var newFile = path.join(options.devPath + '/symboltemp/', fileName);
        fs.writeFile(newFile, data, {encoding: 'utf8'});
        newcontent.push('<svg width="'+ width +'" height="'+ height +'" xmlns="http://www.w3.org/2000/svg"');
        getAttr();
        newcontent.push('>');
        if(options.SVGGracefulDegradation){
            newcontent.push('<image src="'+src[0].replace('.svg','.png')+'"',' />');
        }
        newcontent.push('<use xlink:href="'+ ((options && options.symbolBaseUrl)||'../symbolsvg/symbol.svg')+ '#' + fileName.replace('.svg','') +'"/>');
        newcontent.push('</svg>');
        return newcontent.join('');
    }
    function base(contents){
        newcontent.push('<svg width="'+ width +'" height="'+ height +'" xmlns="http://www.w3.org/2000/svg"');
        getAttr();
        newcontent.push('>');
        if(options.SVGGracefulDegradation){
            newcontent.push('<image width="'+ width +'" height="'+ height +'" src="'+src[0].replace('.svg','.png')+'" xlink:href="'+src[0]+'">');
        }else{
            newcontent.push('<image width="'+ width +'" height="'+ height +'" xlink:href="'+src[0]+'">');
        }
        newcontent.push('</svg>');
        return newcontent.join('');
    }

    function run(regData,contents,marchReg){
        if(regData){
            for(var i = 0;i<regData.length;i++){
                var replaceData = '';
                $ = cheerio(regData[i]);
                src = $.attr('src').split('?');
                if(src[0].indexOf('.svg')>-1){
                    getBase();
                    if(src[1] == 'i'){
                        replaceData = inline(contents);
                    }else if(src[1] == 's'){
                        replaceData = sybmol(contents);
                    }else{
                        replaceData = base(contents);
                    }
                }

                contents = contents.replace(regData[i], replaceData);

            }
        }
        return contents;
    }

    return through.obj(function (file, enc, cb) {

        var _this = this;


        if (file.isNull()) {
            cb(null, file);
        } else {
            if (util.fileExist(file.path)) {
                var contents = file.contents.toString();
                var regData;
                if(options.onlyInline){
                    regData = contents.match(marchRegInline);
                    contents = run(regData,contents,marchRegInline);
                }else{
                    if(!mkdirone){
                        mkdirone = true;
                        fs.exists(options.devPath +'/symboltemp', function(exists) {
                            if(!exists){
                                fs.mkdir(options.devPath +'/symboltemp');
                                regData = contents.match(marchRegInline);
                                contents = run(regData,contents,marchRegInline);
                                regData = contents.match(marchRegSybmol);
                                contents = run(regData,contents,marchRegSybmol);
                                regData = contents.match(marchRegBase);
                                contents = run(regData,contents,marchRegBase);
                            }
                        });
                    }else{
                        regData = contents.match(marchRegInline);
                        contents = run(regData,contents,marchRegInline);
                        regData = contents.match(marchRegSybmol);
                        contents = run(regData,contents,marchRegSybmol);
                        regData = contents.match(marchRegBase);
                        contents = run(regData,contents,marchRegBase);
                    }

                }


                _this.push(new File({
                    base: file.base,
                    path: file.path,
                    contents: new Buffer(contents)
                }));
                cb(null);
            } else {
                cb(null, file);
            }
        }
    });
}
