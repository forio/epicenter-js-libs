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

function getAPIKeyName(options) {
    var scope = options.scope;
    if (scope === SCOPES.GROUP) {
        return $.Deferred().resolve([options.name, options.groupName].join('-')).promise();
    } else if (scope === SCOPES.USER) {
        return [options.name, options.userName].join('-');
    } else if (scope === SCOPES.RUN) {
        if (!options.scopeOptions) {
            throw new Error('Run Scope requires passing in run options' + scope);
        }
        var rm = new RunManager(options.scopeOptions);
        return rm.getRun().then(function (run) {
            return [options.name, 'run', run.id].join('-');
        });
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
    return getAPIKeyName(merged).then(function (key) {
        return ts.getTime().then(function (t) {
            var ds = getStore(merged, key);
            return ds.pushToArray('time/actions', { 
                type: action, time: t.toISOString()
            });
        }, function (err) {
            console.error('Timermanager start: Timer error', err);
        });
    });
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
        return getAPIKeyName(merged).then(function (key) {
            var ds = getStore(merged, key);
            return ds.saveAs('time', { totalTime: merged.time, actions: [] });
        });
    },
    update: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        return getAPIKeyName(merged).then(function (key) {
            var ds = getStore(merged, key);
            return ds.saveAs('totalTime', merged.time);
        });
    },
    cancel: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        return getAPIKeyName(merged).then(function (key) {
            var ds = getStore(merged, key);
            return ds.remove();
        });
    },

    start: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction('START', merged);
    },
    pause: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction('PAUSE', merged);
    },
    resume: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        return doAction('RESUME', merged);
    },

    getTime: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        var ts = new TimeService(merged);
        return getAPIKeyName(merged).then(function (key) {
            return ts.getTime().then(function (currentTime) {
                var ds = getStore(merged, key);
                return ds.load().then(function (doc) {
                    var actions = doc[0].actions;
                    var totalTime = doc[0].totalTime;

                    var reduced = actions.reduce(function (accum, action) {
                        var ts = +(new Date(action.time));
                        if (action.type === 'START') {
                            accum.startTime = ts;
                        } else if (action.type === 'PAUSE') {
                            accum.lastPausedTime = ts;
                        } else if (action.type === 'RESUME') {
                            var pausedTime = ts - accum.lastPausedTime;
                            accum.totalPausedTime += pausedTime;
                            accum.lastPausedTime = 0;
                        }
                        return accum;
                    }, { startTime: 0, lastPausedTime: 0, totalPauseTime: 0 });

                    var current = +currentTime;
                    var elapsed = current - reduced.startTime + reduced.totalPauseTime;
                    var remaining = Math.max(0, totalTime - elapsed);

                    var secs = Math.floor(remaining / 1000);
                    var minutesRemaining = Math.floor(secs / 60);
                    var secondsRemaining = Math.floor(secs % 60);
                    return {
                        elapsed: elapsed,
                        remaining: {
                            time: remaining,
                            minutes: minutesRemaining,
                            seconds: secondsRemaining,
                        }
                    };
                }, function () {
                    throw new Error('Timer has not been started yet');
                });
            });
        });
    },

    getChannel: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        return getAPIKeyName(merged).then(function (key) {
            var ds = getStore(merged, key);
            return ds.getChannel();
        });
    },

});