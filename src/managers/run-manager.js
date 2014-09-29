(function () {
    'use strict';

    var root = this;
    var F = root.F;

    var $, strategiesMap;

    if (typeof require !== 'undefined') {
        $ = require('jquery');
        strategiesMap = require('./strategies/strategies-map');
    } else {
        $ = root.jQuery;
        strategiesMap = F.manager.strategy.map;
    }


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
        this.run = this.options.run || new F.service.Run(this.options);

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



    if (typeof exports !== 'undefined') {
        module.exports = RunManager;
    }
    else {
        if (!root.F) { root.F = {};}
        if (!root.F.manager) { root.F.manager = {};}
        root.F.manager.RunManager = RunManager;
    }


}).call(this);
