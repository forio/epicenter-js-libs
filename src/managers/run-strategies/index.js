var list = {
    'conditional-creation': require('./conditional-creation-strategy'),
    'new-if-initialized': require('./deprecated/new-if-initialized-strategy'), //deprecated
    'new-if-persisted': require('./deprecated/new-if-persisted-strategy'), //deprecated

    'always-new': require('./always-new-strategy'),
    none: require('./none-strategy'),
    baseline: require('../scenario-strategies/baseline-strategy'),
    'reuse-last-unsaved': require('../scenario-strategies/reuse-last-unsaved'),

    multiplayer: require('./multiplayer-strategy'),
    'never-reuse': require('./always-new-strategy'),
    'reuse-per-session': require('./reuse-per-session'),
    'reuse-across-sessions': require('./reuse-across-sessions'),
    'reuse-last-initialized': require('./reuse-last-initialized'),
};

//Add back older aliases
list['new-if-missing'] = list['reuse-per-session'];
list['persistent-single-player'] = list['reuse-across-sessions'];


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