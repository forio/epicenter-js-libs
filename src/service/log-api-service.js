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
        readPage: function (options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            if (!httpOptions.account) {
                throw new Error('No account specified.');
            }
            if (!httpOptions.project) {
                throw new Error('No project specified.');
            }
            if (httpOptions.level && !((httpOptions.level == 'DEBUG') || (httpOptions.level == 'INFO') || (httpOptions.level == 'WARN') || (httpOptions.level == 'ERROR') || (httpOptions.level == 'FATAL'))) {
                throw new Error('The level must be one of DEBUG, INFO, WARN, ERROR, or FATAL');
            }

            if (httpOptions.range) {
                httpOptions.headers['Range'] = httpOptions.range;
            }

            var getParams = {
                account: httpOptions.account,
                project: httpOptions.project
            };

            $.each(['run', 'group', 'user', 'level', 'startDate', 'endDate', 'q'], function (i, el) {
                if (httpOptions[el]) {
                    getParams[el] = httpOptions[el]
                }
            });

            return http.get(getParams, httpOptions);
        },
        log: function (records, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            return http.post(records, httpOptions);
        }
    };

    $.extend(this, publicAPI);
};