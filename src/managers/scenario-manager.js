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

    mark: function (runid, toMark) {
        return this.runService.save(toMark, { filter: runid });
    },
    saveRun: function (runid, name, isSaved) {
        var val = !(isSaved === false);
        var param = { saved: val };
        if (name) {
            param.name = name;
        }
        return this.mark(runid, param);
    },
    archiveRun: function (runid, isTrashed) {
        var val = !(isTrashed === false);
        return this.mark(runid, { trashed: val });
    },

    getSavedRuns: function () {
        //TODO: Add group/user scope filters here
        var opModifiers = {
            sort: 'created',
            direction: 'asc'
        };
        var me = this;
        return this.baseLineProm.then(function () {
            return me.runService.query({ saved: true, trashed: false }, opModifiers);
        });
    },

    fetchVariablesForRuns: function (runObjects, variables) {
        var promises = [];
        var response = [];

        if (!variables || !variables.length) {
            return $.Deferred().resolve().promise();
        }
        var opModifiers = {
            sort: 'created',
            direction: 'asc'
        };
        runObjects.forEach(function (run) {
            var prom = this.runService.variables().query([].concat(variables), opModifiers, { filter: run.id }).then(function (variables) {
                response.push({ id: run.id, name: run.name, variables: variables });
                return variables;
            });
            promises.push(prom);
        });
        return $.when.apply(null, promises).then(function () {
            return response;
        });
    }
};

module.exports = ScenarioManager;