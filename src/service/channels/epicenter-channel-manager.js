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
        this.session = new AuthManager();
        var userInfo = this.session.getCurrentUserSessionInfo();

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

    getGameChannel: function () {

    },
    getGroupChannel: function (groupName) {
        if (!groupName) {
            if (this.options.groupName) {
                groupName = this.options.groupName;
            } else {
                throw new Error('Please specify a group name');
            }
        }

        var baseTopic = '/project/' + this.options.server.account + '/' + this.options.server.project + '/' + groupName;
        return __super.getChannel.call(this, { name: baseTopic });
    },
    getUserChannel: function () {

    },

    magic: function () {
        console.log('Boo!');
    }
});

module.exports = EpicenterChannelManager;
