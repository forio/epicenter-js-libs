'use strict';

var RunService = require('../service/run-api-service');
var SessionManager = require('../store/session-manager');

var injectFiltersFromSession = require('./strategy-utils').injectFiltersFromSession;

var SavedRunsManager = function (config) {
    var defaults = {
        scopeByGroup: true,
        scopeByUser: true,
    };

    this.sessionManager = new SessionManager();

    var options = $.extend(true, {}, defaults, config);
    if (options.run) {
        if (options.run instanceof RunService) {
            this.runService = options.run;
        } else {
            this.runService = new RunService(options.run);
        }
        this.options = options;
    } else {
        throw new Error('No run options passed to SavedRunsManager');
    }
};

SavedRunsManager.prototype = {
    mark: function (run, toMark) {
        var rs;
        if (run instanceof RunService) {
            rs = run;
        } else if (!(typeof Run === 'string')) {
            var existingOptions = this.runService.getCurrentConfig();
            rs = new RunService($.extend(true, {}, existingOptions, { id: run }));
        } else {
            throw new Error('Invalid run object provided');
        }
        return rs.save(toMark);
    },
    save: function (run, otherFields) {
        var param = $.extend(true, {}, otherFields, { saved: true, trashed: false });
        return this.mark(run, param);
    },
    remove: function (run, otherFields) {
        var param = $.extend(true, {}, otherFields, { saved: false, trashed: true });
        return this.mark(run, param);
    },
    getRuns: function (variables, filter, modifiers) {
        var session = this.sessionManager.getSession(this.runService.getCurrentConfig());

        var scopedFilter = injectFiltersFromSession($.extend(true, {}, filter, {
            saved: true, 
            trashed: false,
        }), session, this.options);

        var opModifiers = $.extend(true, {}, {
            sort: 'created',
            direction: 'asc'
        }, modifiers);
        var me = this;
        return this.runService.query(scopedFilter, opModifiers).then(function (savedRuns) {
            if (!variables || !variables.length) {
                return savedRuns;
            }
            var promises = savedRuns.map(function (run) {
                var config = $.extend(true, {}, me.runService.getCurrentConfig(), run);
                var rs = new RunService(config);
                var prom = rs.variables().query([].concat(variables)).then(function (variables) {
                    run.variables = variables;
                    return run;
                }).catch(function (err) {
                    if (err) {
                        console.error(err);
                    }
                    run.variables = {};
                    return run;
                });
                return prom;
            });
            return $.when.apply(null, promises).then(function () {
                return Array.apply(null, arguments);
            });
        });
    }
};
module.exports = SavedRunsManager;
