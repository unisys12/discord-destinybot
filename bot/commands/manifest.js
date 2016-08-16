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
        var mobileWorldContents = JSON.parse(worldContents);
                
        var res = (yield get(mobileWorldContents.mobileWorldContentPaths.en))[0];
        
        if (res.statusCode !== 200) {
            logger.error("failed to download mobileWorldContent: %s\n", res.statusCode);
            throw new Error("download failure: "+res.statusMessage);
        } else {
            var zip = res.body;
            // unzip the DB
        }

    });

}

module.exports = {
    desc: 'Get latest Destiny Manifest file',
    name: 'manifest',
    alias: ['man'],
    exec: exec
}