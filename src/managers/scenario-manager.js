'use strict';

var SessionManager = require('../store/session-manager');
var RunService = require('../service/run-api-service');

module.exports = function(config) {
    var defaults = {
        /**
         * Criteria by which to filter runs. Defaults to empty string.
         * @type {Object}
         */
        filter: '',

        /**
         * Flag determines if `X-AutoRestore: true` header is sent to Epicenter. Defaults to `true`.
         * @type {boolean}
         */
        autoRestore: false,
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);

    var publicAsyncAPI = {
        loadSavedRuns: function(filter, outputModifier) {
            var defaultFilter = {
                saved: true
            };
            var newFilter = $.extend({}, defaultFilter, filter);
            var rs = new RunService(serviceOptions);
            return rs.query(newFilter, outputModifier);
        },
        
        saveRun: function(run, name) {
            if (!run instanceof RunService) {
                run = new RunService($.extend(true, {}, serviceOptions, { filter: run }));
            }
            return run.save({ saved: true, name: name });
        },
        archiveRun: function(run) {
            if (!run instanceof RunService) {
                run = new RunService($.extend(true, {}, serviceOptions, { filter: run }));
            }
            return run.save({ saved: false });
        },        

        /**
         * [description]
         * @param  {Array} runObjects Array of objects with signature { id: X, name: Y }
         * @param  {Array} variables  [description]
         * @return {[type]}            [description]
         */
        fetchVariablesForRuns: function(runObjects, variables) {
            var promises = [];
            var response = [];

            _.each(runObjects, function(run) {
                var r = new RunService($.extend({}, serviceOptions, { filter: run.id }));
                var prom = r.variables().query(variables).then(function(variables) {
                    response.push({ id: run.id, name: run.name, variables: variables });
                    return variables;
                });
                promises.push(prom);
            });

            return $.when.apply(null, promises).then(function() {
                return response;
            });
        }
    };
    $.extend(this, publicAsyncAPI);
};