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
        page: function (options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            httpOptions.headers['Range'] = httpOptions.range;

            var getParams = {
                account: httpOptions.account,
                project: httpOptions.project,
                run: httpOptions.run,
                group: httpOptions.group,
                user: httpOptions.user,
                level: httpOptions.level,
                startDate: httpOptions.startDate,
                endDate: httpOptions.endDate,
                q: httpOptions.q
            };

            return http.get(getParams, httpOptions);
        },
        log: function (records, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            return http.post(records, httpOptions);
        }
    };

    $.extend(this, publicAPI);
};