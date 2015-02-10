'use strict';

/**
 * Wrapper around channel manager to instantiate it with epicenter-specific defaults
 */

var ChannelManager = require('./channel-manager');
var classFrom = require('../../util/inherit');
var urlService = require('../url-config-service');

var AuthManager = require('../../managers/auth-manager');

var __super = ChannelManager.prototype;

var EpicenterChannelManager = classFrom(ChannelManager, {
    constructor: function (options) {
        var am = new AuthManager();
        var userInfo = am.getCurrentUserSessionInfo();

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
            defaultCometOptions.url = urlOpts.protocol + '://' + urlOpts.host + '/channel/subscribe';
        }

        this.options = defaultCometOptions;
        return __super.constructor.call(this, defaultCometOptions);
    },

    getWorldChannel: function (world, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        if (!groupName) {
            if (this.options.groupName) {
                groupName = this.options.groupName;
            } else {
                throw new Error('Group id not found. Please log-in again, or specify group name explicitly');
            }
        }
        var baseTopic = ['/project', this.options.server.account, this.options.server.project, groupName, worldid].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    },

    getGroupChannel: function (groupName) {
        if (!groupName) {
            if (this.options.groupName) {
                groupName = this.options.groupName;
            } else {
                throw new Error('Please specify a group name');
            }
        }
        var baseTopic = ['/project', this.options.server.account, this.options.server.project, groupName].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    },
    getUserChannel: function (user, world, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        var userid = ($.isPlainObject(user) && user.id) ? user.id : user;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }
        if (!userid) {
            throw new Error('Please specify a user id');
        }
        if (!groupName) {
            if (this.options.groupName) {
                groupName = this.options.groupName;
            } else {
                throw new Error('Group id not found. Please log-in again, or specify group name explicitly');
            }
        }
        var baseTopic = ['/project', this.options.server.account, this.options.server.project, groupName, worldid, userid].join('/');
        return __super.getChannel.call(this, { base: baseTopic });
    }
});

module.exports = EpicenterChannelManager;
