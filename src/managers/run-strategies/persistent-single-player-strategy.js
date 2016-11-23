/**
 * The `persistent-single-player` strategy returns the latest (most recent) run for this user, whether it is in memory or not. If there are no runs for this user, it creates a new one.
 *
 * This strategy is useful if your project executes your model step by step (as opposed to a project where the model is executed completely, for example, a Vensim model that is immediately stepped to the end). It is useful if end users play with your project for an extended period of time, possibly over several sessions.
 *
 * Specifically, the strategy is:
 * 
 * * Check if there are any runs for this end user.
 *     * If there are no runs (either in memory or in the database), create a new one.
 *     * If there are runs, take the latest (most recent) one.
 *         * If the most recent run is currently in the database, bring it back into memory so that the end user can continue working with it. (See more background on [Run Persistence](../../../run_persistence/), or read more on the underlying [State API](../../../rest_apis/other_apis/model_apis/state/) for bringing runs from the database back into memory.) 
 */

'use strict';

var classFrom = require('../../util/inherit');
var IdentityStrategy = require('./none-strategy');
var StorageFactory = require('../../store/store-factory');
var StateApi = require('../../service/state-api-adapter');
var AuthManager = require('../auth-manager');

var keyNames = require('../key-names');

var defaults = {
    store: {
        synchronous: true
    }
};

var Strategy = classFrom(IdentityStrategy, {
    constructor: function Strategy(options) {
        this.options = $.extend(true, {}, defaults, options);
        this.runOptions = this.options.run;
        this._store = new StorageFactory(this.options.store);
        this.stateApi = new StateApi();
        this._auth = new AuthManager();
    },

    reset: function (runService) {
        var session = this._auth.getCurrentUserSessionInfo();
        var opt = $.extend({
            scope: { group: session.groupName }
        }, this.runOptions);

        return runService
            .create(opt)
            .then(function (run) {
                run.freshlyCreated = true;
                return run;
            });
    },

    getRun: function (runService) {
        var me = this;
        var session = JSON.parse(this._store.get(keyNames.EPI_SESSION_KEY) || '{}');
        return runService.query({
            'user.id': session.userId || '0000',
            'scope.group': session.groupName
        }).then(function (runs) {
            return me._loadAndCheck(runService, runs);
        });
    },

    _loadAndCheck: function (runService, runs) {
        if (!runs || !runs.length) {
            return this.reset(runService);
        }

        var dateComp = function (a, b) { return new Date(b.date) - new Date(a.date); };
        var latestRun = runs.sort(dateComp)[0];
        var me = this;
        var shouldReplay = false;

        return runService.load(latestRun.id, null, {
            success: function (run, msg, headers) {
                shouldReplay = headers.getResponseHeader('pragma') === 'persistent';
            }
        }).then(function (run) {
            if (shouldReplay) {
                return me.stateApi.replay({ runId: run.id })
                    .then(function (resp) {
                        return runService.load(resp);
                    });
            }
            return run;
        });
    },

});

module.exports = Strategy;
