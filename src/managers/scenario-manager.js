'use strict';

var RunManager = require('./run-manager');
var RunService = require('../service/run-api-service');
var SessionManager = require('../store/session-manager');

var SavedRunsService = function (options, baseLineProm) {
    var runService = new RunService(options);

    return {
        mark: function (run, toMark) {
            var rs = (run instanceof RunService) ? run : new RunService({ id: run });
            return rs.save(toMark);
        },
        add: function (run, name, isSaved) {
            var val = !(isSaved === false);
            var param = { saved: val };
            if (name) {
                param.name = name;
            }
            return this.mark(run, param);
        },
        remove: function (run, isTrashed) {
            var val = !(isTrashed === false);
            return this.mark(run, { trashed: val });
        },
        getRuns: function (variables, options) {
            //TODO: Add group/user scope filters here
            var opModifiers = {
                sort: 'created',
                direction: 'asc'
            };
            return baseLineProm.then(function () {
                return runService.query({ saved: true, trashed: false }, opModifiers).then(function (savedRuns) {
                    if (!variables || !variables.length) {
                        return savedRuns;
                    }
                    var promises = savedRuns.map(function (run) {
                        var prom = runService.variables().query([].concat(variables), {}, { filter: run.id }).then(function (variables) {
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
};

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

    this.savedRuns = new SavedRunsService(this.serviceOptions, baseLineProm);
}

module.exports = ScenarioManager;
