'use strict';
/**
 * ## Time API Adapter
 *
 */

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var apiEndpoint = 'time';

module.exports = function (config) {
    var serviceOptions = $.extend(true, {}, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');
    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    var http = new TransportFactory(transportOptions);

    var publicAPI = {
        getTime: function () {
            return http.get().then(function (t) { 
                return new Date(t); 
            });
        }
    };

    $.extend(this, publicAPI);
};
