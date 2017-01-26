/**
 * Provides convention-based convenience methods for working with multiple runs.
 */
'use strict';

var RunService = require('../service/run-api-service');
var SessionManager = require('../store/session-manager');

var injectFiltersFromSession = require('./strategy-utils').injectFiltersFromSession;

var SavedRunsManager = function (config) {
    var defaults = {
        /**
         * If set, will only pull runs from current group by default
         * @type {Boolean}
         */
        scopeByGroup: true,

        /**
         * If set, will only pull runs from current user by default
         * @type {Boolean}
         */
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
    /**
     * Mark a run as saved
     * @param  {String|RunService} run         run to save
     * @param  {Object} otherFields (Optional) any other meta-data to save with the run
     * @return {Promise}
     */
    save: function (run, otherFields) {
        var param = $.extend(true, {}, otherFields, { saved: true, trashed: false });
        return this.mark(run, param);
    },
    /**
     * Mark as a run as removed; the inverse of marking as saved
     * @param  {String|RunService} run run to save
     * @param  {Object} otherFields (Optional) any other meta-data to save with the run
     * @return {Promise}
     */
    remove: function (run, otherFields) {
        var param = $.extend(true, {}, otherFields, { saved: false, trashed: true });
        return this.mark(run, param);
    },


    /**
     * Set additional fields on a run. This is just a convenience method for RunService#save
     * @param  {String|RunService} run  run to operate on.
     * @param  {Object} toMark Fields to set
     * @return {Promise}
     */
    mark: function (run, toMark) {
        var rs;
        var existingOptions = this.runService.getCurrentConfig();
        if (run instanceof RunService) {
            rs = run;
        } else if (run && (typeof run === 'string')) {
            rs = new RunService($.extend(true, {}, existingOptions, { id: run }));
        } else if ($.isArray(run)) {
            var me = this;
            var proms = run.map(function (r) {
                return me.mark(r, toMark);
            });
            return $.when.apply(null, proms);
        } else {
            throw new Error('Invalid run object provided');
        }
        return rs.save(toMark);
    },

    /**
     * Returns a list of saved runs
     * @param  {Array} variables (Optional) if provided the returned list of runs will have a `.variables` property with these set.
     * @param  {Object} filter    (Optional) Any filters to apply while fetching the run (@see RunService#filter for details)
     * @param  {Object} modifiers (Optional) Use for paging/sorting etc. @see RunService#filter for more details
     * @return {Promise}
     */
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
