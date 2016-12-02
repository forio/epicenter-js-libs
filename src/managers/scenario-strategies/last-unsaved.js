'use strict';
var classFrom = require('../../util/inherit');
var StateService = require('../../service/state-api-adapter');

var Base = {};
module.exports = classFrom(Base, {
    constructor: function (options) {
    },

    reset: function (runService, userSession) {
        var group = userSession && userSession.groupName;
        var opt = $.extend({
            scope: { group: group }
        }, runService.getCurrentConfig());
        return runService.create(opt).then(function (createResponse) {
            runService.save({ trashed: false }).then(function (patchResponse) {
                return $.extend(true, {}, createResponse, patchResponse); //TODO remove this once EPICENTER-2500 is fixed
            });
        });
    },

    getRun: function (runService, userSession) {
        var defaultFilterParams = {
            'user.id': userSession.userId || '0000',
            'scope.group': userSession.groupName
        };
        var filter = $.extend(true, {}, defaultFilterParams, { 
            saved: false, 
            trashed: false, //TODO change to '!=true' once EPICENTER-2500 is fixed
        }); //Can also filter by time0, but assuming if it's stepped it'll be saved
        var me = this;
        var outputModifiers = { 
            startrecord: 0,
            endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        };
        return runService.filter(filter, outputModifiers).then(function (runs) {
            if (runs.length) {
                return runs[0];
            }
            var lastSavedRunFilter = $.extend(true, {}, defaultFilterParams, { saved: true });
            return runService.filter(lastSavedRunFilter, outputModifiers).then(function (savedRuns) {
                if (!savedRuns.length) {
                    return me.reset(runService, userSession);
                } else {
                    var basedOnRunid = savedRuns[0].id;
                    var sa = new StateService();
                    return sa.clone({ runId: basedOnRunid, stopBefore: 'stepTo ' }).then(function (response) {
                        console.log('res', response);
                    });
                }
            });
        });
    }
});