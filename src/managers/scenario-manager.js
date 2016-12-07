'use strict';

var RunManager = require('./run-manager');
var RunService = require('../service/run-api-service');
var SessionManager = require('../store/session-manager');

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
    this.baselineManager = new RunManager({
        strategy: 'baseline',
        sessionKey: 'sm-baseline-run',
        run: this.serviceOptions,
    });
    this.currentRunManager = new RunManager({
        strategy: 'new-if-stepped',
        sessionKey: 'sm-current-run',
        run: this.serviceOptions,
    });

    this.runService = new RunService(this.serviceOptions);

    this.baseLineProm = this.baselineManager.getRun();
}

ScenarioManager.prototype = {
    getBaseLineRun: function () {
        return this.baseLineProm;
    },
    resetBaseLine: function () {
        return this.baselineManager.reset();
    },

    getCurrentRun: function () {
        return this.currentRunManager.getRun();
    },
    resetCurrentRun: function () {
        return this.currentRunManager.reset();
    },

    mark: function (run, toMark) {
        var rs = (run instanceof RunService) ? run : new RunService({ id: run });
        return rs.save(toMark);
    },
    saveRun: function (run, name, isSaved) {
        var val = !(isSaved === false);
        var param = { saved: val };
        if (name) {
            param.name = name;
        }
        return this.mark(run, param);
    },
    archiveRun: function (run, isTrashed) {
        var val = !(isTrashed === false);
        return this.mark(run, { trashed: val });
    },

    getSavedRuns: function (variables, options) {
        //TODO: Add group/user scope filters here
        var opModifiers = {
            sort: 'created',
            direction: 'asc'
        };
        var me = this;
        return this.baseLineProm.then(function () {
            return me.runService.query({ saved: true, trashed: false }, opModifiers).then(function (savedRuns) {
                if (!variables || !variables.length) {
                    return savedRuns;
                }
                var promises = savedRuns.map(function (run) {
                    var prom = me.runService.variables().query([].concat(variables), {}, { filter: run.id }).then(function (variables) {
                        run.variables = variables;
                        return run;
                    });
                    return prom;
                });
                return $.when.apply(null, promises);
            });
        });
    }
};

module.exports = ScenarioManager;