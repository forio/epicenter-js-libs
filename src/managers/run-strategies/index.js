/**
 * ### Working with Run Strategies
 *
 * You can access a list of available strategies using `F.manager.RunManager.strategies`. You can also ask for a particular strategy by name.
 *
 * If you decide to [create your own run strategy](#create-your-own), you can register your strategy. Registering your strategy means that:
 *
 * * You can pass the strategy by name to a Run Manager (as opposed to passing the strategy function): `new F.manager.RunManager({ strategy: 'mynewname'})`.
 * * You can pass configuration options to your strategy.
 * * You can specify whether or not your strategy requires authorization (a valid user session) to work.
 */


var list = {
    'conditional-creation': require('./conditional-creation-strategy'),
    'new-if-initialized': require('./deprecated/new-if-initialized-strategy'), //deprecated
    'new-if-persisted': require('./deprecated/new-if-persisted-strategy'), //deprecated

    none: require('./none-strategy'),

    multiplayer: require('./multiplayer-strategy'),
    'reuse-never': require('./reuse-never'),
    'reuse-per-session': require('./reuse-per-session'),
    'reuse-across-sessions': require('./reuse-across-sessions'),
    'reuse-last-initialized': require('./reuse-last-initialized'),
};

//Add back older aliases
list['always-new'] = list['reuse-never'];
list['new-if-missing'] = list['reuse-per-session'];
list['persistent-single-player'] = list['reuse-across-sessions'];


module.exports = {
    /**
     * List of available strategies. The key is the strategy name and value is the strategy constructor.
     * @type {Object} 
     */
    list: list,

    /**
     * Gets strategy by name.
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
        var StrategyCtor = typeof strategy === 'function' ? strategy : this.byName(strategy);
        if (!StrategyCtor) {
            throw new Error('Specified run creation strategy was invalid:', strategy);
        }

        var strategyInstance = new StrategyCtor(options);
        if (!strategyInstance.getRun || !strategyInstance.reset) {
            throw new Error('All strategies should implement a `getRun` and `reset` interface', options.strategy);
        }
        strategyInstance.requiresAuth = StrategyCtor.requiresAuth;

        return strategyInstance;
    },

    /**
     * Adds a new strategy.
     * @param  {String} name Name for strategy. This string can then be passed to a Run Manager as `new F.manager.RunManager({ strategy: 'mynewname'})`.
     * @param  {Function} strategy Your strategy constructor. Will be called with `new` on Run Manager initialization.
     * @param  {Object} options  Options for strategy.
     * @param  {Boolean} options.requiresAuth Specify if the strategy requires an valid user session to work.
     */
    register: function (name, strategy, options) {
        strategy.options = options;
        list[name] = strategy;
    }
};