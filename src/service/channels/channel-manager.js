'use strict';

module.exports = function (options) {
    if (!options.url) {
        throw new Error('Please provide a cometd url to connect to');
    }
    var cometd = $.cometd;
    if (!cometd) {
        throw new Error('Cometd library not found. Please include epicenter-multiplayer-dependencies.js');
    }

    var defaults = {
        url: '',
        logLevel: 'info'
    };
    var defaultCometOptions = $.extend(true, {}, options, defaults);

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
};
