'use strict';

/**
 * Wrapper around channel manager to instantiate it with epicenter-specific defaults
 */

var ChannelManager = require('./channel-manager');
var classFrom = require('../util/inherit');
var urlService = require('../service/url-config-service');

var AuthManager = require('./auth-manager');

var session = new AuthManager();
var getFromSessionOrError = function (value, sessionKeyName) {
    if (!value) {
        var userInfo = session.getCurrentUserSessionInfo();
        if (userInfo[sessionKeyName]) {
            value = userInfo[sessionKeyName];
        } else {
            throw new Error(sessionKeyName + ' not found. Please log-in again, or specify ' + sessionKeyName + ' explicitly');
        }
    }
};
var __super = ChannelManager.prototype;
var EpicenterChannelManager = classFrom(ChannelManager, {
    constructor: function (options) {
        var userInfo = session.getCurrentUserSessionInfo();

        var defaults = {
            //See docs for url config service
            server: {
                account: userInfo.account,
                project: userInfo.project
            }
        };
        var defaultCometOptions = $.extend(true, {}, defaults, userInfo, options);

        var urlOpts = urlService(defaultCometOptions.server);
        if (!defaultCometOptions.url) {
            //Default epicenter cometd endpoint
            defaultCometOptions.url = urlOpts.protocol + '://' + urlOpts.host + '/channel/subscribe';
        }

        this.options = defaultCometOptions;
        return __super.constructor.call(this, defaultCometOptions);
    },

    /**
     * Get a pub/sub channel for the given group. There will be no default notifications from Epicenter on this channel, all messages will be user-orginated
     *
     * ** Example usage **
     *     var cm = new F.manager.Channel();
     *     var gc = cm.getgetGroupChannel();
     *     gc.subscribe('broadcasts', callback);
     *
     * @param  {String} groupName (optional) Group to broadcast to. If not provided, picks up group from current session if logged in.
     * @return {Channel}
     */
    getGroupChannel: function (groupName) {
        groupName = getFromSessionOrError(groupName, 'groupName');
        var baseTopic = ['/group', this.options.server.account, this.options.server.project, groupName].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    },

    /**
     * Get a pub/sub channel for the given world. Note: You'll not get notifications for worlds which're not in memory. Typically used with the WorldManager
     *
     * ** Example usage **
     *     var cm = new F.manager.Channel();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'X',
     *         project: 'Y',
     *         model: 'model.eqn'
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldService) {
     *         var worldChannel = cm.getWorldChannel(worldObject);
     *         worldChannel.subscribe('', function (data) {
     *             console.log(data);
     *         });
     *      });
     *
     * @param  {String|Object} world     world object or id
     * @param  {String} groupName (optional) Group the world exists in. If not provided, picks up group from current session if logged in.
     * @return {Channel}
     */
    getWorldChannel: function (world, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        groupName = getFromSessionOrError(groupName, 'groupName');
        var baseTopic = ['/game', this.options.server.account, this.options.server.project, groupName, worldid].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    },

    /**
     * Get a pub/sub channel for the current user. Needs the user's current world to work. Note: You'll not get notifications for worlds which're not in memory. Typically used with the WorldManager
     *
     * ** Example usage **
     *     var cm = new F.manager.Channel();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'X',
     *         project: 'Y',
     *         model: 'model.eqn'
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldService) {
     *         var worldChannel = cm.getWorldChannel(worldObject);
     *         worldChannel.subscribe('', function (data) {
     *             console.log(data);
     *         });
     *      });
     *
     * @param  {String|Object} world     world object or id
     * @param  {String|Object} user (Optional)    user object or id. If not provided, picks up user id from current session if logged in.
     * @param  {String} groupName (optional) Group the world exists in. If not provided, picks up group from current session if logged in.
     * @return {Channel}
     */
    getUserChannel: function (world, user, groupName) {
        var userid = ($.isPlainObject(user) && user.id) ? user.id : user;
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        userid = getFromSessionOrError(userid, 'userId');
        groupName = getFromSessionOrError(groupName, 'groupName');

        var baseTopic = ['/users', this.options.server.account, this.options.server.project, groupName, worldid, userid].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    }
});

module.exports = EpicenterChannelManager;
