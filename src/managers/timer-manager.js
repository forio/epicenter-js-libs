'use strict';

var classFrom = require('../util/inherit');
var Dataservice = require('../service/data-api-service');
var TimeService = require('../service/time-api-service');
var SessionManager = require('../store/session-manager');

var Base = {};

var SCOPES = {
    GROUP: 'GROUP',
    RUN: 'RUN',
    USER: 'USER'
};
var STATES = {
    CREATED: 'CREATED',
    STARTED: 'STARTED',
    PAUSED: 'PAUSED',
    RESUMED: 'RESUMED',
};

function getAPIKeyName(options) {
    var scope = options.scope.toUpperCase();
    if (scope === SCOPES.GROUP) {
        return [options.name, options.groupName].join('-');
    } else if (scope === SCOPES.USER) {
        return [options.name, options.userName].join('-');
    } else if (scope === SCOPES.RUN) {
        // if (!options.scopeOptions) {
        //     throw new Error('Run Scope requires passing in run options' + scope);
        // }
        // var rm = new RunManager(options.scopeOptions);
        // return rm.getRun().then(function (run) {
        //     return [options.name, 'run', run.id].join('-');
        // });
    }
    throw new Error('Unknown scope ' + scope);
}

function getStore(options, key) {
    var ds = new Dataservice($.extend(true, {}, options, {
        root: key
    }));
    return ds;
}

function doAction(action, merged) {
    var ts = new TimeService(merged);
    var key = getAPIKeyName(merged);
    return ts.getTime().then(function (t) {
        var ds = getStore(merged, key);
        return ds.pushToArray('time/actions', { 
            type: action, time: t.toISOString()
        }).catch(function (res) {
            if (res.status === 404) {
                var errorMsg = 'Timer: Collection ' + key + ' not found. Did you create it?';
                console.error(errorMsg);
                throw new Error(errorMsg);
            }
            throw res;
        });
    }, function (err) {
        console.error('Timermanager start: Timer error', err);
    });
}

function reduceActions(actions, currentTime) {
    var reduced = actions.reduce(function (accum, action) {
        var ts = +(new Date(action.time));
        if (action.type === STATES.CREATED) {
            accum.timeLimit = action.timeLimit;
        } else if (action.type === STATES.STARTED && !accum.startTime) {
            accum.startTime = ts;
        } else if (action.type === STATES.PAUSED && !accum.lastPausedTime) {
            accum.lastPausedTime = ts;
            accum.elapsedTime = ts - accum.startTime;
        } else if (action.type === STATES.RESUMED && accum.lastPausedTime) {
            var pausedTime = ts - accum.lastPausedTime;
            accum.totalPauseTime += pausedTime;
            accum.lastPausedTime = 0;
            accum.elapsedTime = 0;
        }
        return accum;
    }, { startTime: 0, lastPausedTime: 0, totalPauseTime: 0, elapsedTime: 0, timeLimit: 0 });

    var lastAction = actions[actions.length - 1];
    var isPaused = !!(lastAction && lastAction.type === STATES.PAUSED);

    var current = +currentTime;
    var elapsed = isPaused ? reduced.elapsedTime : (current - (reduced.startTime || current) + reduced.totalPauseTime);
    var remaining = Math.max(0, reduced.timeLimit - elapsed);

    var secs = Math.floor(remaining / 1000);
    var minutesRemaining = Math.floor(secs / 60);
    var secondsRemaining = Math.floor(secs % 60);
    return {
        elapsed: elapsed,
        isPaused: isPaused,
        remaining: {
            time: remaining,
            minutes: minutesRemaining,
            seconds: secondsRemaining,
        },
    };
}
// Interface that all strategies need to implement
module.exports = classFrom(Base, {
    constructor: function (options) {
        var defaults = {
            account: undefined,
            project: undefined,

            name: 'timer',
            scope: 'run',
        };

        this.options = $.extend(true, {}, defaults, options);
        this.sessionManager = new SessionManager(this.options);
    },

    create: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        if (!merged.time || isNaN(+merged.time)) {
            throw new Error('Timer Manager: expected number time, received ' + merged.time);
        }
        var key = getAPIKeyName(merged);
        var ds = getStore(merged, key);
        return ds.saveAs('time', { actions: [{ type: STATES.CREATED, timeLimit: merged.time }] });
    },
    cancel: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        var key = getAPIKeyName(merged);
        var ds = getStore(merged, key);
        return ds.remove();
    },

    start: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction(STATES.STARTED, merged);
    },
    pause: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction(STATES.PAUSED, merged);
    },
    resume: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction(STATES.RESUMED, merged);
    },

    getTime: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        var ts = new TimeService(merged);
        var key = getAPIKeyName(merged);
        return ts.getTime().then(function (currentTime) {
            var ds = getStore(merged, key);
            return ds.load().then(function calculateTimeLeft(doc) {
                if (!doc || !doc[0]) {
                    throw new Error('Timer has not been started yet');
                }
                var actions = doc[0].actions;
                var reduced = reduceActions(actions, currentTime);
                return $.extend(true, {}, doc[0], reduced);
            });
        });
    },

    getChannel: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        var key = getAPIKeyName(merged);
        var ds = getStore(merged, key);
        return ds.getChannel();
    },

});