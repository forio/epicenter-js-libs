import strategies, { strategyKeys } from 'managers/run-strategies';
import * as specialOperations from './special-operations';

import RunService from 'service/run-api-service';
import SessionManager from 'store/session-manager';

import { isEmpty } from 'util/object-util';
import { STRATEGY_SESSION_KEY } from 'managers/key-names';

function patchRunService(service, manager) {
    if (service.patched) {
        return service;
    }

    const orig = service.do;
    service.do = function (operation, params, options) {
        const reservedOps = Object.keys(specialOperations);
        if (reservedOps.indexOf(operation) === -1) {
            return orig.apply(service, arguments);
        } else {
            return specialOperations[operation].call(service, params, options, manager);
        }
    };

    service.patched = true;

    return service;
}

function sessionKeyFromOptions(options, runService) {
    const config = runService.getCurrentConfig();
    const sessionKey = $.isFunction(options.sessionKey) ? options.sessionKey(config) : options.sessionKey;
    return sessionKey;
}

function setRunInSession(sessionKey, run, sessionManager) {
    if (sessionKey) {
        delete run.variables;
        sessionManager.getStore().set(sessionKey, JSON.stringify(run));
    }
}

class RunManager {
    /**
     * @param {AccountAPIServiceOptions} options 
     * @property {object} run
     * @property {string} run.model The name of your primary model file. (See more on [Writing your Model](../../../writing_your_model/).)
     * @property {string} [run.scope] Scope object for the run, for example `scope.group` with value of the name of the group.
     * @property {string[]} [run.files] If and only if you are using a Vensim model and you have additional data to pass in to your model, you can optionally pass a `files` object with the names of the files, for example: `"files": {"data": "myExtraData.xls"}`. (See more on [Using External Data in Vensim](../../../model_code/vensim/vensim_example_xls/).)
     * @property {string|function} [strategy] Run creation strategy for when to create a new run and when to reuse an end user's existing run. This is *optional*; by default, the Run Manager selects `reuse-per-session`, or `reuse-last-initialized` if you also pass in an initial operation. See [below](#using-the-run-manager-to-access-and-register-strategies) for more information on strategies.
     * @property {object} [strategyOptions] Additional options passed directly to the [run creation strategy](../strategies/).
     * @property {string} [sessionKey] Name of browser cookie in which to store run information, including run id. Many conditional strategies, including the provided strategies, rely on this browser cookie to store the run id and help make the decision of whether to create a new run or use an existing one. The name of this cookie defaults to `epicenter-scenario` and can be set with the `sessionKey` parameter. This can also be a function which returns a string, if you'd like to control this at runtithis.
     */
    constructor(options) {
        const defaults = {
            sessionKey: function (config) { 
                const baseKey = STRATEGY_SESSION_KEY;
                const key = ['account', 'project', 'model'].reduce(function (accum, key) {
                    return config[key] ? accum + '-' + config[key] : accum; 
                }, baseKey);
                return key;
            }
        };
        
        this.options = $.extend(true, {}, defaults, options);

        if (this.options.run instanceof RunService) {
            this.run = this.options.run;
        } else if (!isEmpty(this.options.run)) {
            this.run = new RunService(this.options.run);
        } else {
            throw new Error('No run options passed to RunManager');
        }
        patchRunService(this.run, this);
    
        this.strategy = strategies.getBestStrategy(this.options);
        this.sessionManager = new SessionManager(this.options);
    }

