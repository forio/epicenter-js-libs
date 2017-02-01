'use strict';

/**
 * See integration-test-scenario-manager for usage examples
 */
var RunManager = require('./run-manager');
var SavedRunsManager = require('./saved-runs-manager');
var strategyUtils = require('./strategy-utils');

var defaults = {
    /**
     * Operation to perform on each run to indicate that it's complete
     * @type {Array}
     */
    advanceOperation: [{ stepTo: 'end' }],

    /**
     * Additional options to pass-through to run creation (for e.g., `files` etc)
     * @type {Object}
     */
    run: {},

    baseline: {
        /**
         * Name of the baseline run
         * @type {String}
         */
        runName: 'Baseline',

        /**
         * Additional options to pass-through to run creation, specifically for the baseline. This will over-ride any options provided under `run`
         * @type {Object}
         */
        run: {}
    },

    /**
     * Additional options to pass-through to run creation, specifically for the current run. This will over-ride any options provided under `run`
     * @type {Object}
     */
    currentRun: {},
};

var BaselineStrategy = require('./scenario-strategies/baseline-strategy');
var LastUnsavedStrategy = require('./scenario-strategies/reuse-last-unsaved');

function ScenarioManager(config) {
    var opts = $.extend(true, {}, defaults, config);
    if (config && config.advanceOperation) {
        opts.advanceOperation = config.advanceOperation; //jquery.extend does a poor job trying to merge arrays
    }
    
    /**
     * A Run Manager instance with a strategy which generates a new baseline if none exists
     * @type {RunManager}
     */
    this.baseline = new RunManager({
        strategy: BaselineStrategy,
        sessionKey: 'sm-baseline-run',
        run: strategyUtils.mergeRunOptions(opts.run, opts.baseline.run),
        strategyOptions: {
            baselineName: opts.baseline.runName,
            initOperation: opts.advanceOperation
        }
    });

    /**
     * Instance of a SavedRunsManager
     * @type {SavedRunsManager}
     */
    this.savedRuns = new SavedRunsManager($.extend(true, {}, {
        run: opts.run,
    }, opts.savedRuns));

    var origGetRuns = this.savedRuns.getRuns;
    var me = this;
    this.savedRuns.getRuns = function () {
        var args = Array.apply(null, arguments);
        return me.baseline.getRun().then(function () {
            return origGetRuns.apply(me.savedRuns, args);
        });
    };

    var ignoreOperations = ([].concat(opts.advanceOperation)).map(function (opn) {
        return Object.keys(opn)[0];
    });
    /**
     * A Run Manager instance with a strategy which always returns the last un-saved runs; 'current' runs are typically used for setting decisions in Run Comparison projects
     * @type {RunManager}
     */
    this.current = new RunManager({
        strategy: LastUnsavedStrategy,
        sessionKey: 'sm-current-run',
        run: strategyUtils.mergeRunOptions(opts.run, opts.currentRun),
        strategyOptions: {
            ignoreOperations: ignoreOperations
        }
    });

    /**
     * Saves the current run and applies the `advance` operation on it
     * @param  {Object} metadata   metadata to save, for e.g., the run name
     * @return {Promise}
     */
    this.current.saveAndAdvance = function (metadata) {
        return me.current.getRun().then(function () {
            return me.current.run.serial(opts.advanceOperation);
        }).then(function () {
            return me.savedRuns.save(me.current.run, metadata);
        }).then(function () {
            return me.current.getRun(); //to update the .run instance
        });
    };
}

module.exports = ScenarioManager;
