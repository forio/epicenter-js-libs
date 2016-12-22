var list = {
    'new-if-initialized': require('./new-if-initialized-strategy'),
    'new-if-persisted': require('./new-if-persisted-strategy'),
    'new-if-missing': require('./new-if-missing-strategy'),
    'always-new': require('./always-new-strategy'),
    multiplayer: require('./multiplayer-strategy'),
    'persistent-single-player': require('./persistent-single-player-strategy'),
    none: require('./none-strategy'),
    baseline: require('../scenario-strategies/baseline-strategy'),
    'new-if-stepped': require('../scenario-strategies/last-unsaved'),
    'conditional-creation': require('./conditional-creation-strategy'),
};

module.exports = {
    /**
     * List available strategies
     * @type {Object} key is strategy name and value is the strategy constructor
     */
    list: list,

    /**
     * Get strategy by name
     * @param  {String} strategyName Name of strategy to get
     * @return {Function}              Strategy function
     */
    get: function (strategyName) {
        return list[strategyName];
    },

    /**
     * Adds a new strategy
     * @param  {String} name     Name for strategy. This string can then be passed to a RunManager as `new F.manager.RunManager({ scenario: 'mynewname'})`
     * @param  {Function} strategy Your strategy constructor. Will be called with `new` on RunManager initialization
     * @param  {Object} options  Options for strategy
     * @param  {Boolean} options.requiresAuth Specify if the strategy requires an valid user-session to work
     */
    register: function (name, strategy, options) {
        strategy.options = options;
        list[name] = strategy;
    }
};