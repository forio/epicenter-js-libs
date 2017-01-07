/**
 * The `none` strategy never returns a run or tries to create a new run. It simply returns the contents of the current [Run Service instance](../run-api-service/).
 * 
 * This strategy is useful if you want to manually decide how to create your own runs and don't want any automatic assistance. 
 * 
 * Also, this strategy is necessary if you are working with a multiplayer project and using the [World Manager](../world-manager/) &mdash; or other, similar situations where you do not have direct control over creating the [Run Service](../run-api-service/) instance.
 */

'use strict';

var classFrom = require('../../util/inherit');
var Base = {};

// Interface that all strategies need to implement
module.exports = classFrom(Base, {
    constructor: function (options) {

    },

    reset: function () {
        // return a newly created run
        return $.Deferred().resolve().promise();
    },

    getRun: function () {
        // return a usable run
        return $.Deferred().resolve(this.runService).promise();
    }
});
