/**
* ## Run Manager
*
* The Run Manager gives you access to runs for your project. This allows you to read and update variables, call operations, etc. Additionally, the Run Manager gives you control over run creation depending on run states. Specifically, you can select [run creation strategies (rules)](../strategies/) for which runs end users of your project work with when they log in to your project.
*
* There are many ways to create new runs, including the Epicenter.js [Run Service](../run-api-service/), the RESFTful [Run API](../../../rest_apis/aggregate_run_api) and the [Model Run API](../../../rest_apis/other_apis/model_apis/run/). However, for some projects it makes more sense to pick up where the user left off, using an existing run. And in some projects, whether to create a new run or use an existing one is conditional, for example based on characteristics of the existing run or your own knowledge about the model. The Run Manager provides this level of control: your call to `getRun()`, rather than always returning a new run, returns a run based on the strategy you've specified. (Note that many of the Epicenter sample projects use a Run Service directly, because generally the sample projects are played in one end user session and don't care about run states or run strategies.)
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
*       * `files`: (optional) If and only if you are using a Vensim model and you have additional data to pass in to your model, you can pass a `files` object with the names of the files, for example: `"files": {"data": "myExtraData.xls"}`. (Note that you'll also need to add this same files object to your Vensim [configuration file](../../../model_code/vensim/).) See the [underlying Model Run API](../../../rest_apis/other_apis/model_apis/run/#post-creating-a-new-run-for-this-project) for additional information.
*
*   * `strategy`: (optional) Run creation strategy for when to create a new run and when to reuse an end user's existing run. See [Run Manager Strategies](../strategies/) for details. Defaults to `new-if-initialized`.
*
*   * `sessionKey`: (optional) Name of browser cookie in which to store run information, including run id. Many conditional strategies, including the provided strategies, rely on this browser cookie to store the run id and help make the decision of whether to create a new run or use an existing one. The name of this cookie defaults to `epicenter-scenario` and can be set with the `sessionKey` parameter.
*
*
* After instantiating a Run Manager, make a call to `getRun()` whenever you need to access a run for this end user. The `RunManager.run` contains the instantiated [Run Service](../run-api-service/). The Run Service allows you to access variables, call operations, etc.
*
* **Example**
*
*       var rm = new F.manager.RunManager({
*           run: {
*               account: 'acme-simulations',
*               project: 'supply-chain-game',
*               model: 'supply-chain-model.jl',
*               server: { host: 'api.forio.com' }
*           },
*           strategy: 'always-new',
*           sessionKey: 'epicenter-session'
*       });
*       rm.getRun()
*           .then(function(run) {
*               // the return value of getRun() is a run object
*               var thisRunId = run.id;
*               // the RunManager.run also contains the instantiated Run Service,
*               // so any Run Service method is valid here
*               rm.run.do('runModel');
*       })
*
*/

'use strict';
var strategies = require('./run-strategies');
var specialOperations = require('./special-operations');
var RunService = require('../service/run-api-service');
var SessionManager = require('../store/session-manager');

var util = require('../util/object-util');
var keyNames = require('./key-names');

function patchRunService(service, manager) {
    if (service.patched) {
        return service;
    }

    var orig = service.do;
    service.do = function (operation, params, options) {
        var reservedOps = Object.keys(specialOperations);
        if (reservedOps.indexOf(operation) === -1) {
            return orig.apply(service, arguments);
        } else {
            return specialOperations[operation].call(service, params, options, manager);
        }
    };

    service.patched = true;

    return service;
}

function setRunInSession(sessionKey, runid, sessionManager) {
    if (sessionKey) {
        sessionManager.getStore().set(sessionKey, JSON.stringify({ runId: runid }));
    }
}

var defaults = {
    sessionKey: keyNames.STRATEGY_SESSION_KEY,

    /**
     * Run creation strategy for when to create a new run and when to reuse an end user's existing run. See [Run Manager Strategies](../strategies/) for details. Defaults to `new-if-initialized`.
     * @type {String}
     */
    strategy: 'new-if-missing'
};

function RunManager(options) {
    this.options = $.extend(true, {}, defaults, options);

    if (this.options.run instanceof RunService) {
        this.run = this.options.run;
    } else if (this.options.run) {
        this.run = new RunService(this.options.run);
    } else {
        throw new Error('No run options passed to RunManager');
    }
    patchRunService(this.run, this);

    var StrategyCtor = typeof this.options.strategy === 'function' ? this.options.strategy : strategies.get(this.options.strategy);
    if (!StrategyCtor) {
        throw new Error('Specified run creation strategy was invalid:', this.options.strategy);
    }
    var strategy = new StrategyCtor(this.options);
    if (!strategy.getRun || !strategy.reset) {
        throw new Error('All strategies should implement a `getRun` and `reset` interface', this.options.strategy);
    }
    strategy.requiresAuth = StrategyCtor.requiresAuth;
    this.strategy = strategy;

    this.sessionManager = new SessionManager(this.options);
}

RunManager.prototype = {
    /**
     * Returns the run object for a 'good' run.
     *
     * A good run is defined by the strategy. For example, if the strategy is `always-new`, the call
     * to `getRun()` always returns a newly created run; if the strategy is `new-if-persisted`,
     * `getRun()` creates a new run if the previous run is in a persisted state, otherwise
     * it returns the previous run. See [Run Manager Strategies](../strategies/) for more on strategies.
     *
     *  **Example**
     *
     *      rm.getRun().then(function (run) {
     *          // use the run object
     *          var thisRunId = run.id;
     *
     *          // use the Run Service object
     *          rm.run.do('runModel');
     *      });
     *
     * @param {Array} variables (Optional) if provided it'll populate the run it gets with the provided variables.
     * @param {Object} options (Optional) these will be passed on to RunService#create if the strategy does create a new run
     * @return {$promise} Promise to complete the call.
     */
    getRun: function (variables, options) {
        var me = this;
        var sessionStore = this.sessionManager.getStore();
        var runSession = JSON.parse(sessionStore.get(this.options.sessionKey) || '{}');
        var runid = runSession && runSession.runId;

        var authSession = this.sessionManager.getSession();
        if (this.strategy.requiresAuth && util.isEmpty(authSession)) {
            console.error('No user-session available', this.options.strategy, 'requires authentication.');
            return $.Deferred().reject('No user-session available').promise();
        }
        return this.strategy
                .getRun(this.run, authSession, runid, options).then(function (run) {
                    if (run && run.id) {
                        setRunInSession(me.options.sessionKey, run.id, me.sessionManager);
                        me.run.updateConfig({ filter: run.id });

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
    },

    /**
     * Returns the run object for a new run, regardless of strategy: force creation of a new run.
     *
     *  **Example**
     *
     *      rm.reset().then(function (run) {
     *          // use the (new) run object
     *          var thisRunId = run.id;
     *
     *          // use the Run Service object
     *          rm.run.do('runModel');
     *      });
     *
     * **Parameters**
     * @return {Promise}
     */
    reset: function (options) {
        var me = this;
        var authSession = this.sessionManager.getSession();
        if (this.strategy.requiresAuth && util.isEmpty(authSession)) {
            console.error('No user-session available', this.options.strategy, 'requires authentication.');
            return $.Deferred().reject('No user-session available').promise();
        }
        return this.strategy.reset(this.run, authSession, options).then(function (run) {
            if (run && run.id) {
                setRunInSession(me.options.sessionKey, run.id, me.sessionManager);
                me.run.updateConfig({ filter: run.id });
            }
            return run;
        });
    }
};

RunManager.strategies = strategies;
module.exports = RunManager;
