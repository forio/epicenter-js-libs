/**
* ## Scenario Manager
*
* In some projects, often called "turn-by-turn" projects, end users advance through the project's model step-by-step, working either individually or together to make decisions at each step. 
*
* In other projects, often called "run comparison" or "scenario comparison" projects, end users set some initial decisions, then simulate the model to its end. Typically end users will do this several times, and compare the results. 
*
* The Scenario Manager makes it easy to create these "run comparison" projects. Each Scenario Manager allows you to compare the results of several runs. This is mostly useful for time-based models ([Vensim](../../../model_code/vensim/), [Powersim](../../../model_code/powersim/), [SimLang](../../../model_code/forio_simlang)), but can be adapted to working with other languages as well.
*
* The Scenario Manager can be thought of as a collection of [Run Managers](../run-manager/) with pre-configured [strategies](../strategies/). Just as the Run Manager provides use case -based abstractions and utilities for managing the [Run Service](../run-api-service/), the Scenario Manager does the same for the Run Manager.
*
* There are typically three components to building a run comparison:
*
* * A `baseline` run to compare against; this is defined as a run "advanced to the end" using just the model defaults.
* * A `current` run in which to make decisions; this is defined as a run that hasn't been advanced yet, and so can be used to set initial decisions. The current run should maintain state across different sessions.
* * A list of `saved` runs; this includes any run which you want to use for comparisons.
*
* To satisfy these needs a Scenario Manager instance has three Run Managers: [baseline](./baseline/), [current](./current/), and [savedRuns](./saved/).
*
* ### Using the Scenario Manager to create a run comparison project
*
* To use the Scenario Manager, instantiate it, then access its Run Managers as needed to create your project's user interface:
*
* **Example**
*
*       var sm = new F.manager.ScenarioManager();
*
*       // the baseline is an instance of a Run Manager,
*       // with a strategy which locates the last undeleted baseline run, or creates a new one
*       // typically displayed in the project's UI as part of a run comparison table or chart
*       var baselineRM = sm.baseline;
*
*       // the Run Manager operation, which returns a 'correct' run
*       sm.baseline.getRun();
*       // the Run Manager operation, which resets the baseline run
*       // useful if the model has changed since the baseline run was created
*       sm.baseline.reset(); 
*
*       // the current is an instance of a Run Manager,
*       // with a strategy which picks up the last unsaved run 
*       // ('unsaved' implies a run which hasn't been advanced)
*       // typically used to store the decisions being made by the end user, 
*       // then advanced and added to the list of saved runs
*       var currentRM = sm.current;
*
*       // the Run Manager operation, which returns a 'correct' run
*       sm.current.getRun();
*       // the Run Manager operation, which resets the decisions made on the current run
*       sm.current.reset();
*       // clone the current run, advance it and save it
*       // this has the side effect of making the "current" run no longer current
*       // (it becomes part of the saved runs list)
*       sm.current.saveAndAdvance();
*
*       // the savedRuns is an instance of a Saved Runs Manager 
*       // (itself a variant of a Run Manager)
*       // typically displayed in the project's UI as part of a run comparison table or chart
*       var savedRM = sm.savedRuns;
*       // mark a run as saved, adding it to the set of saved runs
*       sm.savedRuns.save(run);
*       // mark a run as removed, removing it from the set of saved runs
*       sm.savedRuns.remove(run);
*       // list the saved runs, optionally including some specific model variables for each
*       sm.savedRuns.getRuns();
*
*/

'use strict';

// See integration-test-scenario-manager for usage examples
var RunManager = require('./run-manager');
var SavedRunsManager = require('./saved-runs-manager');
var strategyUtils = require('./strategy-utils');

var NoneStrategy = require('./run-strategies/none-strategy');

var StateService = require('../service/state-api-adapter');
var RunService = require('../service/run-api-service');

var BaselineStrategy = require('./scenario-strategies/baseline-strategy');
var LastUnsavedStrategy = require('./scenario-strategies/reuse-last-unsaved');

