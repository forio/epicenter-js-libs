'use strict';

var RunService = require('../service/run-api-service');
var SessionManager = require('../store/session-manager');

var SavedRunsManager = function (config) {
    var defaults = {

    };
    var options = $.extend(true, {}, defaults, config);

    var runService;
    if (options.run) {
        if (options.run instanceof RunService) {
            runService = options.run;
        } else {
            var sm = new SessionManager(options.run);
            var mergedOpts = sm.getMergedOptions({}, options.run);
            runService = new RunService(mergedOpts);
        }
    } else {
        throw new Error('No run options passed to SavedRunsManager');
    }
    
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
        }
    };
};

module.exports = SavedRunsManager;