#!/usr/bin/env node
var fs = require("fs-extra");
var path = require("path");
var args = process.argv.slice(2);
var argv = require('yargs').argv;  

var exec = require('child_process').execFileSync

var workingDir = path.resolve("./");
var targetDir = argv.t || argv.target;

/**
 * @param tagName {string}
 */
var parseTag = tagName => {
        return {
            tag: tagName,
            file: tagName + ".bundle", 
            date: new Date(tagName.replace(/-pt-/g, '.').replace(/-col-/g, ':').replace('bkp-', ''))
        };
    };


if(args[0] == 'restore'){

    var dir = targetDir || workingDir;
    var files=fs.readdirSync(dir)
        .filter(q => q.startsWith("bkp") && q.endsWith(".bundle"))
        .map(f => path.join(dir, f));

    var parsedTags = files.map(m => m.replace(".bundle", ''))
        .map(parseTag)
        .sort((a, b) => a.date - b.date)

    parsedTags.map(p => {
        console.log("restoring " + p.tag)
        console.log(exec('git', ['pull',  p.file]).toString());
    });
}
else{
    var tags = exec('git', ['tag']).toString().split("\n");

    var parsedTags = tags
        .filter(q => q.startsWith('bkp-'))
        .map(parseTag)
        .sort((a, b) => a.date - b.date);

    var lastTag = parsedTags.reverse()[0];

    var rangeToUse = lastTag != null 
        ? lastTag.tag + '..HEAD'
        : "HEAD"

    if(exec('git', ['log',  rangeToUse]).toString().length > 0)
    {
        //we have commits
        console.log("new commits, updating");

        var d = new Date().toISOString();
        var tag = "bkp-"+ d.replace(/\./g, '-pt-').replace(/:/g, '-col-');

        exec('git', ['tag', tag]);

        console.log("creating bundle " + tag + '.bundle for range '+ rangeToUse);
        exec('git', ['bundle', 'create', tag + '.bundle', rangeToUse]);

        if(targetDir){
            fs.move(tag + '.bundle', targetDir + "/" + tag + '.bundle', err =>{
                if(err)
                    console.log(err);
            });
        }
    }
    else{
        console.log("nothing to do");
    }
}