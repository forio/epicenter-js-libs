'use strict';

var Base = require('./none-strategy');
var classFrom = require('../../util/inherit');

/**
* Conditional Creation Strategy
* This strategy will try to get the run stored in the cookie and
* evaluate if needs to create a new run by calling the 'condition' function
*/

var Strategy = classFrom(Base, {
    constructor: function Strategy(condition) {
        if (condition == null) { //eslint-disable-line
            throw new Error('Conditional strategy needs a condition to create a run');
        }
        this.condition = typeof condition !== 'function' ? function () { return condition; } : condition;
    },

    /**
     * Resets current run
     * @param  {RunService} runService  a Run Service instance for the 'current run' as determined by the Run Manager
     * @param  {Object} userSession Information about the current user seesion. See AuthManager#getCurrentUserSession for format
     * @param  {Object} options (Optional) See RunService#create for supported options
     * @return {Promise}             
     */
    reset: function (runService, userSession, options) {
        var group = userSession && userSession.groupName;
        var opt = $.extend({
            scope: { group: group }
        }, runService.getCurrentConfig());

        return runService
                .create(opt, options)
                .then(function (run) {
                    run.freshlyCreated = true;
                    return run;
                });
    },

    /**
     * Gets the 'correct' run (the definition of 'correct' depends on strategy implementation)
     * @param  {RunService} runService  a Run Service instance for the 'current run' as determined by the Run Manager
     * @param  {Object} userSession Information about the current user seesion. See AuthManager#getCurrentUserSession for format
     * @param  {Object} runSession the RunManager stores the 'last accessed' run in a cookie and passes it back here
     * @param  {Object} options (Optional) See RunService#create for supported options
     * @return {Promise}             
     */
    getRun: function (runService, userSession, runSession, options) {
        var me = this;
        if (runSession && runSession.id) {
            return this.loadAndCheck(runService, userSession, runSession, options).catch(function () {
                return me.reset(runService, userSession, options); //if it got the wrong cookie for e.g.
            });
        } else {
            return this.reset(runService, userSession, options);
        }
    },

    loadAndCheck: function (runService, userSession, runSession, options) {
        var shouldCreate = false;
        var me = this;

        return runService
            .load(runSession.id, null, {
                success: function (run, msg, headers) {
                    shouldCreate = me.condition(run, headers, userSession, runSession);
                }
            })
            .then(function (run) {
                if (shouldCreate) {
                    return me.reset(runService, userSession, options);
                }
                return run;
            });
    }
});

module.exports = Strategy;
