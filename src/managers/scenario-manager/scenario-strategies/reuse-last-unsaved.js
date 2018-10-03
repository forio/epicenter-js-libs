import { injectFiltersFromSession } from 'managers/run-strategies/strategy-utils';
import { injectScopeFromSession } from 'managers/run-strategies/strategy-utils';

//TODO: Make a more generic version of this called 'reuse-by-matching-filter';

/**
 * @description
 * ## Current (reuse-last-unsaved)
 *
 * An instance of a [Run Manager](../../run-manager/) with this strategy is included automatically in every instance of a [Scenario Manager](../), and is accessible from the Scenario Manager at `.current`.
 *
 * The `reuse-last-unsaved` strategy returns the most recent run that is not flagged as `trashed` and also not flagged as `saved`.
 * 
 * Using this strategy means that end users continue working with the most recent run that has not been explicitly flagged by the project. However, if there are no runs for this end user, a new run is created.
 * 
 * Specifically, the strategy is:
 *
 * * Check the `saved` and `trashed` fields of the run to determine if the run has been explicitly saved or explicitly flagged as no longer useful.
 *     * Return the most recent run that is not `trashed` and also not `saved`.
 *     * If there are no runs, create a new run for this end user. 
 *
 * See [more information](../#properties) on using `.current` within the Scenario Manager.
 *
 * See also: [additional information on run strategies](../../strategies/).
 */
class ReuseLastUnsaved {
    constructor(options) {
        const strategyOptions = options ? options.strategyOptions : {};
        this.options = strategyOptions;
    }

    reset(runService, userSession, options) {
        const scoped = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        const opt = $.extend(true, {}, scoped, {
            scope: {
                trackingKey: 'current'
            }
        });
        return runService.create(opt, options).then(function (createResponse) {
            return $.extend(true, {}, createResponse, { freshlyCreated: true });
        });
    }

    getRun(runService, userSession, opts) {
        const runopts = runService.getCurrentConfig();
        const filter = injectFiltersFromSession({ 
            trashed: false,
            model: runopts.model,
            'scope.trackingKey': 'current',
        }, userSession);
        const me = this;
        const outputModifiers = { 
            startrecord: 0,
            endrecord: 0,
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
}
ReuseLastUnsaved.requiresAuth = false;
export default ReuseLastUnsaved;