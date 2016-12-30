'use strict';
var classFrom = require('../../util/inherit');

var Base = {};

var defaults = {
    /**
     * Operations to run in the model for initialization to be considered complete.
     * @type {Array}
     */
    initOperation: [],

    /**
     * (Optional) Flag to set in run after initialization operation is run. You'd typically not override this unless you need to set additional properties as well.
     * @type {Object}
     */
    flag: {
        isInitComplete: true
    }
};
module.exports = classFrom(Base, {
    constructor: function (options) {
        this.options = $.extend(true, {}, defaults, options.strategyOptions);
        if (!this.options.initOperation || !this.options.initOperation.length) {
            throw new Error('Specifying an init function is required for this strategy');
        }
    },

    reset: function (runService, userSession, options) {
        var group = userSession && userSession.groupName;
        var opt = $.extend({
            scope: { group: group }
        }, runService.getCurrentConfig());

        var me = this;
        return runService.create(opt, options).then(function (createResponse) {
            return runService.serial([].concat(me.options.initOperation)).then(function () {
                return createResponse;
            });
        }).then(function (createResponse) {
            return runService.save(this.options.flag).then(function (patchResponse) {
                return $.extend(true, {}, createResponse, patchResponse);
            });
        });
    },

    getRun: function (runService, userSession, runIdInSession, options) {
        var filter = this.options.flag;
        if (userSession && userSession.groupName) {
            filter['scope.group'] = userSession.groupName;
        }
        if (userSession.userId) {
            filter['user.id'] = userSession.userId;
        }
        var me = this;
        return runService.filter(filter, { 
            startrecord: 0,
            endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        }).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession, options);
            }
            return runs[0];
        });
    }
});