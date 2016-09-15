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
var apiEndpoint = 'model/introspect';

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to empty string. If left undefined, taken from the URL.
         * @type {String}
         */
        project: undefined,

    };
    var serviceOptions = $.extend({}, defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }
    
    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });
    if (serviceOptions.token) {
        transportOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(transportOptions);

    var publicAPI = {
        /**
         * Get the available functions and variables for a given model file. Note: this does not work for any model which requires additional parameters like files.
         *
         * **Example**
         *
         *      intro.byModel('abc.vmf')
         *          .then(function(data) {
         *              // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *              console.log(data.functions);
         *              console.log(data.variables);
         *          });
         *
         * **Parameters**
         * @param  {String} `modelFile` name of the model file to introspect
         * @param  {Object} `options` (Optional) Overrides for configuration options.
         */
        byModel: function (modelFile, options) {
            var opts = $.extend(true, {}, serviceOptions, options);
            if (!opts.account || !opts.project) {
                throw new Error('Account and project are required when using introspect#byModel');
            }
            if (!modelFile) {
                throw new Error('modelFile is required when using introspect#byModel');
            }
            var url = { url: urlConfig.getAPIPath(apiEndpoint) + [opts.account, opts.project, modelFile].join('/') };
            var httpOptions = $.extend(true, {}, serviceOptions, options, url);
            return http.get('', httpOptions);
        },

        /**
         * Get the available functions and variables for a given model file. Note: this does not work for any model which requires additional parameters like files.
         *
         * **Example**
         *
         *      intro.byRunID(runId)
         *          .then(function(data) {
         *              // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *              console.log(data.functions);
         *              console.log(data.variables);
         *          });
         *
         * **Parameters**
         * @param  {String} `runId` id of the run to introspect
         * @param  {Object} `options` (Optional) Overrides for configuration options.
         */
        byRunID: function (runId, options) {
            var url = { url: urlConfig.getAPIPath(apiEndpoint) + runId };
            var httpOptions = $.extend(true, {}, serviceOptions, options, url);
            return http.get('', httpOptions);
        }
    };
    $.extend(this, publicAPI);
};
