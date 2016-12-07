'use strict';

var RunManager = require('./run-manager');
var SessionManager = require('../store/session-manager');
var SavedRunsManager = require('./saved-run-manager');

var defaults = {
    token: undefined,
    account: undefined,
    project: undefined,
    model: undefined,

    baselineRunName: 'Baseline',
};

function ScenarioManager(config) {
    var sessionManager = new SessionManager();
    this.serviceOptions = sessionManager.getMergedOptions(defaults, config);
    this.baseline = new RunManager({
        strategy: 'baseline',
        sessionKey: 'sm-baseline-run',
        run: this.serviceOptions,
    });
    this.current = new RunManager({
        strategy: 'new-if-stepped',
        sessionKey: 'sm-current-run',
        run: this.serviceOptions,
    });

    var baseLineProm = this.baseline.getRun();

    this.savedRuns = new SavedRunsManager(this.serviceOptions);

    var orig = this.savedRuns.getRuns;
    this.savedRuns.getRuns = function () {
        var args = arguments;
        var me = this;
        return baseLineProm.then(function () {
            return orig.apply(me.savedRuns, args);
        });
    };
}

module.exports = ScenarioManager;
