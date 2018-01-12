/**
 * The `reuse-last-initialized` strategy looks for the most recent run that matches particular criteria; if it cannot find one, it creates a new run and immediately executes a set of "initialization" operations. 
 *
 * This strategy is useful if you have a time-based model and always want the run you're operating on to start at a particular step. For example:
 *
 *      var rm = new F.manager.RunManager({
 *          strategy: 'reuse-last-initialized',
 *          strategyOptions: {
 *              initOperation: [{ step: 10 }]
 *          }
 *      });
 * 
 * This strategy is also useful if you have a custom initialization function in your model, and want to make sure it's always executed for new runs.
 *
 * Specifically, the strategy is:
 *
 * * Look for the most recent run that matches the (optional) `flag` criteria
 * * If there are no runs that match the `flag` criteria, create a new run. Immediately "initialize" this new run by:
 *     *  Calling the model operation(s) specified in the `initOperation` array.
 *     *  Optionally, setting a `flag` in the run.
 *
 */

'use strict';
var classFrom = require('../../util/inherit');
var injectFiltersFromSession = require('../strategy-utils').injectFiltersFromSession;
var injectScopeFromSession = require('../strategy-utils').injectScopeFromSession;

var Base = {};

var defaults = {
    /**
     * Operations to execute in the model for initialization to be considered complete.
     * @type {Array} Can be in any of the formats [Run Service's `serial()`](../run-api-service/#serial) supports.
     */
    initOperation: [],

    /**
     * (Optional) Flag to set in run after initialization operations are run. You typically would not override this unless you needed to set additional properties as well.
     * @type {Object}
     */
    flag: null,
};
module.exports = classFrom(Base, {
    constructor: function (options) {
        var strategyOptions = options ? options.strategyOptions : {};
        this.options = $.extend(true, {}, defaults, strategyOptions);
        if (!this.options.initOperation || !this.options.initOperation.length) {
            throw new Error('Specifying an init function is required for this strategy');
        }
        if (!this.options.flag) {
            this.options.flag = {
                isInitComplete: true
            };
        }
    },

    reset: function (runService, userSession, options) {
        var opt = injectScopeFromSession(runService.getCurrentConfig(), userSession);
        var me = this;
        return runService.create(opt, options).then(function (createResponse) {
            return runService.serial([].concat(me.options.initOperation)).then(function () {
                return createResponse;
            });
        }).then(function (createResponse) {
            return runService.save(me.options.flag).then(function (patchResponse) {
                return $.extend(true, {}, createResponse, patchResponse);
            });
        });
    },

    getRun: function (runService, userSession, runSession, options) {
        var sessionFilter = injectFiltersFromSession(this.options.flag, userSession);
        var runopts = runService.getCurrentConfig();
        var filter = $.extend(true, {}, sessionFilter, { model: runopts.model });
        var me = this;
        return runService.query(filter, { 
            // startrecord: 0,  //TODO: Uncomment when EPICENTER-2569 is fixed
            // endrecord: 0,
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