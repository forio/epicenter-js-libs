/**
 * ## Current (reuse-last-unsaved)
 *
 * The `reuse-last-unsaved` strategy returns the most recent run that is not `trashed` and also not `saved`.
 * 
 * Using this strategy means that end users continue working with the most recent run that has not been explicitly tagged by the project. However, if there are no runs for this end user, a new run is created.
 * 
 * Specifically, the strategy is:
 *
 * * Check the `saved` and `trashed` fields of the run to determine if the run has been explicitly saved or explicitly 'thrown away' (marked as no longer useful).
 *     * Return the most recent run that is not `trashed` and also not `saved`.
 *     * If the most recent run that is not `trashed` _is_ `saved`, then clone it and return the clone.
 *     * If there are no runs, create a new run for this end user. 
 *
 * An instance of a [Run Manager](../run-manager/) with this strategy is included automatically in every instance of a [Scenario Manager](../), and is accessible from the Scenario Manager at `.current`. See [more information](../#properties) on using `.current` within the Scenario Manager.
 *
 * @name new-if-missing
 */

'use strict';
var classFrom = require('../../util/inherit');
var StateService = require('../../service/state-api-adapter');

var injectFiltersFromSession = require('../strategy-utils').injectFiltersFromSession;
var injectScopeFromSession = require('../strategy-utils').injectScopeFromSession;

var Base = {};
module.exports = classFrom(Base, {
    constructor: function (options) {
        var strategyOptions = options ? options.strategyOptions : {};
        this.options = strategyOptions;
    },

    reset: function (runService, userSession) {
        var opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        return runService.create(opt).then(function (createResponse) {
            return runService.save({ trashed: false }).then(function (patchResponse) { //TODO remove this once EPICENTER-2500 is fixed
                return $.extend(true, {}, createResponse, patchResponse);
            });
        });
    },

    getRun: function (runService, userSession) {
        var filter = injectFiltersFromSession({ 
            trashed: false, //TODO change to '!=true' once EPICENTER-2500 is fixed
        }, userSession);
        var me = this;
        var outputModifiers = { 
            // startrecord: 0,  //TODO: Uncomment when EPICENTER-2569 is fixed
            // endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        };
        return runService.query(filter, outputModifiers).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession);
            }
            var lastRun = runs[0];
            if (lastRun.saved !== true) {
                return lastRun;
            }

            var basedOnRunid = lastRun.id;
            var sa = new StateService();
            return sa.clone({ runId: basedOnRunid, exclude: me.options.ignoreOperations }).then(function (response) {
                return runService.load(response.run);
            }).then(function (run) {
                //TODO remove this once EPICENTER-2500 is fixed
                return runService.save({ trashed: false }).then(function (patchResponse) {
                    return $.extend(true, {}, run, patchResponse);
                });
            });
        });
    }
}, { requiresAuth: false });