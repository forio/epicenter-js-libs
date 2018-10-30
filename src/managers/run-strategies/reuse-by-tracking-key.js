import RunService from 'service/run-api-service';
import { parseContentRange } from 'util/run-util';
import { injectScopeFromSession, injectFiltersFromSession } from './strategy-utils';
import { result, makePromise } from 'util/index';

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

export default class ReuseWithTrackingKeyStrategy {
    constructor(options) {
        const defaults = {
            settings: {
                trackingKey: null,
                runLimit: Infinity,
            },
            onCreate: function (runService) {

            }
        };
        const strategyOptions = options ? options.strategyOptions : {};
        this.options = $.extend(true, {}, defaults, strategyOptions);
    }

    getSettings() {
        const settings = result(this.options.settings);
        const prom = makePromise(settings).then((settings)=> {
            const key = settings && settings.trackingKey;
            if (!key) {
                throw new Error(errors.NO_TRACKING_KEY);
            }
            return settings;
        });
        return prom;
    }

    forceCreateRun(runService, userSession, settings) {
        const runConfig = runService.getCurrentConfig();
        const dupeRunService = new RunService(runConfig);
        const trackingKey = settings && settings.trackingKey;

        const createOptions = injectScopeFromSession(runConfig, userSession);
        const opt = $.extend(true, createOptions, {
            scope: { 
                trackingKey: trackingKey,
            }
        });
        return runService.create(opt).then((run)=> {
            const applied = this.options.onCreate(dupeRunService, settings);
            return $.Deferred().resolve(applied).promise().then(()=> run);
        });
    }

    reset(runService, userSession, options) {
        return this.getSettings().then((settings)=> {
            return getRunsForKey(runService, settings.trackingKey, userSession).then((runs, status, xhr)=> {
                const startedRuns = parseContentRange(xhr.getResponseHeader('content-range'));
                const runCount = startedRuns.total;
                if (runCount >= this.options.runLimit) {
                    throw new Error(errors.RUN_LIMIT_REACHED);
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