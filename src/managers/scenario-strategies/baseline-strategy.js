'use strict';

var ReuseinitStrategy = require('../run-strategies/reuse-last-initialized');

module.exports = function (options) {
    var defaults = {
        baselineName: 'baseline'
    };
    var opts = $.extend(true, defaults, options);

    return new ReuseinitStrategy({
        strategyOptions: {
            initOperation: [{ name: 'stepTo', params: 'end' }],
            flag: {
                saved: true,
                trashed: false,
                name: opts.baselineName
            }
        }
    });
};
