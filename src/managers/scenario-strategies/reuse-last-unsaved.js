'use strict';
var classFrom = require('../../util/inherit');
var injectFiltersFromSession = require('../strategy-utils').injectFiltersFromSession;
var injectScopeFromSession = require('../strategy-utils').injectScopeFromSession;

var Base = {};

//TODO: Make a more generic version of this called 'reuse-by-matching-filter';
module.exports = classFrom(Base, {
    constructor: function (options) {
        var strategyOptions = options ? options.strategyOptions : {};
        this.options = strategyOptions;
    },

    reset: function (runService, userSession) {
        var opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        return runService.create(opt).then(function (createResponse) {
            return runService.save({ trashed: false }).then(function (patchResponse) { //TODO remove this once EPICENTER-2500 is fixed
                return $.extend(true, {}, createResponse, patchResponse, { freshlyCreated: true });
            });
        });
    },

    getRun: function (runService, userSession) {
        var filter = injectFiltersFromSession({ 
            saved: false,
            trashed: false, //TODO change to '!=true' once EPICENTER-2500 is fixed
        }, userSession);
        var me = this;
        var outputModifiers = { 
            // startrecord: 0,  //TODO: Uncomment when EPICENTER-2569 is fixed
            // endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        };
        return runService.query(filter, outputModifiers).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession);
            }
            return runs[0];
        });
    }
}, { requiresAuth: false });