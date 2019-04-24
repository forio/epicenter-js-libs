
import { getDefaultOptions, getURLConfig } from 'service/service-utils';
import TransportFactory from 'transport/http-transport-factory';
var apiEndpoint = 'presence';

/**
 *
 * @description
 * 
 * ## Presence API Service
 *
 * The Presence API Service provides methods to get and set the presence of an end user in a project, that is, to indicate whether the end user is online. This happens automatically: in projects that use [channels](../epicenter-channel-manager/), the end user's presence is published automatically on a "presence" channel that is specific to each group. You can also use the Presence API Service to do this explicitly: you can make a call to indicate that a particular end user is online or offline. 
 *
 * The Presence API Service is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/). It is typically used only in multiplayer projects, to facilitate end users communicating with each other. It is based on the query capabilities of the underlying RESTful [Presence API](../../../rest_apis/multiplayer/presence/).
 *
 *      var pr = new F.service.Presence();
 *      pr.markOnline('example-userId');
 *      pr.markOffline('example-userId');
 *      pr.getStatus();
 * 
 * @param {AccountAPIServiceOptions} config 
 * @property {string} [groupName] Epicenter group name. Note that this is the group *name*, not the group *id*. If left blank, taken from the session manager.
 */
export default function (config) {
    var defaults = {
        groupName: undefined,

        account: undefined,
        project: undefined,
        
        transport: {},
    };
    const serviceOptions = getDefaultOptions(defaults, config, {
        apiEndpoint: apiEndpoint
    });
    const urlConfig = getURLConfig(serviceOptions);
    var http = new TransportFactory(serviceOptions.transport);

    var getFinalParams = function (params) {
        if (typeof params === 'object') {
            return $.extend(true, {}, serviceOptions, params);
        }
        return serviceOptions;
    };

    const userOnlineTimers = {};
    function cancelKeepOnline(userid) {
        clearInterval(userOnlineTimers[userid]);
    }

    var publicAPI = {
        /**
         * Marks an end user as online.
         *
         *
         * @example
         *     var pr = new F.service.Presence();
         *     pr.markOnline('0000015a68d806bc09cd0a7d207f44ba5f74')
         *          .then(function(presenceObj) {
         *               console.log('user ', presenceObj.userId, 
         *                    ' now online, as of ', presenceObj.lastModified);
         *          });
         *
         * @param  {string} [userId] optional If not provided, taken from session cookie.
         * @param  {Object} [options] Additional options to change the presence service defaults.
         * @param  {boolean} [options.keepOnline] Starts a timer registering the user as online every 5 minutes. Timer is canceled when you call `markOffline` or `cancelKeepOnline`
         * @return {Promise} Promise with presence information for user marked online.
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
            
            if (options.keepOnline) {
                const PRESENCE_TIMEOUT_INTERVAL = 5;
                userOnlineTimers[userId] = setInterval(()=> {
                    http.post({ message: 'online' }, httpOptions);
                }, PRESENCE_TIMEOUT_INTERVAL * 60 * 1000);
            }
            return http.post({ message: 'online' }, httpOptions);
        },

        /**
         * If you set `keepOnline` to true while calling `markOnline`, use this to cancel the timer
         * @param {string} userid
         */
        cancelKeepOnline: function (userid) {
            cancelKeepOnline(userid);
        },

        /**
         * Marks an end user as offline.
         *
         *
         * @example
         * var pr = new F.service.Presence();
         * pr.markOffline('0000015a68d806bc09cd0a7d207f44ba5f74');
         *
         * @param  {string} [userId] If not provided, taken from session cookie.
         * @param  {Object} [options] Additional options to change the presence service defaults.
         * @return {Promise} Promise to remove presence record for end user.
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
            cancelKeepOnline(userId);
            return http.delete({}, httpOptions);
        },

        /**
         * Returns a list of all end users in this group that are currently online.
         *
         *
         * @example
         * var pr = new F.service.Presence();
         * pr.getStatus('groupName').then(function(onlineUsers) {
         *      for (var i=0; i < onlineUsers.length; i++) {
         *           console.log('user ', onlineUsers[i].userId, 
         *                ' is online as of ', onlineUsers[i].lastModified);
         *      }
         * });
         *
         * @param  {string} [groupName] If not provided, taken from session cookie.
         * @param  {object} [options] Additional options to change the presence service defaults.
         * @return {Promise} Promise with status of online users
         */
        getStatus: function (groupName, options) {
            options = options || {};
            var objParams = getFinalParams(groupName);
            if (!groupName && !objParams.groupName) {
                throw new Error('No groupName specified.');
            }
            groupName = groupName || objParams.groupName;
            var httpOptions = $.extend(true, {}, serviceOptions, options,
                { url: urlConfig.getAPIPath(apiEndpoint) + groupName }
            );
            return http.get({}, httpOptions);
        },

        /**
         * Appends a boolean 'isOnline' field to provided list of users
         *
         * @example
         * var pr = new F.service.Presence();
         * pr.getStatusForUsers([{ userId: 'a', userId: 'b'}]).then(function(onlineUsers) {
         *      console.log(onlineUsers[a].isOnline);
         * });
         *
         * @param {{userId: string}[]} userList Users to get status for
         * @param  {string} [groupName] If not provided, taken from session cookie.
         * @param  {object} [options] Additional options to change the presence service defaults.
         * 
         * @return {Promise} Promise with status of online users
         */
        getStatusForUsers: function (userList, groupName, options) {
            if (!userList || !Array.isArray(userList)) {
                throw new Error('getStatusForUsers: No userList provided.');
            }
            return this.getStatus(groupName, options).then((presenceList)=> {
                return userList.map((user)=> {
                    const isOnline = presenceList.find((status)=> status.userId === user.userId);
                    user.isOnline = !!isOnline;
                    return user;
                });
            });
        },

        /**
         * End users are automatically marked online and offline in a "presence" channel that is specific to each group. Gets this channel (an instance of the [Channel Service](../channel-service/)) for the given group. (Note that this Channel Service instance is also available from the [Epicenter Channel Manager getPresenceChannel()](../epicenter-channel-manager/#getPresenceChannel).)
         *
         * @example
         * var pr = new F.service.Presence();
         * var cm = pr.getChannel('group1');
         * cm.publish('', 'a message to presence channel');
         *
         * Channel instance for Presence channel
         * @param  {string} [groupName] If not provided, taken from session cookie.
         * @param  {Object} [options] Additional options to change the presence service defaults
         * @return {Channel} Channel instance
         */
        getChannel: function (groupName, options) {
            var ChannelManager = require('managers/epicenter-channel-manager').default;
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
}
