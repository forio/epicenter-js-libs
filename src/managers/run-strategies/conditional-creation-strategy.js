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
            //TODO: not sure why this is explicitly ==
            throw new Error('Conditional strategy needs a condition to create a run');
        }
        this.condition = typeof condition !== 'function' ? function () { return condition; } : condition;
    },

    reset: function (runService, userSession) {
        var group = userSession && userSession.groupName;
        var opt = $.extend({
            scope: { group: group }
        }, runService.getCurrentConfig());

        return runService
                .create(opt)
                .then(function (run) {
                    run.freshlyCreated = true;
                    return run;
                });
    },

    getRun: function (runService, runIdInSession, userSession) {
        var me = this;
        if (runIdInSession) {
            return this.loadAndCheck(runService, runIdInSession, userSession).catch(function () {
                return me.reset(runService, userSession); //if it got the wrong cookie for e.g.
            });
        } else {
            return this.reset(runService, userSession);
        }
    },

    loadAndCheck: function (runService, runIdInSession, userSession) {
        var shouldCreate = false;
        var me = this;

        return runService
            .load(runIdInSession, null, {
                success: function (run, msg, headers) {
                    shouldCreate = me.condition(run, headers);
                }
            })
            .then(function (run) {
                if (shouldCreate) {
                    return me.reset(runService, userSession);
                }
                return run;
            });
    }
});

module.exports = Strategy;
