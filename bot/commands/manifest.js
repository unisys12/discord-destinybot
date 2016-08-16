'use strict'

var co = require('co');
var util = require('util');
var logger = require('winston');
var fs = require('fs');

function exec(cmd) {

    return co(function *() {
        var bot = cmd.bot;
        var msg = cmd.msg;

        var busyMsg = yield bot.sendMessage(msg, "Pulling latest Destiny Manifest"+"** :mag:");
        var manifest = yield cmd.destiny.manifest();

        var worldContents = JSON.stringify(manifest);
        // Returns underfined. I am doing something stupid, I just know it!
        console.log(worldContents.version);

    });

}

module.exports = {
    desc: 'Get latest Destiny Manifest file',
    name: 'manifest',
    alias: ['man'],
    exec: exec
}