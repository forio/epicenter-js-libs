'use strict';

var Base = require('./identity-strategy');
var SessionManager = require('../../store/session-manager');
var classFrom = require('../../util/inherit');
var AuthManager = require('../auth-manager');

var keyNames = require('../key-names');

var defaults = {
    sessionKey: keyNames.STRATEGY_SESSION_KEY,
    path: ''
};

function setRunInSession(sessionKey, run, sessionManager) {
    sessionManager.getStore().set(sessionKey, JSON.stringify({ runId: run.id }));
}

/**
* Conditional Creation Strategy
* This strategy will try to get the run stored in the cookie and
* evaluate if needs to create a new run by calling the 'condition' function
*/

/* jshint eqnull: true */
var Strategy = classFrom(Base, {
    constructor: function Strategy(runService, condition, options) {
        if (condition === null) {
            throw new Error('Conditional strategy needs a condition to create a run');
        }

        this._auth = new AuthManager();
        this.run = runService;
        this.condition = typeof condition !== 'function' ? function () { return condition; } : condition;
        this.options = $.extend(true, {}, defaults, options);
        this.sessionManager = new SessionManager(options);
        this.runOptions = this.options.run;
    },

    runOptionsWithScope: function () {
        var userSession = this._auth.getCurrentUserSessionInfo();
        return $.extend({
            scope: { group: userSession.groupName }
        }, this.runOptions);
    },

    reset: function (runServiceOptions) {
        var me = this;
        var opt = this.runOptionsWithScope();

        return this.run
                .create(opt, runServiceOptions)
            .then(function (run) {
                setRunInSession(me.options.sessionKey, run, me.sessionManager);
                run.freshlyCreated = true;
                return run;
            });
    },

    getRun: function () {
        var sessionStore = this.sessionManager.getStore();
        var runSession = JSON.parse(sessionStore.get(this.options.sessionKey));
        var me = this;
        if (runSession && runSession.runId) {
            return this._loadAndCheck(runSession).fail(function () {
                return me.reset(); //if it got the wrong cookie for e.g.
            });
        } else {
            return this.reset();
        }
    },

    _loadAndCheck: function (runSession) {
        var shouldCreate = false;
        var me = this;

        return this.run
            .load(runSession.runId, null, {
                success: function (run, msg, headers) {
                    shouldCreate = me.condition(run, headers);
                }
            })
            .then(function (run) {
                if (shouldCreate) {
                    var opt = me.runOptionsWithScope();
                    return me.run.create(opt)
                    .then(function (run) {
                        setRunInSession(me.options.sessionKey, run, me.sessionManager);
                        run.freshlyCreated = true;
                        return run;
                    });
                }
                return run;
            });
    }
});

module.exports = Strategy;
