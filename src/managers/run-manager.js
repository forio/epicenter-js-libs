'use strict';
var strategiesMap = require('./run-strategies/strategies-map');
var specialOperations = require('./special-operations');
var RunService = require('../service/run-api-service');

var defaults = {
    strategy: 'new-if-simulated'
};

function patchRunService(service, manager) {
    if (service.patched) {
        return service;
    }

    var orig = service.do;
    service.do = function(operation, params, options) {
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

/**
* ## A Run Manager to help with run creation strategies depending on run state
*
* **parameters**
* @param {object} `options` The options object to configure the manager and run
*
*   strategy: (optional) Run creation strategy. Default: new-if-persisted
*
*   account: Epicenter account
*   project: Epicenter project
*   model: Simulation model to create the run against
*   scope: (optional) scope object for the run
*   file: (optional)
*
*   ... other options to pass to the run adapter instance (ie. options.run = runAdapter ) ...
*
* **Example**
*      var rm = new F.manager.RunManager({
*           run: {
*              account: 'acme-simulations',
*              project: 'supply-chain-game',
*              model: 'model.vmf',
*              service: {
*                 host: 'api.forio.com'
*              }
*           }
*           strategy: 'new-if-persisted',
*           sessionKey: 'epicenter-session'
*      });
*
*      rs.getRun()
*          .then(function(run) {
*              // start the game... we have a valid run
*           });
*
*
**/
function RunManager(options) {
    this.options = $.extend(true, {}, defaults, options);

    if (this.options.run instanceof RunService) {
        this.run = this.options.run;
    } else {
        this.run = new RunService(this.options.run);
    }

    patchRunService(this.run, this);

    var StrategyCtor = typeof this.options.strategy === 'function' ? this.options.strategy : strategiesMap[this.options.strategy];

    if (!StrategyCtor) {
        throw new Error('Specified run creation strategy was invalid:', this.options.strategy);
    }

    this.strategy = new StrategyCtor(this.run, this.options);
}

RunManager.prototype = {
    /**
     * Get a 'good' run.
     * A good run is defined by the strategy. For example if the strategy is always-new, the call
     * to getRun() will always return a newly created run, if the strategy is new-if-persisted
     * getRun() will create a new run if the previous run is in a persisted state, otherwise
     * it will return the previous run
     *
     *  **Example**
     *
     *      rm.getRun().then(function (run) {
     *          // use the run object here.
     *      });
     *
     */
    getRun: function () {
        return this.strategy
                .getRun();
    },

    /**
     * Force to create a new run.
     *
     *  **Example**
     *
     *      rm.reset().then(function (run) {
     *          // use the new run here.
     *      });
     *
     */
    reset: function (runServiceOptions) {
        return this.strategy.reset(runServiceOptions);
    }
};

module.exports = RunManager;
