(function () {
    'use strict';

    var root = this;
    var F = root.F;

    if (typeof require !== 'undefined') {
        module.exports = {
            'new-if-simulated': require('./run-strategies/new-if-simulated-strategy'),
            'new-if-persisted': require('./run-strategies/new-if-persisted-strategy'),
            'new-if-missing': require('./run-strategies/new-if-missing-strategy'),
            'always-new': require('./run-strategies/always-new-strategy')
        };
    } else {
        if (!root.F) { root.F = {};}
        if (!root.F.manager) { root.F.manager = {};}
        root.F.manager.strategy.map = {
            'new-if-simulated': F.manager.strategy['new-if-simulated'],
            'new-if-persisted': F.manager.strategy['new-if-persisted'],
            'new-if-missing': F.manager.strategy['new-if-missing'],
            'always-new': F.manager.strategy['always-new']
        };
    }


}).call(this);
