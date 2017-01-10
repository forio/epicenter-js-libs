'use strict';

var RunManager = require('./run-manager');
var SavedRunsManager = require('./saved-run-manager');

var defaults = {
    baselineRunName: 'Baseline',
};

var BaselineStrategy = require('./scenario-strategies/baseline-strategy');
var LastUnsavedStrategy = require('./scenario-strategies/reuse-last-unsaved');

function ScenarioManager(config) {
    var serviceOptions = $.extend(true, {}, defaults, config);

    this.baseline = new RunManager({
        strategy: BaselineStrategy,
        sessionKey: 'sm-baseline-run',
        run: serviceOptions.run,
    });
    this.current = new RunManager({
        strategy: LastUnsavedStrategy,
        sessionKey: 'sm-current-run',
        run: serviceOptions.run,
    });

    this.savedRuns = new SavedRunsManager({
        run: serviceOptions.run,
    });

    var origGetRuns = this.savedRuns.getRuns;
    var me = this;
    this.savedRuns.getRuns = function () {
        var args = Array.apply(null, arguments);
        return me.baseline.getRun().then(function () {
            return origGetRuns.apply(me.savedRuns, args);
        });
    };

    //FIXME: This is too dependent on 'step' being available, make configurable
    this.current.save = function (metadata, operations) {
        return me.current.getRun().then(function () {
            return me.current.run.do({ stepTo: 'end' });
        }).then(function () {
            return me.savedRuns.save(me.current.run, metadata);
        });
    };
}

module.exports = ScenarioManager;
