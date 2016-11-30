'use strict';
var classFrom = require('../../util/inherit');

var Base = {};
var BASELINE_NAME = 'baseline';
module.exports = classFrom(Base, {
    constructor: function (runService, options) {
        this.runService = runService;
        this.runoptions = options.run;
    },

    //TODO: Make sure this is passing the scope etc
    reset: function (runServiceOptions) {
        var rs = this.runService;
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

    //FIXME: store this in a cookie?
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