var defaults = {
    /**
     * Operations to perform on each run to indicate that the run is complete. Operations are executed serially. Defaults to calling the model operation `stepTo('end')`, which advances Vensim, Powersim, and SimLang models to the end. 
     * @type {Array}
     */
    advanceOperation: [{ name: 'stepTo', params: ['end'] }],

    /**
     * Additional options to pass through to run creation (for e.g., `files`, etc.). Defaults to empty object.
     * @type {Object}
     */
    run: {},

    /**
     * Whether or not to include a baseline run in this Scenario Manager. Defaults to `true`.
     */
    includeBaseLine: true,

    /**
     * Additional configuration for the `baseline` run. 
     *
     * * `baseline.runName`: Name of the baseline run. Defaults to 'Baseline'. 
     * * `baseline.run`: Additional options to pass through to run creation, specifically for the baseline run. These will override any options provided under `run`. Defaults to empty object. 
     * @type {Object}
     */
    baseline: {
        runName: 'Baseline',
        run: {}
    },

    /**
     * Additional configuration for the `current` run. 
     *
     * * `current.run`: Additional options to pass through to run creation, specifically for the current run. These will override any options provided under `run`. Defaults to empty object.
     * @type {Object}
     */
    current: {
        run: {}
    },

    /**
     * Options to pass through to the `savedRuns` list. See the [Saved Runs Manager](./saved/) for complete description of available options. Defaults to empty object.
     * @type {Oobject}
     */
    savedRuns: {}
};

function ScenarioManager(config) {
    var opts = $.extend(true, {}, defaults, config);
    if (config && config.advanceOperation) {
        opts.advanceOperation = config.advanceOperation; //jquery.extend does a poor job trying to merge arrays
    }

    var BaselineStrategyToUse = opts.includeBaseLine ? BaselineStrategy : NoneStrategy;
    /**
     * A [Run Manager](../run-manager/) instance containing a 'baseline' run to compare against (the last undeleted baseline run, if available, or a new run). A baseline is defined as a run "advanced to the end" using just the model defaults. The baseline run is typically displayed in the project's UI as part of a run comparison table or chart.
     * @return {RunManager}
     */
    this.baseline = new RunManager({
        strategy: BaselineStrategyToUse,
        sessionKey: 'sm-baseline-run',
        run: strategyUtils.mergeRunOptions(opts.run, opts.baseline.run),
        strategyOptions: {
            baselineName: opts.baseline.runName,
            initOperation: opts.advanceOperation
        }
    });

    /**
     * A [SavedRunsManager](../saved-runs-manager/) instance containing a list of saved runs. The saved runs are typically displayed in the project's UI as part of a run comparison table or chart.
     * @return {SavedRunsManager}
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

    /**
     * A [Run Manager](../run-manager/) instance with a strategy which always returns the last unsaved run (or create a new run, if there are none). The current (last unsaved) run is defined as a run that hasn't been advanced yet, and so can be used to set initial decisions. Typically current runs are used for setting decisions being made by the end user in the UI, then advanced and added to the list of saved runs.
     * @return {RunManager}
     */
    this.current = new RunManager({
        strategy: LastUnsavedStrategy,
        sessionKey: 'sm-current-run',
        run: strategyUtils.mergeRunOptions(opts.run, opts.current.run)
    });

    /**
     * Clones the current run, saves it, and applies the `advanceOperation` on it. Additionally, adds any provided metadata to the run; typically used for naming the run. Available only for the Scenario Manager's `current` property (Run Manager). 
     *
     * **Example**
     *
     *      var sm = new F.manager.ScenarioManager();
     *      sm.current.saveAndAdvance({'myRunName': 'sample policy decisions'});
     *
     * **Parameters**
     * @param  {Object} metadata   Metadata to save, for example, the run name.
     * @return {Promise}
     */
    this.current.saveAndAdvance = function (metadata) {
        function clone(run) {
            var sa = new StateService();
            return sa.clone({ runId: run.id }).then(function (response) {
                var rs = new RunService(me.current.run.getCurrentConfig());
                return rs.load(response.run);
            });
        }
        function markSaved(run) {
            return me.savedRuns.save(run.id, metadata).then(function (savedResponse) {
                return $.extend(true, {}, run, savedResponse);
            });
        }
        function advance(run) {
            var rs = new RunService(run);
            return rs.serial(opts.advanceOperation).then(function () {
                return run;
            });
        }
        return me.current
                .getRun()
                .then(clone)
                .then(advance)
                .then(markSaved);
    };
}

module.exports = ScenarioManager;
