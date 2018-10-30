/**
 * The `reuse-across-sessions` strategy returns the latest (most recent) run for this user, whether it is in memory or not. If there are no runs for this user, it creates a new one.
 *
 * This strategy is useful if end users are using your project for an extended period of time, possibly over several sessions. This is most common in cases where a user of your project executes the model step by step (as opposed to a project where the model is executed completely, for example, a Vensim model that is immediately stepped to the end).
 *
 * Specifically, the strategy is:
 * 
 * * Check if there are any runs for this end user.
 *     * If there are no runs (either in memory or in the database), create a new one.
 *     * If there are runs, take the latest (most recent) one.
 *
 * @name persistent-single-player
 */

import classFrom from 'util/inherit';
import IdentityStrategy from './none-strategy';
import { injectFiltersFromSession, injectScopeFromSession } from 'managers/run-strategies/strategy-utils';

const Strategy = classFrom(IdentityStrategy, {
    constructor: function Strategy(options) {
        const defaults = {
            /**
             * (Optional) Additional criteria to use while selecting the last run
             * @type {Object}
             */
            filter: {},
        };
        
        const strategyOptions = options ? options.strategyOptions : {};
        this.options = $.extend(true, {}, defaults, strategyOptions);
    },

    reset: function (runService, userSession, options) {
        const opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        return runService
            .create(opt, options)
            .then(function (run) {
                run.freshlyCreated = true;
                return run;
            });
    },

    getRun: function (runService, userSession, runSession, options) {
        const filter = injectFiltersFromSession(this.options.filter, userSession);
        return runService.query(filter, { 
            startrecord: 0,
            endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        }).then((runs)=> {
            if (!runs.length) {
                return this.reset(runService, userSession, options);
            }
            return runs[0];
        });
    }
});

export default Strategy;
