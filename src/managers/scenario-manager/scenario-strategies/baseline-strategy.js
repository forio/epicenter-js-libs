import ReuseinitStrategy from 'managers/run-strategies/reuse-last-initialized';

/**
 * @description
 * ## Baseline
 *
 * An instance of a [Run Manager](../../run-manager/) with a baseline strategy is included automatically in every instance of a [Scenario Manager](../), and is accessible from the Scenario Manager at `.baseline`.
 *
 * A baseline is defined as a run "advanced to the end" using just the model defaults. The baseline run is typically displayed in the project's UI as part of a run comparison table or chart.
 *
 * The `baseline` strategy looks for the most recent run named as 'Baseline' (or named as specified in the `baseline.runName` [configuration option of the Scenario Manager](../#configuration-options)) that is flagged as `saved` and not `trashed`. If the strategy cannot find such a run, it creates a new run and immediately executes a set of initialization operations. 
 *
 * Comparing against a baseline run is optional in a Scenario Manager; you can [configure](../#configuration-options) your Scenario Manager to not include one. See [more information](../#properties) on using `.baseline` within the Scenario Manager.
 *
 * See also: [additional information on run strategies](../../strategies/).
 * 
 * @constructor
 * @param {object} options
 * @property {string} [baselineName] Name of the baseline run. Defaults to 'Baseline'. 
 * @property {object[]} [initOperation] Operations to perform on each run to indicate that the run is complete. Operations are executed [serially](../run-api-service/#serial). Defaults to calling the model operation `stepTo('end')`, which advances Vensim, Powersim, and SimLang models to the end. 
 */
export default function BaselineStrategy(options) {
    var defaults = {
        baselineName: 'Baseline',
        initOperation: [{ stepTo: 'end' }]
    };
    var strategyOptions = options ? options.strategyOptions : {};
    var opts = $.extend({}, defaults, strategyOptions);

    const reuseStrategyOptions = {
        initOperation: opts.initOperation,
        flag: {
            saved: true,
            trashed: false,
            isBaseline: true,
            name: opts.baselineName
        },
        scope: opts.scope,
    };

    return new ReuseinitStrategy({
        strategyOptions: reuseStrategyOptions
    });
}
