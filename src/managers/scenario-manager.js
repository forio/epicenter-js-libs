'use strict';

var RunManager = require('./run-manager');
var SavedRunsManager = require('./saved-run-manager');

var defaults = {
    baselineRunName: 'Baseline',
    advanceOperation: [{ stepTo: 'end' }]
};

var BaselineStrategy = require('./scenario-strategies/baseline-strategy');
var LastUnsavedStrategy = require('./scenario-strategies/reuse-last-unsaved');

function ScenarioManager(config) {
    var opts = $.extend(true, {}, defaults, config);
    if (config && config.advanceOperation) {
        opts.advanceOperation = config.advanceOperation; //jquery.extend does a poor job trying to merge arrays
    }
    this.baseline = new RunManager({
        strategy: BaselineStrategy,
        sessionKey: 'sm-baseline-run',
        run: opts.run,
        strategyOptions: {
            baselineName: opts.baselineRunName,
            initOperation: opts.advanceOperation
        }
    });

    var ignoreOperations = ([].concat(opts.advanceOperation)).map(function (opn) {
        return Object.keys(opn)[0];
    });
    this.current = new RunManager({
        strategy: LastUnsavedStrategy,
        sessionKey: 'sm-current-run',
        run: opts.run,
        strategyOptions: {
            ignoreOperations: ignoreOperations
        }
    });

    
    this.savedRuns = new SavedRunsManager($.extend(true, {}, opts.savedRuns, {
        run: opts.run,
    }));

    var origGetRuns = this.savedRuns.getRuns;
    var me = this;
    this.savedRuns.getRuns = function () {
        var args = Array.apply(null, arguments);
        return me.baseline.getRun().then(function () {
            return origGetRuns.apply(me.savedRuns, args);
        });
    };

    this.current.save = function (metadata, operations) {
        return me.current.getRun().then(function () {
            return me.current.run.serial(opts.advanceOperation);
        }).then(function () {
            return me.savedRuns.save(me.current.run, metadata);
        });
    };
}

module.exports = ScenarioManager;
