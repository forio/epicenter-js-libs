/**
 * ### Working with Run Strategies
 *
 * You can access a list of available strategies using `F.manager.RunManager.strategies.list`. You can also ask for a particular strategy by name.
 *
 * If you decide to [create your own run strategy](#create-your-own), you can register your strategy. Registering your strategy means that:
 *
 * * You can pass the strategy by name to a Run Manager (as opposed to passing the strategy function): `new F.manager.RunManager({ strategy: 'mynewname'})`.
 * * You can pass configuration options to your strategy.
 * * You can specify whether or not your strategy requires authorization (a valid user session) to work.
 */

import conditionalCreation from './conditional-creation-strategy';
import newIfInitialized from './deprecated/new-if-initialized-strategy';
import newIfPersisted from './deprecated/new-if-persisted-strategy';

import identity from './none-strategy';
import multiplayer from './multiplayer-strategy';
import reuseNever from './reuse-never';
import reusePerSession from './reuse-per-session';
import reuseAcrossSessions from './reuse-across-sessions';
import reuseLastInitialized from './reuse-last-initialized';
 
const strategyKeys = {
    REUSE_NEVER: 'reuse-never',
    REUSE_PER_SESSION: 'reuse-per-session',
    REUSE_ACROSS_SESSIONS: 'reuse-across-sessions',
    REUSE_LAST_INITIALIZED: 'reuse-last-initialized',
    MULTIPLAYER: 'multiplayer',
    NONE: 'none'
};

var list = {
    'conditional-creation': conditionalCreation,
    'new-if-initialized': newIfInitialized,
    'new-if-persisted': newIfPersisted,

    [strategyKeys.NONE]: identity,
    [strategyKeys.MULTIPLAYER]: multiplayer,
    [strategyKeys.REUSE_NEVER]: reuseNever,
    [strategyKeys.REUSE_PER_SESSION]: reusePerSession,
    [strategyKeys.REUSE_ACROSS_SESSIONS]: reuseAcrossSessions,
    [strategyKeys.REUSE_LAST_INITIALIZED]: reuseLastInitialized,
};

//Add back older aliases
list['always-new'] = list['reuse-never'];
list['new-if-missing'] = list['reuse-per-session'];
list['persistent-single-player'] = list['reuse-across-sessions'];

const strategyManager = {
    /**
     * List of available strategies. Within this object, each key is the strategy name and the associated value is the strategy constructor.
     * @type {Object} 
     */
    list: list,

    /**
     * Gets strategy by name.
     *
     * @example
     *      var reuseStrat = F.manager.RunManager.strategies.byName('reuse-across-sessions');
     *      // shows strategy function
     *      console.log('reuseStrat = ', reuseStrat);
     *      // create a new run manager using this strategy
     *      var rm = new F.manager.RunManager({strategy: reuseStrat, run: { model: 'model.vmf'} });
     *
     * 
     * @param  {String} strategyName Name of strategy to get.
     * @return {Function} Strategy function.
     */
    byName: function (strategyName) {
        return list[strategyName];
    },

    getBestStrategy: function (options) {
        var strategy = options.strategy;
        if (!strategy) {
            if (options.strategyOptions && options.strategyOptions.initOperation) {
                strategy = 'reuse-last-initialized';
            } else {
                strategy = 'reuse-per-session';
            }
        }

        if (strategy.getRun) {
            return strategy;
        }
        var StrategyCtor = typeof strategy === 'function' ? strategy : strategyManager.byName(strategy);
        if (!StrategyCtor) {
            throw new Error('Specified run creation strategy was invalid:' + strategy);
        }

        var strategyInstance = new StrategyCtor(options);
        if (!strategyInstance.getRun || !strategyInstance.reset) {
            throw new Error('All strategies should implement a `getRun` and `reset` interface' + options.strategy);
        }
        strategyInstance.requiresAuth = StrategyCtor.requiresAuth;

        return strategyInstance;
    },

    /**
     * Adds a new strategy.
     *
     * @example
     *      // this "favorite run" strategy always returns the same run, no matter what
     *      // (not a useful strategy, except as an example)
     *      F.manager.RunManager.strategies.register(
     *          'favRun', 
     *          function() { 
     *              return { getRun: function() { return '0000015a4cd1700209cd0a7d207f44bac289'; },
     *                      reset: function() { return '0000015a4cd1700209cd0a7d207f44bac289'; } 
     *              } 
     *          }, 
     *          { requiresAuth: true }
     *      );
     *      
     *      var rm = new F.manager.RunManager({strategy: 'favRun', run: { model: 'model.vmf'} });
     *
     * 
     * @param  {String} name Name for strategy. This string can then be passed to a Run Manager as `new F.manager.RunManager({ strategy: 'mynewname'})`.
     * @param  {Function} strategy The strategy constructor. Will be called with `new` on Run Manager initialization.
     * @param  {Object} options  Options for strategy.
     * @param  {Boolean} options.requiresAuth Specify if the strategy requires a valid user session to work.
     */
    register: function (name, strategy, options) {
        strategy.options = options;
        list[name] = strategy;
    }
};

export default strategyManager;