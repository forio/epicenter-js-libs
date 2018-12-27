// See integration-test-scenario-manager for usage examples
import RunManager from 'managers/run-manager';
import SavedRunsManager from './saved-runs-manager';

import { mergeRunOptions } from 'managers/run-strategies/strategy-utils';
import { normalizeOperations } from 'util/run-util';

import NoneStrategy from 'managers/run-strategies/none-strategy';

import StateService from 'service/state-api-adapter';
import RunService from 'service/run-api-service';

import BaselineStrategy from './scenario-strategies/baseline-strategy';
import LastUnsavedStrategy from './scenario-strategies/reuse-last-unsaved';

function cookieNameFromOptions(prefix, config) {
    var key = ['account', 'project', 'model'].reduce(function (accum, key) {
        return config[key] ? accum + '-' + config[key] : accum; 
    }, prefix);
    return key;
}

/**
 * @param {object} config 
 * @property {object[]} [advanceOperation] Operations to perform on each run to indicate that the run is complete. Operations are executed [serially](../run-api-service/#serial). Defaults to calling the model operation `stepTo('end')`, which advances Vensim, Powersim, and SimLang models to the end. 
 * @property {object} run Additional options to pass through to run creation (for e.g., `files`, etc.). Defaults to empty object.
 * @property {boolean} [includeBaseLine] Whether or not to auto-create and include a baseline run in this Scenario Manager. Defaults to `true`.
 * @property {object} [baseline] Additional configuration for the `baseline` run. 
 * @property {string} [baseline.runName] Name of the baseline run. Defaults to 'Baseline'. 
 * @property {string} [baseline.run] Additional options to pass through to run creation, specifically for the baseline run. These will override any options provided under `run`. Defaults to empty object. 
 * @property {object} [baseline.scope]
 * @property {boolean} [baseline.scope.scopeByUser] Controls if a baseline should be created per **user** or per **group** True by default.
 * @property {boolean} [baseline.scope.scopeByGroup] Controls if a baseline should be created per **group** or per **project** True by default.
 * @property {object} [current] Additional configuration for the `current` run. 
 * @property {string} [current.run] Additional options to pass through to run creation, specifically for the current run. These will override any options provided under `run`. Defaults to empty object.
 * @property {object} [savedRuns] Options to pass through to the `savedRuns` list. See the [Saved Runs Manager](./saved/) for complete description of available options. Defaults to empty object.
 */
function ScenarioManager(config) {
    var defaults = {
        advanceOperation: [{ name: 'stepTo', params: ['end'] }],
        run: {},
        includeBaseLine: true,
        baseline: {
            runName: 'Baseline',
            run: {}
        },
        current: {
            run: {}
        },
        savedRuns: {}
    };

    var opts = $.extend(true, {}, defaults, config);
    if (config && config.advanceOperation) {
        opts.advanceOperation = config.advanceOperation; //jquery.extend does a poor job trying to merge arrays
    }

    var BaselineStrategyToUse = opts.includeBaseLine ? BaselineStrategy : NoneStrategy;
    /**
     * A [Run Manager](../run-manager/) instance containing a 'baseline' run to compare against; this is defined as a run "advanced to the end" of your model using just the model defaults. By default the "advance" operation is assumed to be `stepTo: end`, which works for time-based models in [Vensim](../../../model_code/vensim/), [Powersim](../../../model_code/powersim/), and [SimLang](../../../model_code/forio_simlang). If you're using a different language, or need to change this, just pass in a different `advanceOperation` option while creating the Scenario Manager. The baseline run is typically displayed in the project's UI as part of a run comparison table or chart.
     * @return {RunManager}
     */
    this.baseline = new RunManager({
        strategy: BaselineStrategyToUse,
        sessionKey: cookieNameFromOptions.bind(null, 'sm-baseline-run'),
        run: mergeRunOptions(opts.run, opts.baseline.run),
        strategyOptions: {
            baselineName: opts.baseline.runName,
            initOperation: opts.advanceOperation,
            scope: opts.baseline.scope,
        }
    });

    /**
     * A [SavedRunsManager](../saved-runs-manager/) instance containing a list of saved runs, that is, all runs that you want to use for comparisons. The saved runs are typically displayed in the project's UI as part of a run comparison table or chart.
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

    function scopeFromConfig(config) {
        const currentTrackingKey = config.scope && config.scope.trackingKey ? `${config.scope.trackingKey}-current` : 'current';
        return { scope: { trackingKey: currentTrackingKey } };
    }
    const mergedCurrentRunOptions = mergeRunOptions(opts.run, opts.current.run);
    if (mergedCurrentRunOptions instanceof RunService) {
        const config = mergedCurrentRunOptions.getCurrentConfig();
        mergedCurrentRunOptions.updateConfig(scopeFromConfig(config));
    } else {
        $.extend(true, mergedCurrentRunOptions, scopeFromConfig(mergedCurrentRunOptions));
    }
    /**
     * A [Run Manager](../run-manager/) instance containing a 'current' run; this is defined as a run that hasn't been advanced yet, and so can be used to set initial decisions. The current run is typically used to store the decisions being made by the end user.
     * @return {RunManager}
     */
    this.current = new RunManager({
        strategy: LastUnsavedStrategy,
        sessionKey: cookieNameFromOptions.bind(null, 'sm-current-run'),
        run: mergedCurrentRunOptions,
    });

    /**
     * Clones the current run, advances this clone by calling the `advanceOperation`, and saves the cloned run (it becomes part of the `savedRuns` list). Additionally, adds any provided metadata to the cloned run; typically used for naming the run. The current run is unchanged and can continue to be used to store decisions being made by the end user.
     *
     * Available only for the Scenario Manager's `current` property (Run Manager). 
     *
     * @example
     * var sm = new F.manager.ScenarioManager();
     * sm.current.saveAndAdvance({'myRunName': 'sample policy decisions'});
     * 
     * @param {object} metadata Metadata to save, for example, `{ name: 'Run Name' }`
     * @return {Promise}
     */
    this.current.saveAndAdvance = function (metadata) {
        function clone(run) {
            var sa = new StateService();
            var advanceOpns = normalizeOperations(opts.advanceOperation); 
            //run i'm cloning shouldn't have the advance operations there by default, but just in case
            return sa.clone({ runId: run.id, exclude: advanceOpns.ops }).then(function (response) {
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

export default ScenarioManager;
