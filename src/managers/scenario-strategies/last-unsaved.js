'use strict';
var classFrom = require('../../util/inherit');
var StateService = require('../../service/state-api-adapter');

var Base = {};
module.exports = classFrom(Base, {
    constructor: function (options) {
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
            return runService.save({ trashed: false }).then(function (patchResponse) { //TODO remove this once EPICENTER-2500 is fixed
                return $.extend(true, {}, createResponse, patchResponse);
            });
        });
    },

    getRun: function (runService, userSession) {
        var defaultFilterParams = {
        };
        if (userSession && userSession.groupName) {
            defaultFilterParams['scope.group'] = userSession.groupName;
        }
        if (userSession && userSession.userId) {
            defaultFilterParams['user.id'] = userSession.userId;
        }
        var filter = $.extend(true, {}, defaultFilterParams, { 
            trashed: false, //TODO change to '!=true' once EPICENTER-2500 is fixed
        }); //Can also filter by time0, but assuming if it's stepped it'll be saved
        var me = this;
        var outputModifiers = { 
            // startrecord: 0,  //TODO: Uncomment when EPICENTER-2569 is fixed
            // endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        };
        return runService.filter(filter, outputModifiers).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession);
            }
            var lastRun = runs[0];
            if (lastRun.saved !== true) {
                return lastRun;
            }

            var basedOnRunid = lastRun.id;
            var sa = new StateService();
            //FIXME: Fix hard-coded 'stepto' assumption
            return sa.clone({ runId: basedOnRunid, stopBefore: 'stepTo' }).then(function (response) {
                return runService.load(response.run);
            }).then(function (run) {
                //TODO remove this once EPICENTER-2500 is fixed
                return runService.save({ trashed: false }).then(function (patchResponse) {
                    return $.extend(true, {}, run, patchResponse);
                });
            });
        });
    }
}, { requiresAuth: false });