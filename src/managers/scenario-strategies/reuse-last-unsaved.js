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
 * An instance of a [Run Manager](../../run-manager/) with this strategy is included automatically in every instance of a [Scenario Manager](../), and is accessible from the Scenario Manager at `.current`. See [more information](../#properties) on using `.current` within the Scenario Manager.
 *
 * See also: [additional information on run strategies](../../strategies/).
 * @name new-if-missing
 */

'use strict';
var classFrom = require('../../util/inherit');
var injectFiltersFromSession = require('../strategy-utils').injectFiltersFromSession;
var injectScopeFromSession = require('../strategy-utils').injectScopeFromSession;

var Base = {};

//TODO: Make a more generic version of this called 'reuse-by-matching-filter';
module.exports = classFrom(Base, {
    constructor: function (options) {
        var strategyOptions = options ? options.strategyOptions : {};
        this.options = strategyOptions;
    },

    reset: function (runService, userSession) {
        var opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        return runService.create(opt).then(function (createResponse) {
            return runService.save({ trashed: false }).then(function (patchResponse) { //TODO remove this once EPICENTER-2500 is fixed
                return $.extend(true, {}, createResponse, patchResponse, { freshlyCreated: true });
            });
        });
    },

    getRun: function (runService, userSession) {
        var filter = injectFiltersFromSession({ 
            saved: false,
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
            return runs[0];
        });
    }
}, { requiresAuth: false });