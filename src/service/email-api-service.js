'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');

module.exports = function (config) {

    var defaults = {};

    var serviceOptions = $.extend({}, defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('v1/log')
    });

    if (serviceOptions.token) {
        httpOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(httpOptions);

    var publicAPI = {
        write: function (letter, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            if (!httpOptions.account) {
                throw new Error('No account specified.');
            }
            if (!httpOptions.project) {
                throw new Error('No project specified.');
            }

            return http.post(letter, httpOptions);
        }
    };

    $.extend(this, publicAPI);
};