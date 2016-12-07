'use strict';

var RunManager = require('./run-manager');
var SessionManager = require('../store/session-manager');
var SavedRunsManager = require('./saved-run-manager');

var defaults = {
    baselineRunName: 'Baseline',
};

function ScenarioManager(config) {
    var sessionManager = new SessionManager();
    var serviceOptions = sessionManager.getMergedOptions(defaults, config);
    this.baseline = new RunManager({
        strategy: 'baseline',
        sessionKey: 'sm-baseline-run',
        run: serviceOptions,
    });
    this.current = new RunManager({
        strategy: 'new-if-stepped',
        sessionKey: 'sm-current-run',
        run: serviceOptions,
    });

    var baseLineProm = this.baseline.getRun();

    this.savedRuns = new SavedRunsManager({
        run: serviceOptions,
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
