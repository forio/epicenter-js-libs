'use strict';
var classFrom = require('../../util/inherit');
var StateService = require('../../service/state-api-adapter');

var Base = {};
module.exports = classFrom(Base, {
    constructor: function (runService, options) {
        this.runService = runService;
        this.runoptions = options.run;
    },

    //TODO: Make sure this is passing the scope etc
    reset: function (runServiceOptions) {
        var rs = this.runService;
        return rs.create(this.runoptions);
    },

    getRun: function (runService) {
        var filter = { saved: false, trashed: '!=true' }; //Can also filter by time0, but assuming if it's stepped it'll be saved
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
            return runService.filter({ saved: true }, outputModifiers).then(function (savedRuns) {
                if (!savedRuns.length) {
                    return me.reset();
                } else {
                    var basedOnRunid = savedRuns[0].id;
                    var sa = new StateService();
                    return sa.clone({ runId: basedOnRunid, stopBefore: 'stepTo ' }).then(function (newRun) {
                        me.runService.updateConfig({ filter: newRun.id });
                    }); //TODO: figure out if run instance needs to be updated
                }
            });
        });
    }
});