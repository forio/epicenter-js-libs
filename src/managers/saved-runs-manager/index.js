import RunService from 'service/run-api-service';
import SessionManager from 'store/session-manager';

import { injectFiltersFromSession } from 'managers/run-strategies/strategy-utils';
import bulkFetchRuns from 'util/bulk-fetch-records';

/**
 * @description
 * 
 * ## Saved Runs Manager
 *
 * The Saved Runs Manager is a specific type of [Run Manager](../../run-manager/) which provides access to a list of runs (rather than just one run). It also provides utility functions for dealing with multiple runs (e.g. saving, deleting, listing).
 *
 * An instance of a Saved Runs Manager is included automatically in every instance of a [Scenario Manager](../), and is accessible from the Scenario Manager at `.savedRuns`. See [more information](../#properties) on using `.savedRuns` within the Scenario Manager.
 */
export default class SavedRunsManager {

    /**
     * @param {object} config 
     * @property {boolean} [scopeByGroup]  If set, will only pull runs from current group. Defaults to `true`.
     * @property {boolean} [scopeByUser]  If set, will only pull runs from current user. Defaults to `true`. For multiplayer run comparison projects, set this to false so that all end users in a group can view the shared set of saved runs.
     * @property {object} [run] Run Service options
     */
    constructor(config) {
        const defaults = {
            scopeByGroup: true,
            scopeByUser: true,
            run: null,
        };
    
        this.sessionManager = new SessionManager();
    
        const options = $.extend(true, {}, defaults, config);
        if (options.run) {
            if (options.run instanceof RunService) {
                this.runService = options.run;
            } else {
                this.runService = new RunService(options.run);
            }
            this.options = options;
        } else {
            throw new Error('No run options passed to SavedRunsManager');
        }
    }
    
    /**
     * Marks a run as saved. 
     *
     * Note that while any run can be saved, only runs which also match the configuration options `scopeByGroup` and `scopeByUser` are returned by the `getRuns()` method.
     *
     * @example
     * const sm = new F.manager.ScenarioManager();
     * sm.savedRuns.save('0000015a4cd1700209cd0a7d207f44bac289');
     *
     * @param  {String|RunService} run Run to save. Pass in either the run id, as a string, or the [Run Service](../../run-api-service/).
     * @param  {object} [otherFields] Any other meta-data to save with the run.
     * @return {Promise}
     */
    save(run, otherFields) {
        const runConfig = this.runService.getCurrentConfig();
        const defaultToSave = {};
        if (runConfig.scope && runConfig.scope.trackingKey) {
            defaultToSave.scope = { trackingKey: runConfig.scope.trackingKey };
        }
        const param = $.extend(true, defaultToSave, otherFields, { saved: true, trashed: false });
        return this.mark(run, param);
    }

    /**
     * Marks a run as removed; the inverse of marking as saved.
     *
     * @example
     * const sm = new F.manager.ScenarioManager();
     * sm.savedRuns.remove('0000015a4cd1700209cd0a7d207f44bac289');
     *
     * @param  {String|RunService|object} run Run to remove. Pass in either the run id, as a string, or the [Run Service](../../run-api-service/).
     * @param  {object} [otherFields] any other meta-data to save with the run.
     * @return {Promise}
     */
    remove(run, otherFields) {
        const param = $.extend(true, {}, otherFields, { saved: false, trashed: true });
        return this.mark(run, param);
    }


    /**
     * Sets additional fields on a run. This is a convenience method for [RunService#save](../../run-api-service/#save).
     *
     * @example
     * const sm = new F.manager.ScenarioManager();
     * sm.savedRuns.mark('0000015a4cd1700209cd0a7d207f44bac289', 
     *     { 'myRunName': 'sample policy decisions' });
     *
     * @param  {String|string[]|RunService} run  Run to operate on. Pass in either the run id, as a string, or the [Run Service](../../run-api-service/).
     * @param  {Object} toMark Fields to set, as name : value pairs.
     * @return {Promise}
     */
    mark(run, toMark) {
        let rs;
        const existingOptions = this.runService.getCurrentConfig();
        if (run instanceof RunService) {
            rs = run;
        } else if (run && (typeof run === 'string')) {
            rs = new RunService($.extend(true, {}, existingOptions, { id: run, autoRestore: false }));
        } else if (Array.isArray(run)) {
            const me = this;
            const proms = run.map(function (r) {
                return me.mark(r, toMark);
            });
            return $.when.apply(null, proms);
        } else {
            throw new Error('Invalid run object provided');
        }
        return rs.save(toMark);
    }

    /**
     * Returns a list of saved runs. Note: This recursively fetches **all** runs by default; if you need access to data as it's being fetched use `options.onData`, else the promise is resolved with the final list of runs.
     *
     * @example
     * const sm = new F.manager.ScenarioManager();
     * sm.savedRuns.getRuns().then(function (runs) {
     *  console.log('Found runs', runs.length);
     * });
     *
     * @param  {string[]} [variables] If provided, in the returned list of runs, each run will have a `.variables` property with these set.
     * @param  {object} [filter]    Any filters to apply while fetching the run. See [RunService#filter](../../run-api-service/#filter) for details.
     * @param  {object} [modifiers] Use for paging/sorting etc. See [RunService#filter](../../run-api-service/#filter) for details.
     * @param  {object} [options]
     * @param {function(object[]):void} [options.onData] Use to get progressive data notifications as they're being fetched. Called with <options.recordsPerFetch> runs until all runs are loaded.
     * @param {Number} [options.recordsPerFetch] Control the number of runs loaded with each request. Defaults to 100, set to lower to get results faster.
     * @return {Promise}
     */
    getRuns(variables, filter, modifiers, options) {
        const session = this.sessionManager.getSession(this.runService.getCurrentConfig());

        const runopts = this.runService.getCurrentConfig();
        const scopedFilter = injectFiltersFromSession($.extend(true, {}, {
            saved: true, 
            trashed: false,
            model: runopts.model,
        }, filter), session, this.options);
        Object.keys(filter || {}).forEach((key)=> {
            if (filter[key] === undefined) {
                delete scopedFilter[key];
            }
        });

        const opModifiers = $.extend(true, {}, {
            sort: 'created',
            direction: 'asc',
        }, modifiers);
        if (variables) {
            opModifiers.include = [].concat(variables);
        }

        const ops = $.extend({}, {
            recordsPerFetch: 100,
            onData: ()=> {},
            startRecord: opModifiers.startRecord,
            endRecord: opModifiers.endRecord,
        }, options);
        return bulkFetchRuns((startRecord, endRecord)=> {
            const opModifiersWithPaging = $.extend({}, opModifiers, { startRecord: startRecord, endRecord: endRecord });
            return this.runService.query(scopedFilter, opModifiersWithPaging);
        }, ops);
    }
}
