'use strict';
var classFrom = require('../../util/inherit');
var RunService = require('../../service/run-api-service');

var Base = {};
var BASELINE_NAME = 'baseline';
module.exports = classFrom(Base, {
    constructor: function (runService, options) {
        this.runService = runService;
        this.runoptions = options.run;
    },

    reset: function (runServiceOptions) {
        var currentConfig = this.runService.getCurrentConfig();
        var rs = new RunService(currentConfig);
        return rs.create(this.runoptions).then(function (createResponse) {
            return rs.save({
                saved: true,
                name: BASELINE_NAME
            }).then(function (patchResponse) {
                return $.extend(true, {}, createResponse, patchResponse);
            });
        }).then(function (mergedResponse) {
            return rs.do({ stepTo: 'end' }).then(function () {
                return mergedResponse;
            });
        });
    },

    getRun: function (runService) {
        var filter = { saved: true, name: BASELINE_NAME };
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