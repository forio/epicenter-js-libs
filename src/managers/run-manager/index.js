/**
* ## Run Manager
*
* The Run Manager gives you access to runs for your project. This allows you to read and update variables, call operations, etc. Additionally, the Run Manager gives you control over run creation depending on run states. Specifically, you can select [run creation strategies (rules)](../strategies/) for which runs end users of your project work with when they log in to your project.
*
* There are many ways to create new runs, including the Epicenter.js [Run Service](../run-api-service/) and the RESFTful [Run API](../../../rest_apis/aggregate_run_api). However, for some projects it makes more sense to pick up where the user left off, using an existing run. And in some projects, whether to create a new run or use an existing one is conditional, for example based on characteristics of the existing run or your own knowledge about the model. The Run Manager provides this level of control: your call to `getRun()`, rather than always returning a new run, returns a run based on the strategy you've specified.
*
*
* ### Using the Run Manager to create and access runs
*
* To use the Run Manager, instantiate it by passing in:
*
*   * `run`: (required) Run object. Must contain:
*       * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
*       * `project`: Epicenter project id.
*       * `model`: The name of your primary model file. (See more on [Writing your Model](../../../writing_your_model/).)
*       * `scope`: (optional) Scope object for the run, for example `scope.group` with value of the name of the group.
*       * `server`: (optional) An object with one field, `host`. The value of `host` is the string `api.forio.com`, the URI of the Forio server. This is automatically set, but you can pass it explicitly if desired. It is most commonly used for clarity when you are [hosting an Epicenter project on your own server](../../../how_to/self_hosting/).
*       * `files`: (optional) If and only if you are using a Vensim model and you have additional data to pass in to your model, you can optionally pass a `files` object with the names of the files, for example: `"files": {"data": "myExtraData.xls"}`. (See more on [Using External Data in Vensim](../../../model_code/vensim/vensim_example_xls/).)
*
*   * `strategy`: (optional) Run creation strategy for when to create a new run and when to reuse an end user's existing run. This is *optional*; by default, the Run Manager selects `reuse-per-session`, or `reuse-last-initialized` if you also pass in an initial operation. See [below](#using-the-run-manager-to-access-and-register-strategies) for more information on strategies.
*   * `strategyOptions`: (optional) Additional options passed directly to the [run creation strategy](../strategies/).
*   * `sessionKey`: (optional) Name of browser cookie in which to store run information, including run id. Many conditional strategies, including the provided strategies, rely on this browser cookie to store the run id and help make the decision of whether to create a new run or use an existing one. The name of this cookie defaults to `epicenter-scenario` and can be set with the `sessionKey` parameter. This can also be a function which returns a string, if you'd like to control this at runtime.
*
*
* After instantiating a Run Manager, make a call to `getRun()` whenever you need to access a run for this end user. The `RunManager.run` contains the instantiated [Run Service](../run-api-service/). The Run Service allows you to access variables, call operations, etc.
*
* **Example**
*
*       const rm = new F.manager.RunManager({
*           run: {
*               account: 'acme-simulations',
*               project: 'supply-chain-game',
*               model: 'supply-chain-model.jl',
*               server: { host: 'api.forio.com' }
*           },
*           strategy: 'reuse-never',
*           sessionKey: 'epicenter-session'
*       });
*       rm.getRun()
*           .then(function(run) {
*               // the return value of getRun() is a run object
*               const thisRunId = run.id;
*               // the RunManager.run also contains the instantiated Run Service,
*               // so any Run Service method is valid here
*               rm.run.do('runModel');
*       })
*
*
* ### Using the Run Manager to access and register strategies
*
* The `strategy` for a Run Manager describes when to create a new run and when to reuse an end user's existing run. The Run Manager is responsible for passing a strategy everything it might need to determine the 'correct' run, that is, how to find the best existing run and how to decide when to create a new run.
*
* There are several common strategies provided as part of Epicenter.js, which you can list by accessing `F.manager.RunManager.strategies`. You can also create your own strategies, and register them to use with Run Managers. See [Run Manager Strategies](../strategies/) for details.
* 
*/

'use strict';
import strategies, { getBestStrategy } from 'managers/run-strategies';
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
    
        this.strategy = getBestStrategy(this.options);
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
     *  **Example**
     *
     *      rm.getRun().then(function (run) {
     *          // use the run object
     *          const thisRunId = run.id;
     *
     *          // use the Run Service object
     *          rm.run.do('runModel');
     *      });
     *
     *      rm.getRun(['sample_int']).then(function (run) {
     *         // an object whose fields are the name : value pairs of the variables passed to getRun()
     *         console.log(run.variables);
     *         // the value of sample_int
     *         console.log(run.variables.sample_int); 
     *      });
     *
     * @param {string[]} [variables] The run object is populated with the provided model variables, if provided. Note: `getRun()` does not throw an error if you try to get a variable which doesn't exist. Instead, the variables list is empty, and any errors are logged to the console.
     * @param {Object} [options] Configuration options; passed on to [RunService#create](../run-api-service/#create) if the strategy does create a new run.
     * @return {Promise} Promise to complete the call.
     */
    getRun(variables, options) {
        const me = this;
        const sessionStore = this.sessionManager.getStore();

        const sessionContents = sessionStore.get(sessionKeyFromOptions(this.options, me.run));
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
        return this.strategy
            .getRun(this.run, authSession, runSession, options).then(function (run) {
                if (run && run.id) {
                    me.run.updateConfig({ filter: run.id });
                    const sessionKey = sessionKeyFromOptions(me.options, me.run);
                    setRunInSession(sessionKey, run, me.sessionManager);

                    if (variables && variables.length) {
                        return me.run.variables().query(variables).then(function (results) {
                            run.variables = results;
                            return run;
                        }).catch(function (err) {
                            run.variables = {};
                            console.error(err);
                            return run;
                        });
                    }
                }
                return run;
            });
    }

    /**
     * Returns the run object for a 'reset' run. The definition of a reset is defined by the strategy, but typically means forcing the creation of a new run. For example, `reset()` for the default strategies `reuse-per-session` and `reuse-last-initialized` both create new runs.
     *
     *  **Example**
     *
     *      rm.reset().then(function (run) {
     *          // use the (new) run object
     *          const thisRunId = run.id;
     *
     *          // use the Run Service object
     *          rm.run.do('runModel');
     *      });
     *
     * **Parameters**
     * @param {Object} [options] Configuration options; passed on to [RunService#create](../run-api-service/#create).
     * @return {Promise}
     */
    reset(options) {
        const me = this;
        const authSession = this.sessionManager.getSession();
        if (this.strategy.requiresAuth && isEmpty(authSession)) {
            console.error('No user-session available', this.options.strategy, 'requires authentication.');
            return $.Deferred().reject({ type: 'UNAUTHORIZED', message: 'No user-session available' }).promise();
        }
        return this.strategy.reset(this.run, authSession, options).then(function (run) {
            if (run && run.id) {
                me.run.updateConfig({ filter: run.id });
                const sessionKey = sessionKeyFromOptions(me.options, me.run);
                setRunInSession(sessionKey, run.id, me.sessionManager);
            }
            return run;
        });
    }
}

RunManager.strategies = strategies;
export default RunManager;
