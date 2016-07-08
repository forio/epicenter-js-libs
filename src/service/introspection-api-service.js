/**
 *
 * ## Introspection API Service
 *
 * Used in conjunction with the [Run API Service](../run-api-service/) to access Native DMS 3 Introspection calls
 *
 *     var rm = new F.manager.RunManager({
 *           run: {
 *               account: 'acme-simulations',
 *               project: 'supply-chain-game',
 *               model: 'supply-chain-model.jl'
 *           }
 *      });
 *     rm.getRun()
 *       .then(function() {
 *          var is = rm.run.introspection();
 *        });
 *
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var rutil = require('../util/run-util');

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

    var getURL = function () {
        var url = urlConfig.getAPIPath('model') + 'publish';
        return url;
    };

    var httpOptions = {
        url: getURL
    };
    if (serviceOptions.token) {
        httpOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);
    http.splitGet = rutil.splitGetFactory(httpOptions);

    var publicAPI = {
        /**
         * Get the available Functions and Variables
         *
         * **Example**
         *
         *      vs.get()
         *          .then(function(data) {
         *              // data contains an object with available functions (used with operations API) and available variables (used with variables API)
         *              console.log(data.functions);
         *              console.log(data.variables);
         *          });
         *
         * **Parameters**
         * @param  {Object} `options` (Optional) Overrides for configuration options.
         */
        get: function (options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            var params = {
                runId: httpOptions.filter,
                commandWrapper: { command: { introspect: {} } },
                reanimate: false
            };
            return http.post(params, httpOptions);
        }
    };
    $.extend(this, publicAPI);
};
