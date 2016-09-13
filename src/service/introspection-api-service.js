/**
 *
 * ## Introspection API Service
 *
 * The Introspection API Service allows you to view a list of the variables and operations in a model. Used in conjunction with the [Run API Service](../run-api-service/).
 *
 *       var rm = new F.manager.RunManager({
 *           run: {
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game',
 *               model: 'supply-chain-model.py'
 *           }
 *       });
 *       rm.getRun()
 *           .then(function() {
 *           var intro = rm.run.introspection();
 *       });
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');

module.exports = function (config) {
    var defaults = {
        server: {
            versionPath: 'v3/'
        }
    };
    var serviceOptions = $.extend({}, defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    urlConfig.filter = ';';

    var httpOptions = {
        url: urlConfig.getAPIPath('model') + 'publish'
    };
    if (serviceOptions.token) {
        httpOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    var publicAPI = {
        /**
         * Get the available functions and variables.
         *
         * **Example**
         *
         *      intro.get()
         *          .then(function(data) {
         *              // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *              console.log(data.functions);
         *              console.log(data.variables);
         *          });
         *
         * **Parameters**
         * @param  {String} `runId`   (Optional) Overrides the run id used when the service was created
         * @param  {Object} `options` (Optional) Overrides for configuration options.
         */
        get: function (runId, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            var params = {
                runId: runId || httpOptions.filter,
                commandWrapper: { command: { introspect: {} } },
                reanimate: false
            };
            return http.post(params, httpOptions);
        }
    };
    $.extend(this, publicAPI);
};
