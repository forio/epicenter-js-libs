'use strict';

var Base = require('./none-strategy');
var classFrom = require('../../util/inherit');
var AuthManager = require('../auth-manager');

var keyNames = require('../key-names');

var defaults = {
    sessionKey: keyNames.STRATEGY_SESSION_KEY,
    path: ''
};

/**
* Conditional Creation Strategy
* This strategy will try to get the run stored in the cookie and
* evaluate if needs to create a new run by calling the 'condition' function
*/

var Strategy = classFrom(Base, {
    constructor: function Strategy(condition, options) {
        if (condition == null) { //eslint-disable-line
            //TODO: not sure why this is explicitly ==
            throw new Error('Conditional strategy needs a condition to create a run');
        }

        this._auth = new AuthManager();
        this.condition = typeof condition !== 'function' ? function () { return condition; } : condition;
        this.options = $.extend(true, {}, defaults, options);
    },

    reset: function (runService) {
        var userSession = this._auth.getCurrentUserSessionInfo();
        var opt = $.extend({
            scope: { group: userSession.groupName }
        }, runService.getCurrentConfig());

        return runService
                .create(opt)
                .then(function (run) {
                    run.freshlyCreated = true;
                    return run;
                });
    },

    getRun: function (runService, runIdInSession) {
        var me = this;
        if (runIdInSession) {
            return this.loadAndCheck(runService, runIdInSession).catch(function () {
                return me.reset(runService); //if it got the wrong cookie for e.g.
            });
        } else {
            return this.reset(runService);
        }
    },

    loadAndCheck: function (runService, runIdInSession, filters) {
        var shouldCreate = false;
        var me = this;

        return runService
            .load(runIdInSession, filters, {
                success: function (run, msg, headers) {
                    shouldCreate = me.condition(run, headers);
                }
            })
            .then(function (run) {
                if (shouldCreate) {
                    return me.reset(runService);
                }
                return run;
            });
    }
});

module.exports = Strategy;