    /**
     * Returns the run object for the 'correct' run. The correct run is defined by the strategy. 
     *
     * For example, if the strategy is `reuse-never`, the call
     * to `getRun()` always returns a newly created run; if the strategy is `reuse-per-session`,
     * `getRun()` returns the run currently referenced in the browser cookie, and if there is none, creates a new run. 
     * See [Run Manager Strategies](../strategies/) for more on strategies.
     *
     * @example
     * rm.getRun().then(function (run) {
     *     // use the run object
     *     const thisRunId = run.id;
     *
     *     // use the Run Service object
     *     rm.run.do('runModel');
     * });
     *
     * rm.getRun(['sample_int']).then(function (run) {
     *    // an object whose fields are the name : value pairs of the variables passed to getRun()
     *    console.log(run.variables);
     *    // the value of sample_int
     *    console.log(run.variables.sample_int); 
     * });
     *
     * @param {string[]} [variables] The run object is populated with the provided model variables, if provided. Note: `getRun()` does not throw an error if you try to get a variable which doesn't exist. Instead, the variables list is empty, and any errors are logged to the console.
     * @param {Object} [options] Configuration options; passed on to [RunService#create](../run-api-service/#create) if the strategy does create a new run.
     * @return {JQuery.Promise} Promise to complete the call.
     */
    getRun(variables, options) {
        const sessionStore = this.sessionManager.getStore();

        const sessionContents = sessionStore.get(sessionKeyFromOptions(this.options, this.run));
        const runSession = JSON.parse(sessionContents || '{}');
        
        if (runSession.runId) {
            //Legacy: EpiJS < 2.2 used runId as key, so maintain comptaibility. Remove at some future date (Summer `17?)
            runSession.id = runSession.runId;
        }

        const authSession = this.sessionManager.getSession();
        if (this.strategy.requiresAuth && isEmpty(authSession)) {
            console.error('No user-session available', this.options.strategy, 'requires authentication.');
            return $.Deferred().reject({ type: 'UNAUTHORIZED', message: 'No user-session available' }).promise();
        }
        if (this.fetchProm) {
            console.warn('Two simultaneous calls to `getRun` detected on the same RunManager instance. Either create different instances, or eliminate duplicate call');
            return this.fetchProm;
        }


        this.fetchProm = this.strategy
            .getRun(this.run, authSession, runSession, options).then((run)=> {
                if (!run || !run.id) {
                    return run;
                }

                this.run.updateConfig({ filter: run.id });
                const canCache = this.strategy.allowRunIDCache !== false;
                if (canCache) {
                    const sessionKey = sessionKeyFromOptions(this.options, this.run);
                    setRunInSession(sessionKey, run, this.sessionManager);
                }

                if (!variables || !variables.length) {
                    return run;
                }
                return this.run.variables().query(variables).then(function (results) {
                    run.variables = results;
                    return run;
                }).catch(function (err) {
                    run.variables = {};
                    console.error('RunManager variables fetch error', err);
                    return run;
                });
            }).then((r)=> {
                this.fetchProm = null;
                return r;
            }, (err)=> {
                this.fetchProm = null;
                throw err;
            });
        return this.fetchProm;
    }

    /**
     * Returns the run object for a 'reset' run. The definition of a reset is defined by the strategy, but typically means forcing the creation of a new run. For example, `reset()` for the default strategies `reuse-per-session` and `reuse-last-initialized` both create new runs.
     *
     * @example
     * rm.reset().then(function (run) {
     *     // use the (new) run object
     *     const thisRunId = run.id;
     *
     *     // use the Run Service object
     *     rm.run.do('runModel');
     * });
     *
     * @param {Object} [options] Configuration options; passed on to [RunService#create](../run-api-service/#create).
     * @return {Promise}
     */
    reset(options) {
        const authSession = this.sessionManager.getSession();
        if (this.strategy.requiresAuth && isEmpty(authSession)) {
            console.error('No user-session available', this.options.strategy, 'requires authentication.');
            return $.Deferred().reject({ type: 'UNAUTHORIZED', message: 'No user-session available' }).promise();
        }
        return this.strategy.reset(this.run, authSession, options).then((run)=> {
            if (run && run.id) {
                this.run.updateConfig({ filter: run.id });
                const canCache = this.strategy.allowRunIDCache !== false;
                if (canCache) {
                    const sessionKey = sessionKeyFromOptions(this.options, this.run);
                    setRunInSession(sessionKey, run.id, this.sessionManager);
                }
            }
            return run;
        });
    }
}

RunManager.STRATEGY = strategyKeys;
RunManager.strategies = strategies;
export default RunManager;
