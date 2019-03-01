import { injectFiltersFromSession, injectScopeFromSession } from 'managers/run-strategies/strategy-utils';

/**
 * The `reuse-last-initialized` strategy looks for the most recent run that matches particular criteria; if it cannot find one, it creates a new run and immediately executes a set of "initialization" operations. 
 *
 * This strategy is useful if you have a time-based model and always want the run you're operating on to start at a particular step. For example:
 *
 *  ```js
 *  const rm = new F.manager.RunManager({
 *      strategy: 'reuse-last-initialized',
 *      strategyOptions: {
 *          initOperation: [{ step: 10 }]
 *      }
 *  });
 *  ```
 * This strategy is also useful if you have a custom initialization function in your model, and want to make sure it's always executed for new runs.
 *
 * Specifically, the strategy is:
 *
 * * Look for the most recent run that matches the (optional) `flag` criteria
 * * If there are no runs that match the `flag` criteria, create a new run. Immediately "initialize" this new run by:
 *     *  Calling the model operation(s) specified in the `initOperation` array.
 *     *  Optionally, setting a `flag` in the run.
 *
 */
export default class ReuseLastInitializedStrategy {
    /**
     * 
     * @param {object} [options] 
     * @property {object[]} [options.initOperation] Operations to execute in the model for initialization to be considered complete. Can be in any of the formats [Run Service's `serial()`](../run-api-service/#serial) supports.
     * @property {object} [options.flag] Flag to set in run after initialization operations are run. You typically would not override this unless you needed to set additional properties as well.
     * @property {object} [options.scope] 
     * @property {boolean} [options.scope.scopeByUser]  If true, only returns the last run for the user in session. Defaults to true.
     * @property {boolean} [options.scope.scopeByGroup] If true, only returns the last run for the group in session. Defaults to true.
     */
    constructor(options) {
        const defaults = {
            initOperation: [],
            flag: null,
            scope: {
                scopeByUser: true,
                scopeByGroup: true,
            }
        };
        const strategyOptions = options ? options.strategyOptions : {};
        this.options = $.extend(true, {}, defaults, strategyOptions);
        if (!this.options.initOperation || !this.options.initOperation.length) {
            throw new Error('Specifying an init function is required for this strategy');
        }
        if (!this.options.flag) {
            this.options.flag = {
                isInitComplete: true
            };
        }
    }

    reset(runService, userSession, options) {
        const opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        return runService.create(opt, options).then((createResponse)=> {
            return runService.serial([].concat(this.options.initOperation)).then(()=> createResponse);
        }).then((createResponse)=> {
            return runService.save(this.options.flag).then((patchResponse)=> {
                return $.extend(true, {}, createResponse, patchResponse);
            });
        });
    }

    getRun(runService, userSession, runSession, options) {
        const sessionFilter = injectFiltersFromSession(this.options.flag, userSession, this.options.scope);
        const runopts = runService.getCurrentConfig();
        const filter = $.extend(true, { trashed: false }, sessionFilter, { model: runopts.model });
        return runService.query(filter, { 
            startrecord: 0,
            endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        }).then((runs)=> {
            if (!runs.length) {
                return this.reset(runService, userSession, options);
            }
            return runs[0];
        });
    }
}