'use strict';
//const fs = require ('fs');
//const videos = ['videos/a.mp4', 'videos/b.mp4', 'videos/c.mp4'];

String.prototype.format = function () {
    var a = this;
    for (var k in arguments) {
        a = a.replace(new RegExp("\\{" + k + "\\}", 'g'), arguments[k]);
    }
    return a
}

exports.generateName = function() {
    let date = new Date(Date.now());
    let first = "{0}-{1}-{2} ".format(date.getDate(), date.getMonth(), date.getFullYear());
    let second = "{0}:{1}:{2}".format(date.getHours(), date.getMinutes(), date.getSeconds());

    return (first + second);
}
/*
let player = spawn('vlc', ['-L', '--one-instance', 'videos/a.mp4']);
player.stderr.pipe(fs.createWriteStream(generateName() + '.txt'));
//generateName();*/