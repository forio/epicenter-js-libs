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
        var ts = new TimeService(merged);
        return getAPIKeyName(merged).then(function (key) {
            return ts.getTime().then(function (t) {
                var ds = getStore(merged, key);
                return ds.pushToArray('time/actions', { 
                    action: 'START', startTime: t.toISOString()
                });
            }, function (err) {
                console.error('Timermanager start: Timer error', err);
            });
        });
    },
    pause: function (opts) {
        var authSession = this.sessionManager.getSession();
        var merged = $.extend(true, {}, this.options, opts);
        var ts = new TimeService(merged);
        return getAPIKeyName(this.options, authSession).then(function (key) {
            var ds = getStore(merged, key + '/actions/foo');
            return ts.getTime().then(function (t) {
                return ds.save({ action: 'PAUSE', time: t });
            });
        });
    },

    getTime: function (opts) {
        var merged = this.sessionManager.getMergedOptions(this.options, opts);
        var ts = new TimeService(merged);
        return getAPIKeyName(merged).then(function (key) {
            return ts.getTime().then(function (currentTime) {
                var ds = getStore(merged, key);
                return ds.load().then(function (doc) {
                    var actions = doc.actions;
                    var time = actions.reduce(function (accum, action) {
                        if (action === 'START') {
                            accum.elapsedTime = (+currentTime - action.start);
                            accum.timeLeft = Math.max(action.totalTime - accum.elapsedTime, 0);
                            accum.startTime = accum.startTime;
                            accum.totalTime = accum.totalTime;
                        }
                    }, { elapsedTime: 0 });
                    return time;
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