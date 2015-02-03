'use strict';
/**
* ##User API Adapter
*
* The user API adapter allows you to quert the /user API
*
*
*/

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;
var qutil = require('../util/query-util');

module.exports = function (config) {
    var defaults = {

       account: '',

       token: '',

        //Options to pass on to the underlying transport layer
        transport: {}
    };

    var serviceOptions = $.extend({}, defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');
    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('user')
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }

    if (serviceOptions.apiKey) {
        transportOptions.headers = {
            'Authorization': 'Basic ' + serviceOptions.apiKey
        };
    }

    var http = new TransportFactory(transportOptions);

    var publicAPI = {
        get: function (filter, options) {
            options = options || {};
            filter = filter || {};

            var getOptions = $.extend(true, {},
                serviceOptions,
                options
            );

            var toQFilter = function (filter) {
                var res = {};

                // API only supports filtering by username for now
                if (filter.userName) {
                    res.q = filter.userName;
                }

                return res;
            };

            var getFilters = qutil.toQueryFormat($.extend(true, {}, _pick(getOptions, 'account'), _pick(filter, 'id'), toQFilter(filter)));

            return http.get(getFilters, getOptions);
        },

        getById: function (userId, options) {
            return publicAPI.get({ id: userId }, options);
        }
    };

    $.extend(this, publicAPI);
};




