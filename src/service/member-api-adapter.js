/**
 *
 * ##Member API Adapter
 *
 * The Member API Adapter provides methods to lookup user details or group details
 *
 *      var auth = new F.adapter.Member();
 *      auth.getGroupsByUser({ userId: 'b6b313a3-ab84-479c-baea-206f6bff337' });
 *      auth.getGroupDetails({ groupId: '00b53308-9833-47f2-b21e-1278c07d53b8' });
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;
var apiEndpoint = 'member/local';

module.exports = function (config) {
    var defaults = {
        /**
         * Epicenter userId. Defaults to a blank string
         * @type { string}
         */
        userId: '',

        /**
         * Epicenter groupId. Defaults to a blank string
         * @type { string}
         */
        groupId: '',

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };
    var serviceOptions = $.extend({}, defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    var authorizationHeader = function (token) {
        if (token) {
            return {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            };
        }
        return {};
    }
    var http = new TransportFactory(transportOptions, authorizationHeader(serviceOptions.token));

    var publicAPI = {

        getGroupsByUser: function (params, options) {
            options = options || {};
            var httpOptions = $.extend(true, serviceOptions,
                options,
                authorizationHeader(options.token)
            );
            if (!params.userId) {
                throw new Error('No userId specified.');
            }

            var getParms = _pick(params, 'userId');
            return http.get(getParms, httpOptions);
        },

        getGroupDetails: function (params, options) {
            options = options || {};
            if (!params.groupId) {
                throw new Error('No groupId specified.');
            }
            var httpOptions = $.extend(true, serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + params.groupId },
                authorizationHeader(options.token)
            );

            return http.get({}, httpOptions);
        }
    };

    $.extend(this, publicAPI);
};
