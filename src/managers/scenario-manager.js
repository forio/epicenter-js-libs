'use strict';

var RunManager = require('./run-manager');
var SavedRunsManager = require('./saved-run-manager');

var defaults = {
    baselineRunName: 'Baseline',
};

function ScenarioManager(config) {
    var serviceOptions = $.extend(true, {}, defaults, config);

    this.baseline = new RunManager({
        strategy: 'baseline',
        sessionKey: 'sm-baseline-run',
        run: serviceOptions.run,
    });
    this.current = new RunManager({
        strategy: 'new-if-stepped',
        sessionKey: 'sm-current-run',
        run: serviceOptions.run,
    });

    //TODO: Creating on init to make sure the 'getruns' call sees this, but ajax on constructor sounds unexpected. Maybe do it on 'getRuns' instead?
    var baseLineProm = this.baseline.getRun();

    this.savedRuns = new SavedRunsManager({
        run: serviceOptions.run,
    });

    var orig = this.savedRuns.getRuns;
    this.savedRuns.getRuns = function () {
        var args = Array.apply(null, arguments);
        var me = this;
        return baseLineProm.then(function () {
            return orig.apply(me.savedRuns, args);
        });
    };
}

module.exports = ScenarioManager;
