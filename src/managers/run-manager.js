'use strict';
var strategiesMap = require('./run-strategies/strategies-map');
var RunService = require('../service/run-api-service');

var defaults = {
    strategy: 'new-if-simulated'
};

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
*   ... other options to pass to the run adapter ...
*
* **Example**
*      var rm = new F.manager.RunManager({
*          account: 'acme-simulations',
*          project: 'supply-chain-game',
*          model: 'model.vmf',
*          strategy: 'new-if-persisted',
*          service: {
*             host: 'api.forio.com'
*          }
*      });
*
*      rs.getRun()
*          .then(function(run) {
*              // start the game... we have a valid run
*
*           });
*
**/
function RunManager(options) {
    this.options = $.extend(true, {}, defaults, options);
    this.run = new RunService(this.options);

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
    reset: function () {
        return this.strategy.reset();
    }
};

module.exports = RunManager;
