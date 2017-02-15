/**
 *
 * ## Presence API Adapter
 *
 * The Presence API Adapter provides methods to get and set the presence of a user in a project. It is based on query capabilities of the underlying RESTful [Presence API](../../../rest_apis/presence/).
 *
 * This is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/).
 *
 *      var pr = new F.service.Presence({ token: 'user-or-project-access-token' });
 *      pr.markOnline('example-userId')
 *      pr.markOffline('example-userId')
 *      pr.getStatus();
 */

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');
var apiEndpoint = 'presence';
var ChannelManager = require('../managers/epicenter-channel-manager');
var Member = require('../service/member-api-adapter');
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
         * Epicenter group name. Defaults to a blank string. Note that this is the group *name*, not the group *id*. If left blank taken from the session manager.
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
            return $.extend(true, {}, serviceOptions, params);
        }
        return serviceOptions;
    };

    var publicAPI = {
        /**
         * Mark an user online in the presence api
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     pr.markOnline('userId').then(() => (userOnline) {
         *     })
         *
         * **Return Value**
         *
         * promise with user marked online
         *
         * **Parameters**
         *
         * @param  {String} userId(optional)
         * @param  {Object} options: additional options to change the presence service defaults
         * @return {Promise} promise
         */
        markOnline: function (userId, options) {
            options = options || {};
            var isString = typeof userId === 'string';
            var objParams = getFinalParams(userId);
            if (!objParams.groupName && !options.groupName) {
                throw new Error('No groupName specified.');
            }
            userId = isString ? userId : objParams.userId;
            var groupName = options.groupName || objParams.groupName;
            var httpOptions = $.extend(true, {}, serviceOptions, options,
                { url: urlConfig.getAPIPath(apiEndpoint) + groupName + '/' + userId }
            );
            return http.post({ message: 'online' }, httpOptions);
        },

        /**
         * Mark an user offline in the presence api
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     pr.markOffline('userId').then(() => (userOnline) {
         *     })
         *
         * **Return Value**
         *
         * promise with user marked offline
         *
         * **Parameters**
         *
         * @param  {String} userId(optional)
         * @param  {Object} options: additional options to change the presence service defaults
         * @return {Promise} promise
         */
        markOffline: function (userId, options) {
            options = options || {};
            var isString = typeof userId === 'string';
            var objParams = getFinalParams(userId);
            if (!objParams.groupName && !options.groupName) {
                throw new Error('No groupName specified.');
            }
            userId = isString ? userId : objParams.userId;
            var groupName = options.groupName || objParams.groupName;
            var httpOptions = $.extend(true, {}, serviceOptions, options,
                { url: urlConfig.getAPIPath(apiEndpoint) + groupName + '/' + userId }
            );
            return http.delete({}, httpOptions);
        },

        /**
         * Get a list of online users
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     pr.getStatus('groupName').then(() => (onlineUsers) {
         *     })
         *
         * **Return Value**
         *
         * promise with response of online users
         *
         * **Parameters**
         *
         * @param  {String} groupName(optional)
         * @param  {Object} options: additional options to change the presence service defaults
         * @return {Promise} promise
         */
        getStatus: function (groupName, options) {
            options = options || {};
            var isString = typeof groupName === 'string';
            var objParams = getFinalParams(groupName);
            if (!groupName && !objParams.groupName) {
                throw new Error('No groupName specified.');
            }
            groupName = groupName || objParams.groupName;
            var httpOptions = $.extend(true, {}, serviceOptions, options,
                { url: urlConfig.getAPIPath(apiEndpoint) + groupName }
            );
            var addUsername = function () {
                var dfd = $.Deferred();
                var m = new Member();
                m.getGroupDetails(objParams.groupId).then(function (group) {
                    var members = group.members;
                    http.get({}, httpOptions).then(function (status) {
                        dfd.resolve(status.map(function (onlineUser) {
                            var user = members.find(function (m) {
                                return m.userId === onlineUser.userId;
                            });
                            if (user) {
                                onlineUser.userName = user.userName;
                                onlineUser.firstName = user.firstName;
                                onlineUser.lastName = user.lastName;
                            }
                            return onlineUser;
                        }));
                    });
                });
                return dfd.promise();
            };
            if (!isString) {
                // This will only work if the user requesting is a facilitator due to Member API permission
                return addUsername();
            } else {
                return http.get({}, httpOptions);
            }
        },

        /**
         * Shorthand for getting the presenceChannel for live status update of users getting online
         *
         *
         * **Example**
         *
         *     var pr = new F.service.Presence();
         *     pr.getChannel('groupName').then(() => (userOnline) {
         *     })
         *
         * **Return Value**
         *
         * Presence channel
         *
         * **Parameters**
         *
         * @param  {String} groupName(optional)
         * @param  {Object} options: additional options to change the presence service defaults
         * @return {Channel} presence Channel
         */
        getChannel: function (groupName, options) {
            options = options || {};
            var isString = typeof groupName === 'string';
            var objParams = getFinalParams(groupName);
            if (!isString && !objParams.groupName) {
                throw new Error('No groupName specified.');
            }
            groupName = isString ? groupName : objParams.groupName;
            var cm = new ChannelManager(options);
            return cm.getPresenceChannel(groupName);
        }
    };

    $.extend(this, publicAPI);
};
