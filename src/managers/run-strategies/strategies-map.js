module.exports = {
    'new-if-initialized': require('./new-if-initialized-strategy'),
    'new-if-persisted': require('./new-if-persisted-strategy'),
    'new-if-missing': require('./new-if-missing-strategy'),
    'always-new': require('./always-new-strategy'),
    multiplayer: require('./multiplayer-strategy'),
    'persistent-single-player': require('./persistent-single-player-strategy'),
    none: require('./none-strategy'),
    baseline: require('../scenario-strategies/baseline-strategy'),
    'new-if-stepped': require('../scenario-strategies/last-unsaved'),
};
