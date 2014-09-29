(function () {
    'use strict';

    var root = this;
    var F = root.F;
    var classFrom, ConditionalStrategy;

    if (typeof require !== 'undefined') {
        classFrom = require('../../util/inherit');
        ConditionalStrategy = require('./conditional-creation-strategy');
    } else {
        classFrom = F.util.classFrom;
        ConditionalStrategy = F.manager.strategy['conditional-creation'];
    }

    var __super = ConditionalStrategy.prototype;

    var Strategy = classFrom(ConditionalStrategy, {
        constructor: function (runService, options) {
            __super.constructor.call(this, runService, this.createIf, options);
        },

        createIf: function (run, headers) {
            return headers.getResponseHeader('pragma') === 'persistent';
        }
    });

    if (typeof require !== 'undefined') {
        module.exports = Strategy;
    } else {
        if (!root.F) { root.F = {};}
        if (!root.F.manager) { root.F.manager = {};}
        if (!root.F.manager.strategy) { root.F.manager.strategy = {};}
        root.F.manager.strategy['new-if-persisted'] = Strategy;
    }
}).call(this);
