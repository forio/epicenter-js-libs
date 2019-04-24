import RunService from 'service/run-api-service';
import { parseContentRange } from 'util/run-util';
import { injectScopeFromSession, injectFiltersFromSession } from './strategy-utils';
import { result, makePromise, rejectPromise, resolvePromise } from 'util/index';

import { reset, getRun, getCurrentWorld } from './multiplayer-strategy';
import { omit } from 'util/object-util';

const errors = {
    RUN_LIMIT_REACHED: 'RUN_LIMIT_REACHED',
    NO_TRACKING_KEY: 'NO_TRACKING_KEY',
};

/**
 * @param {string} trackingKey 
 * @param {string} worldId 
 * @param {object} userSession 
 * @param {object} metaFilter Additional criteria to filter by 
 * @returns {object}
 */
function makeFilter(trackingKey, worldId, userSession, metaFilter) {
    const runFilter = $.extend(true, {
        scope: {
            trackingKey: trackingKey,
            worldId: worldId,
        }
    }, metaFilter);
    const filter = injectFiltersFromSession(runFilter, userSession, { scopeByUser: false });
    return filter;
}

/**
 * @param {RunService} runService 
 * @param {object} filter 
 * @returns {Promise<object[]>}
 */
function getRunsForFilter(runService, filter) {
    return runService.query(filter, {
        startRecord: 0,
        endRecord: 0,
        sort: 'created', 
        direction: 'desc'
    });
}

/**
 * The `reuse-by-tracking-key-multiplayer` strategy creates or returns the most recent multiplayer run matching a given tracking key. You can optionally  also provide a "Run limit", and it'll prevent new runs from being created with this strategy once that limit has  been reached.
 *
 * ```
 *  const rm = new F.manager.RunManager({
 *      strategy: 'reuse-by-tracking-key-multiplayer',
 *      strategyOptions: {
 *          settings: {
 *              trackingKey: 'foobar'
 *          }
 *      }
 *  });
 *  ```
 *  Any runs created with this strategy will have a 'settings' field which returns the current settings for that run (when retreived with `getRun` or `reset`)
 * 
 * This strategy is used by the Settings Manager to apply class settings for turn-by-turn simulations, but can also be used stand-alone.
 *
 */
class MultiplayerWithTrackingKeyStrategy {
    /**
     * @param {object} [options] 
     * @property {object|function():object|function():Promise<object>} settings An object with trackingKey, runlimit, and any other key values; will be passed to `onCreate` function if provided
     * @property {string} settings.trackingKey Key to track runs with
     * @property {string} [settings.runLimit] Attempts to create new runs once limit is reach will return a `RUN_LIMIT_REACHED` error
     * @property {object} [settings.filter] Criteria to filter runs by, in addition to matching by tracking key (and user/group). Defaults to trashed: false
     * @property {function(RunService, object):any} [onCreate] Callback will be called each time a new run is created
     */
    constructor(options) {
        const defaults = {
            settings: {
                trackingKey: null,
                runLimit: Infinity,
            },
            filter: {
                trashed: false
            },
            onCreate: (runService, settings, run)=> run
        };
        const strategyOptions = options ? options.strategyOptions : {};
        this.options = $.extend(true, {}, defaults, strategyOptions);
    }

    getSettings(runService, userSession) {
        const settings = result(this.options.settings, runService, userSession);
        const prom = makePromise(settings).then((settings)=> {
            const key = settings && settings.trackingKey;
            if (!key) {
                return rejectPromise(errors.NO_TRACKING_KEY, 'No tracking key provided to reuse-by-tracking-key strategy');
            }
            return settings;
        });
        return prom;
    }

    _applySettingsToNewRun(runService, settings, run) {
        let prom = resolvePromise(run);

        if (!run.scope || run.scope.trackingKey !== settings.trackingKey) {
            prom = runService.save({
                scope: {
                    trackingKey: settings.trackingKey
                }
            });
        }
        return prom.then(()=> {
            const applied = this.options.onCreate(runService, settings, run);
            return makePromise(applied).then((res)=> {
                return res && res.id ? res : run; 
            }).then((run)=> {
                return $.extend(true, {}, run, { settings: settings });
            });
        });
    }
    _forceCreateRun(runService, userSession, settings, runCreateOptions) {
        const runConfig = omit(runService.getCurrentConfig(), ['id', 'filter']);
        const trackingKey = settings && settings.trackingKey;

        const scopeConfig = injectScopeFromSession(runConfig, userSession);
        const opt = $.extend(true, scopeConfig, {
            scope: { 
                trackingKey: trackingKey,
            }
        }, runCreateOptions);

        return reset(runService, userSession, opt).then((run)=> {
            return this._applySettingsToNewRun(runService, settings, run);
        });
    }

    checkIfWithinRunLimit(runService, userSession, settings) {
        const noRunLimit = settings.runLimit === Infinity || `${settings.runLimit}`.trim() === '';
        if (noRunLimit) {
            return $.Deferred().resolve(settings).promise();
        }
        return getCurrentWorld(runService, userSession).then((world)=> {
            const runFilter = makeFilter(settings.trackingKey, world.id, userSession, this.options.filter);
            return getRunsForFilter(runService, runFilter).then((runs, status, xhr)=> {
                const startedRuns = parseContentRange(xhr.getResponseHeader('content-range'));
                const runLimit = noRunLimit ? Infinity : +settings.runLimit;
                if (startedRuns && startedRuns.total >= runLimit) {
                    return rejectPromise(errors.RUN_LIMIT_REACHED, 'You have reached your run limit and cannot create new runs.');
                }
                return settings;
            });
        });
    }

    reset(runService, userSession, runCreateOptions) {
        return this.getSettings(runService, userSession).then((settings)=> {
            return this.checkIfWithinRunLimit(runService, userSession, settings);
        }).then((settings)=> {
            return this._forceCreateRun(runService, userSession, settings, runCreateOptions);
        });
    }

    getRun(runService, userSession, runSession, runCreateOptions) {
        return this.getSettings(runService, userSession).then((settings)=> {
            const { trackingKey } = settings; 
            const opt = $.extend(true, runCreateOptions, {
                scope: { 
                    trackingKey: trackingKey,
                }
            });
            return getRun(runService, userSession, opt).then((run)=> {
                if (run.freshlyCreated) {
                    return this._applySettingsToNewRun(runService, settings, run);
                }
                
                if (!run.scope || run.scope.trackingKey !== trackingKey) {
                    console.warn('Existing run has older settings. Reset to apply new settings');
                }
                return run;
            });
        });
    }
}

MultiplayerWithTrackingKeyStrategy.errors = errors;
export default MultiplayerWithTrackingKeyStrategy;