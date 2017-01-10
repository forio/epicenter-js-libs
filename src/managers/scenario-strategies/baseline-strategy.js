'use strict';
var classFrom = require('../../util/inherit');
var injectFiltersFromSession = require('../strategy-utils').injectFiltersFromSession;

var Base = {};
var BASELINE_NAME = 'baseline';

//FIXME: Merge with reuse-last-initialized
module.exports = classFrom(Base, {
    constructor: function (runService, options) {
    },

    reset: function (runService, userSession) {
        var group = userSession && userSession.groupName;
        var opt = $.extend(true, {}, runService.getCurrentConfig());
        if (group) {
            $.extend(opt, {
                scope: { group: group }
            });
        }

        return runService.create(opt).then(function (createResponse) {
            return runService.save({
                saved: true,
                trashed: false, //TODO remove this once EPICENTER-2500 is fixed
                name: BASELINE_NAME
            }).then(function (patchResponse) {
                return $.extend(true, {}, createResponse, patchResponse);
            });
        }).then(function (mergedResponse) {
            //FIXME: Fix hard-coded 'stepto' assumption
            return runService.do({ stepTo: 'end' }).then(function () {
                return mergedResponse;
            });
        });
    },

    getRun: function (runService, userSession, runIdInSession) {
        var filter = injectFiltersFromSession({ 
            saved: true, 
            trashed: false, //TODO remove this once EPICENTER-2500 is fixed
            name: BASELINE_NAME,
        }, userSession);

        var me = this;
        return runService.filter(filter, { 
            // startrecord: 0, //TODO: Uncomment when EPICENTER-2569 is fixed
            // endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        }).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession);
            }
            return runs[0];
        });
    }
}, { requiresAuth: false });