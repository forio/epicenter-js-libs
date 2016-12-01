var list = {
    'new-if-initialized': require('./new-if-initialized-strategy'),
    'new-if-persisted': require('./new-if-persisted-strategy'),
    'new-if-missing': require('./new-if-missing-strategy'),
    'always-new': require('./always-new-strategy'),
    multiplayer: require('./multiplayer-strategy'),
    'persistent-single-player': require('./persistent-single-player-strategy'),
    none: require('./none-strategy'),
    'conditional-creation': require('./conditional-creation-strategy'),
    baseline: require('../scenario-strategies/baseline-strategy')
};

module.exports = {
    list: list,
    get: function (strategyName) {
        return list[strategyName];
    }
};