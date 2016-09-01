'use strict';

var co = require('co');
var util = require('util');
var logger = require('winston');
var api = require('../api');
var manifest = require('../manifest');
var message = require('../../../message');

var app = require.main.exports;
var bot = app.bot;
var config = app.config;

function exec(cmd) {

    return co(function *() {

        var msg = cmd.msg; 
        var input = cmd.args[0];
        //var activity = input.replace(/\s+/g, "");
        var busyMsg;
        var input;

        // Retrieve latest Advisor Data
        var res = yield api.advisor();

        /**
         * == Response.data ==
         *
         * Contains : 
         * - activities, 
         * - activityCategories
         */
        var resData = res.data;

        /**
         * === Response.data.activities ===
         * 
         * Returns a list of all known the activities
         * - prisonofelders
         * - elderchallenge
         * - trials
         * - armsday
         * - weeklycrucible
         * - kingsfall
         * - vaultofglass
         * - crota
         * - nightfall
         * - heroicstrike
         * - dailychapter
         * - dailycrucible
         * - prisonofelders-playlist
         * - ironbanner
         * - xur
         * - srl
         * 
         * Extending this to include one of the above activities
         * will result in the following properties being exposed:
         * - identifier
         * - status
         * - display
         * - vendorHash
         * - bountyHashes
         * - extended
         */
        var activities = resData.activities;

        /**
         * === Response.data.activityCategories ===
         * 
         * This exposes a list of known category hashes. These do 
         * not appear anywhere else in the object and would need to 
         * referenced from the "DestinyActivityCategoryDefinition" 
         * collection of the database.
         * 
         * An example query to do this would look like:
         * db.getCollection(
         *      'destiny.manifest.en.DestinyActivityCategoryDefinition'
         * ).find({ hash: hash});
         */
        //var activityCategories = [resData].activityCategories;

        /**
         * == Response.definitions ==
         * 
         * This is only returned and part of the response body if the
         * query string, ?definitions=true, is passed when making the 
         * API call to the advisor URI. 
         * 
         * It contains a large list of hash look-ups, that you would 
         * otherwise have to make a database call to cross-reference.
         * 
         * - items
         * - buckets
         * - stats
         * - perks
         * - talentGrids
         * - statGroups
         * - progressionMappings
         * - itemCategories
         * - sources
         * - objectives
         * - progressions
         * - damageTypes
         * - materialRequirements
         * - unlockValues
         * - vendorDetails
         * - locations
         * - factions
         * - events
         * - vendorCategories
         * - vendorSummaries
         * - destinations
         * - activities
         * - books
         * - places
         * - activityTypes
         * - activityBundles
         * - enemyRaces
         * - flags
         */
        var definitions = res.definitions;

        /**
         * === Response.definitions.destinitions ===
         * 
         * Contains a list of destination hash objects
         * that contain destination info. This is used to
         * replace the destination hash found inside the 
         * `activities.display.destinationHash` property.
         * 
         * 518553403
         * 2512542997
         * 2777041980
         * 2897855902
         * 3393213630
         * 3393905939
         * 4072959335
         * 4233735899
         */
        var destinations = definitions.destinations; 

        /**
         * Trials Advisor
         *****************************/
        if (cmd.args[0] == 'trials') {
            try {
                var activityName = activities[input].display.advisorTypeCategory;         
                
                busyMsg = yield message.send(msg, "Looking up Advisors for the activity " + activityName + " :mag: ");
                var items = activities[input].extended.winRewardDetails.rewardItemHashes
                
                // Check if rewardItems are available. If not, Trials is currently not active
                if (!items) {
                    return message.update(busyMsg, activityName + " is currently not active. I am essential "+
                        "a dumb AI with no frame, not a fortune teller");
                }

                var bounties = activities[input].bountyHashes;                
                var toSend = [];
                var firstline;
                firstline = "━━ "+activityName;
                firstline += "━".repeat(40 - firstline.length);
                toSend.push("```ruby\n"+
                    firstline + "\n" +
                    "Location: " + activities[input].display.flavor + "\n" +
                    "Bounties: " + activities[input].bountyHashes + "\n" +
                    "   Items: " + activities[input].extended.winRewardDetails[0].rewardItemHashes + "\n" +
                    "```" + "\n" +
                    encodeURI("http://www.bungie.net" + activities[input].display.image)
                );

                return message.update(busyMsg, toSend);
            } catch(err) {
                var errmsg = "sorry, something unexpected happened: ```"+err+"```";

                if(busyMsg) {
                    message.update(busyMsg, errmsg, 10000);
                } else {
                    message.send(msg, errmsg, cmd.isPublic, 10000);
                }
            }
        }

        /**
         * Daily Heroic Story Advisor
         ****************************/
         if (cmd.args[0] == 'ds') {
            input = 'dailychapter';
            try {         
                
                busyMsg = yield message.send(msg, "Looking up Advisors for the activity " + 
                    activities[input].display.advisorTypeCategory + 
                    " :mag: "
                );
                var activityHash = activities[input].display.activityHash;
                var activityInfo = definitions.activities[activityHash];
                var destHash = activities[input].display.destinationHash;
                var tiers = activities[input].activityTiers[0];
                var rewardHash = tiers.rewards[0].rewardItems[0].itemHash;
                var rewardValue = tiers.rewards[0].rewardItems[0].value;
                
                var toSend = [];
                var firstline;
                firstline = "━━ "+activities[input].display.advisorTypeCategory;
                firstline += "━".repeat(40 - firstline.length);
                toSend.push("```ruby\n"+
                    firstline + "\n" +
                    " Objective: " + activityInfo.activityDescription + "\n" +
                    "  Location: " + destinations[destHash].destinationName + "\n" +
                    "     Level: " + tiers.activityData.displayLevel + "\n" +
                    "     Light: " + tiers.activityData.recommendedLight + "\n" +
                    "    Skulls: " + activityInfo.skulls[0].displayName + "\n" +
                    "               "+activityInfo.skulls[0].description + "\n" +
                    "   Rewards: " + rewardValue + " " + definitions.items[rewardHash].itemName + "\n" +
                    "```" + "\n" +
                    encodeURI("http://www.bungie.net" + activities[input].display.image)
                );

                return message.update(busyMsg, toSend);
            } catch(err) {
                var errmsg = "sorry, something unexpected happened: ```"+err+"```";

                if(busyMsg) {
                    message.update(busyMsg, errmsg, 10000);
                } else {
                    message.send(msg, errmsg, cmd.isPublic, 10000);
                }
            }
         }

    });

}

module.exports = {
    desc: 'Get list of daily and weekly advisors',
    name: 'advisor',
    alias: ['ad'],
    exec: exec
}