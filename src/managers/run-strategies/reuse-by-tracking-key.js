import RunService from 'service/run-api-service';
import { parseContentRange } from 'util/run-util';
import { injectScopeFromSession, injectFiltersFromSession } from './strategy-utils';
import { result, makePromise, rejectPromise } from 'util/index';

const errors = {
    RUN_LIMIT_REACHED: 'RUN_LIMIT_REACHED',
    NO_TRACKING_KEY: 'NO_TRACKING_KEY'
};


/**
 * @param {RunService} runService 
 * @param {string} trackingKey 
 * @param {object} userSession 
 * @returns {Promise<object[]>}
 */
function getRunsForKey(runService, trackingKey, userSession) {
    const filter = injectFiltersFromSession({
        scope: {
            trackingKey: trackingKey
        }
    }, userSession);

    return runService.query(filter, {
        startRecord: 0,
        endRecord: 0,
        sort: 'created', 
        direction: 'desc'
    });
}

/**
 * The `reuse-by-tracking-key` strategy creates or returns the most recent run matching a given tracking key. You can optionally  also provide a "Run limit", and it'll prevent new runs from being created with this strategy once that limit has  been reached.
 *
 * This strategy is used by the Settings Manager to apply class settings for turn-by-turn simulations, but can also be used stand-alone.
 *
 * @name reuse-by-tracking-key
 */
class ReuseWithTrackingKeyStrategy {
    /**
     * @param {object} [options] 
     * @property {object|function():object|function():Promise<object>} settings An object with trackingKey, runlimit, and any other key values; will be passed to `onCreate` function if provided
     * @property {string} settings.trackingKey Key to track runs with
     * @property {string} [settings.runLimit] Attempts to create new runs once limit is reach will return a `RUN_LIMIT_REACHED` error
     * @property {function(RunService, object):any} [onCreate] Callback will be called each time a new run is created
     */
    constructor(options) {
        const defaults = {
            settings: {
                trackingKey: null,
                runLimit: Infinity,
            },
            onCreate: (runService, settings, run)=> run
        };
        const strategyOptions = options ? options.strategyOptions : {};
        this.options = $.extend(true, {}, defaults, strategyOptions);
    }

    getSettings() {
        const settings = result(this.options.settings);
        const prom = makePromise(settings).then((settings)=> {
            const key = settings && settings.trackingKey;
            if (!key) {
                return rejectPromise(errors.NO_TRACKING_KEY, 'No tracking key provided to reuse-by-tracking-key strategy');
            }
            return settings;
        });
        return prom;
    }

    forceCreateRun(runService, userSession, settings) {
        const runConfig = runService.getCurrentConfig();
        const trackingKey = settings && settings.trackingKey;

        const createOptions = injectScopeFromSession(runConfig, userSession);
        const opt = $.extend(true, createOptions, {
            scope: { 
                trackingKey: trackingKey,
            }
        });
        return runService.create(opt).then((run)=> {
            const applied = this.options.onCreate(runService, settings, run);
            return makePromise(applied).then((res)=> {
                return res && res.id ? res : run; 
            });
        });
    }
    reset(runService, userSession, options) {
        return this.getSettings().then((settings)=> {
            return getRunsForKey(runService, settings.trackingKey, userSession).then((runs, status, xhr)=> {
                const startedRuns = parseContentRange(xhr.getResponseHeader('content-range'));
                const runLimitNotSet = settings.runLimit === Infinity || `${settings.runLimit}`.trim() === '';
                const runLimit = runLimitNotSet ? Infinity : +settings.runLimit;
                if (startedRuns && startedRuns.total >= runLimit) {
                    return rejectPromise(errors.RUN_LIMIT_REACHED, 'You have reached your run limit and cannot create new runs.');
                }
                return this.forceCreateRun(runService, userSession, settings);
            });
        });
    }

    getRun(runService, userSession, runSession, options) {
        return this.getSettings().then((settings)=> {
            return getRunsForKey(runService, settings.trackingKey, userSession).then((runs)=> {
                if (!runs.length) {
                    return this.forceCreateRun(runService, userSession, settings);
                }
                return runs[0];
            });
        });
    }
}

ReuseWithTrackingKeyStrategy.errors = errors;
export default ReuseWithTrackingKeyStrategy;