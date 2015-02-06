'use strict';

var Channel = require('./channel.js');

var ChannelManager = function (options) {
    var cometd = $.cometd;
    if (!cometd) {
        throw new Error('Cometd library not found. Please include epicenter-multiplayer-dependencies.js');
    }

    var defaults = {
        url: 'https://api.forio.com/channel/subscribe/',
        logLevel: 'info',
        websocketEnabled: false
    };
    var defaultCometOptions = $.extend(true, {}, options, defaults);

    cometd.websocketEnabled = defaultCometOptions.websocketEnabled;

    this.isConnected = false;

    var connectionBroken = function (message) {
        $(this).trigger('disconnect', message);
    };
    var connectionSucceeded = function (message) {
        $(this).trigger('connect', message);
    };

    cometd.configure(defaultCometOptions);

    /* /meta/connect is a bayeux-defined comet channel
     * Use to listen for error messages from server. E.g: Network error
     */
    cometd.addListener('/meta/connect', function (message) {
        var isConnected = this.isConnected;
        var wasConnected = isConnected;
        isConnected = (message.successful === true);
        if (!wasConnected && isConnected) { //Connecting for the first time
            connectionSucceeded(message);
        } else if (wasConnected && !isConnected) {
            connectionBroken(message);
        }
    });

    /* Service channels are for request-response type commn.
     *
     */
    cometd.handshake();

    this.cometd = cometd;
};

ChannelManager.prototype.getChannel = function (options) {
    var defaults = {
        transport: this.cometd
    };
    return new Channel($.extend(true, {}, defaults, options));
};

module.exports = ChannelManager;
