'use strict';

var CookieStore = require('../../store/cookie-store');
var makeSeq = require('../../util/make-sequence');
var Base = require('./identity-strategy');

var classFrom = require('../../util/inherit');

var cookies = new CookieStore({domain: null});

var defaults = {
    cookieName: 'epicenter-scenario'
};

function setRunCookie(cookieName, run) {
    var path = '/';
    if (window) {
        if (/\.html/.test(window.location.pathname.split('/'))) {
            var parts = window.location.pathname.split('/');
            parts.pop();
            path = parts.join('/');
        } else {
            path =window.location.pathname;
        }
    }
    cookies.set(cookieName, JSON.stringify({ runId: run.id }), { root: path });
}

/**
* Conditional Creation Strategy
* This strategy will try to get the run stored in the cookie and
* evaluate if needs to create a new run by calling the 'condition' function
*/

/* jshint eqnull: true */
var Strategy = classFrom(Base, {
    constructor: function Strategy(runService, condition, options) {
        if (condition == null) {
            throw new Error('Conditional strategy needs a condition to createte a run');
        }

        this.run = makeSeq(runService);
        this.condition = typeof condition !== 'function' ? function () { return condition; } : condition;
        this.options = $.extend(true, {}, defaults, options);
    },

    reset: function () {
        var _this = this;

        return this.run
            .create({ model: this.options.model })
            .then(function (run) {
                setRunCookie(_this.options.cookieName, run);
                run.freshlyCreated = true;
                return run;
            })
            .start();
    },

    getRun: function (model) {
        var session = JSON.parse(cookies.get(this.options.cookieName));

        if (session && session.runId) {
            return this._loadAndCheck(session, model);
        } else {
            return this.reset();
        }
    },

    _loadAndCheck: function (session, model) {
        var shouldCreate = false;
        var _this = this;

        return this.run
            .load(session.runId, null, {
                success: function (run, msg, headers) {
                    shouldCreate = _this.condition.call(_this, run, headers);
                }
            })
            .then(function (run) {
                if (shouldCreate) {
                    // we need to do this, on the original runService (ie not sequencialized)
                    // so we don't get in the middle of the queue
                    return _this.run.original.create(model)
                        .then(function (run) {
                            setRunCookie(_this.options.cookieName, run);
                            run.freshlyCreated = true;
                            return run;
                        });
                }

                return run;
            })
            .start();
    }
});

module.exports = Strategy;
