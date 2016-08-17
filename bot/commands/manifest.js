'use strict'

var co = require('co');
var util = require('util');
var logger = require('winston');
var thunkify = require('thunkify');
var request = require('request');
var get = thunkify(request.get); 
var fs = require('fs');


function exec(cmd) {

    return co(function *() {
        var bot = cmd.bot;
        var msg = cmd.msg;

        var busyMsg = yield bot.sendMessage(msg, "Pulling latest Destiny Manifest"+"** :mag:");
        var manifest = yield cmd.destiny.manifest();

        var worldContents = JSON.stringify(manifest);
        var mobileWorldContents = JSON.parse(worldContents);
                
        var res = (yield get("http://www.bungie.net" + mobileWorldContents.mobileWorldContentPaths.en))[0];
        logger.debug("Retrieveing Mobile World Contents from ... http://www.bungie.net" + mobileWorldContents.mobileWorldContentPaths.en[0]);
        //yield cmd.destiny.mobileWorldContents(res);

        if (res.statusCode !== 200) {
            logger.error("failed to download mobileWorldContent: %s\n", res.statusCode);
            throw new Error("download failure: "+res.statusMessage);
        } else {
            logger.debug("Reading manifest file...");
            var file = fs.createReadStream(res.body, 'hex');
            logger.debug("Preparing to write to worldcontents.zip...")
            var zip = fs.createWriteStream(__dirname + "/../../persist/worldcontents.zip");
            
            file.pipe(zip);
            
            logger.debug("Contents written to worldcontents.zip...")
            // check the file if it was properly written

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