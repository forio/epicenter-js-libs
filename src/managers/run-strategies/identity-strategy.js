(function () {
    'use strict';

    var root = this;
    var F = root.F;
    var classFrom;
    var Base;

    if (typeof require !== 'undefined') {
        classFrom = require('../../util/inherit');
        Base = {};

        module.exports = classFrom(Base, {});
    } else {
        classFrom = F.util.classFrom;
        Base = {};

        if (!root.F) { root.F = {};}
        if (!root.F.manager) { root.F.manager = {};}
        if (!root.F.manager.strategy) { root.F.manager.strategy = {};}
        root.F.manager.strategy.identity = classFrom(Base, {});
    }

}).call(this);
