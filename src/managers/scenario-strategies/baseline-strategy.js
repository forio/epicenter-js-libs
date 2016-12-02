'use strict';
var classFrom = require('../../util/inherit');

var Base = {};
var BASELINE_NAME = 'baseline';
module.exports = classFrom(Base, {
    constructor: function (runService, options) {
    },

    reset: function (runService, userSession) {
        var group = userSession && userSession.groupName;
        var opt = $.extend({
            scope: { group: group }
        }, runService.getCurrentConfig());

        return runService.create(opt).then(function (createResponse) {
            return runService.save({
                saved: true,
                name: BASELINE_NAME
            }).then(function (patchResponse) {
                return $.extend(true, {}, createResponse, patchResponse);
            });
        }).then(function (mergedResponse) {
            return runService.do({ stepTo: 'end' }).then(function () {
                return mergedResponse;
            });
        });
    },

    getRun: function (runService, userSession, runIdInSession) {
        var filter = { 
            saved: true, 
            name: BASELINE_NAME,
            'user.id': userSession.userId || '0000',
            'scope.group': userSession.groupName,
        };
        var me = this;
        return runService.filter(filter, { 
            startrecord: 0,
            endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        }).then(function (runs) {
            if (!runs.length) {
                return me.reset();
            }
            return runs[0];
        });
    }
});