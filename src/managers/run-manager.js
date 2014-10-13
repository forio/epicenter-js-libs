'use strict';
var strategiesMap = require('./run-strategies/strategies-map');
var RunService = require('../service/run-api-service');

var defaults = {
    strategy: 'new-if-simulated'
};

/**
* A Run Manager to help with run creation strategies depending on run state
*
* params:
*   account: Epicenter account
*   project: Epicenter project
*   model: Simulation model to create the run against
*   strategy: (optional) Run creation strategy. Default: new-if-persisted
*
**/
function RunManager(options) {
    this.options = $.extend(true, {}, defaults, options);
    this.run = this.options.run || new RunService(this.options);

    var StrategyCtor = typeof this.options.strategy === 'function' ? this.options.strategy : strategiesMap[this.options.strategy];

    if (!StrategyCtor) {
        throw new Error('Specified run creation strategy was invalid:', this.options.strategy);
    }

    this.strategy = new StrategyCtor(this.run, this.options);
}

RunManager.prototype = {
    getRun: function () {
        return this.strategy
            .getRun(this.options.model);
    },

    reset: function () {
        return this.strategy.reset();
    }
};

module.exports = RunManager;
