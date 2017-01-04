/**
 *
 * ## Presence API Adapter
 *
 * The Presence API Adapter provides methods to get and set the presence of a user in a project. It is based on query capabilities of the underlying RESTful [Presence API](../../../rest_apis/presence/).
 *
 * This is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/).
 *
 *      var pr = new F.service.Presence({ token: 'user-or-project-access-token' });
 *      pr.get({ account: 'acme', project: 'sample' });
 */

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');
var apiEndpoint = 'presence';

module.exports = function (config) {
    var defaults = {
        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL or session manager.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to empty string. If left undefined, taken from the URL or session manager.
         * @type {String}
         */
        project: undefined,

        /**
         * Epicenter group id. Defaults to a blank string. Note that this is the group *name*, not the group *id*. If left blank taken from the session manager.
         * @type {string}
         */
        groupName: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {},
    };
    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
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
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(transportOptions, serviceOptions);


    var getFinalParams = function (params) {
        if (typeof params === 'object') {
            return $.extend(true, serviceOptions, params);
        }
        return serviceOptions;
    };

    var publicAPI = {
        markOnline: function (params, options) {
            options = options || {};
            var isString = typeof params === 'string';
            var objParams = getFinalParams(params);
            if (!isString && !objParams.groupName) {
                throw new Error('No groupName specified.');
            }
            var userId = isString ? params : objParams.userId;
            var groupName = objParams.groupName;
            var httpOptions = $.extend(true, serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + urlConfig.accountPath + '/' + urlConfig.projectPath + '/' + groupName + '/' + userId }
            );
            return http.post({ message: 'online' }, httpOptions);
        },

        markOffline: function (params, options) {
            options = options || {};
            var isString = typeof params === 'string';
            var objParams = getFinalParams(params);
            if (!isString && !objParams.groupName) {
                throw new Error('No groupName specified.');
            }
            var userId = isString ? params : objParams.userId;
            var groupName = objParams.groupName;
            var httpOptions = $.extend(true, serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + urlConfig.accountPath + '/' + urlConfig.projectPath + '/' + groupName + '/' + userId }
            );
            return http.delete({}, httpOptions);
        },

        getStatus: function (params, options) {
            options = options || {};
            var isString = typeof params === 'string';
            var objParams = getFinalParams(params);
            if (!isString && !objParams.groupName) {
                throw new Error('No groupName specified.');
            }
            var groupName = isString ? params : objParams.groupName;
            var httpOptions = $.extend(true, serviceOptions,
                options,
                { url: urlConfig.getAPIPath(apiEndpoint) + urlConfig.accountPath + '/' + urlConfig.projectPath + '/' + groupName }
            );
            return http.get({}, httpOptions);
        }


    };

    $.extend(this, publicAPI);
};
