'use strict';

/**
 * Wrapper around channel manager to instantiate it with epicenter-specific defaults
 */

var ChannelManager = require('./channel-manager');
var classFrom = require('../../util/inherit');
var urlService = require('../url-config-service');


var __super = ChannelManager.prototype;

var EpicenterChannelManager = classFrom(ChannelManager, {
    constructor: function (options) {
        var defaults = {
            //See docs for url config service
            server: {}
        };
        var defaultCometOptions = $.extend(true, {}, defaults, options);

        var urlOpts = urlService(defaultCometOptions.server);
        if (!defaultCometOptions.url) {
            defaultCometOptions.url = urlOpts.protocol + '://' + urlOpts.host + '/channel/subscribe/project/';
        }

        __super.constructor.call(this, defaultCometOptions);
    },

    getGameChannel: function () {

    },
    getGroupChannel: function () {

    },
    getUserChannel: function () {

    },

    magic: function () {
        console.log('Boo!');
    }
});

module.exports = EpicenterChannelManager;
