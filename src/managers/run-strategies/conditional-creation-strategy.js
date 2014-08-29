(function () {

    'use strict';

    var root = this;
    var F = root.F;
    var cookies;
    var makeSeq;
    var classFrom;
    var $;
    var Base;

    if (typeof require !== 'undefined') {
        $ = require('jquery');
        cookies = new require('../../store/cookie-store')({domain: null});
        makeSeq = require('../../util/make-sequence');
        classFrom = require('../util/inherit');
        Base = require('./identity-strategy');
    } else {
        $ = root.jQuery;
        cookies = new F.store.Cookie({domain: null});
        makeSeq = F.util.makeSequence;
        classFrom = F.util.classFrom;
        Base = F.manager.strategy.identity;
    }

    var defaults = {
        cookieName: 'epicenter-scenario'
    };

    function setRunCookie(cookieName, run) {
        cookies.set(cookieName, { runId: run.id });
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
            var session = cookies.get(this.options.cookieName);
            var _this = this;

            return this.run
                .create({ model: this.options.model, runId: (session ? session.runId : null)})
                .then(function (run) {
                    setRunCookie(_this.options.cookieName, run);
                    return run;
                })
                .start();
        },

        getRun: function (model) {
            var session = cookies.get(this.options.cookieName);

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

    if (typeof require !== 'undefined') {
        module.exports = Strategy;
    } else {
        if (!root.F) { root.F = {};}
        if (!root.F.manager) { root.F.manager = {};}
        if (!root.F.manager.strategy) { root.F.manager.strategy = {};}
        root.F.manager.strategy['conditional-creation'] = Strategy;
    }

}).call(this);
