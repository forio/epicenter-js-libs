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
        websocketEnabled: false //needs to be turned on on the server
    };
    var defaultCometOptions = $.extend(true, {}, options, defaults);

    cometd.websocketEnabled = defaultCometOptions.websocketEnabled;

    this.isConnected = false;
    this.currentSubscriptions = [];

    var connectionBroken = function (message) {
        $(this).trigger('disconnect', message);
    };
    var connectionSucceeded = function (message) {
        $(this).trigger('connect', message);
    };
    var me = this;

    cometd.configure(defaultCometOptions);

    /* /meta/connect is a bayeux-defined comet channel
     * Use to listen for error messages from server. E.g: Network error
     */
    cometd.addListener('/meta/connect', function (message) {
        var wasConnected = this.isConnected;
        this.isConnected = (message.successful === true);
        if (!wasConnected && this.isConnected) { //Connecting for the first time
            connectionSucceeded(message);
        } else if (wasConnected && !this.isConnected) { //Only throw disconnected message fro the first disconnect, not once per try
            connectionBroken(message);
        }
    }.bind(this));

    cometd.addListener('/meta/disconnect', function () {
        console.log('/meta');
    });

    cometd.addListener('/meta/handshake', function (message) {
        console.log('shake it', message);
        if (message.successful) {
            cometd.batch(function () {
                $(me.currentSubscriptions).each(function (index, subs) {
                    cometd.resubscribe(subs);
                });
            });
        }
    });
    // cometd.addListener('/meta/subscribe', function (message) {
    //     console.log('/meta/subscribe', message);
    // });

    cometd.handshake();

    this.cometd = cometd;
};

ChannelManager.prototype.getChannel = function (options) {
    var defaults = {
        transport: this.cometd
    };
    var channel = new Channel($.extend(true, {}, defaults, options));


    //Wrap subs and unsubs so we can use it to re-attach handlers after being disconnected
    var subs = channel.subscribe;
    channel.subscribe = function () {
        var subid = subs.apply(channel, arguments);
        this.currentSubscriptions.push(subid);
        return subid;
    }.bind(this);


    var unsubs = channel.subscribe;
    channel.unsubscribe = function () {
        var removed = unsubs.apply(channel, arguments);
        for (var i = 0; i < subs.length; i++) {
            if (subs[i].id === removed.id) {
                subs[i].splice(i, 1);
            }
        }
        return removed;
    }.bind(this);

    return channel;
};

//Make this a event source
ChannelManager.prototype.on = function () {
    $(this).on.apply($(this), arguments);
};
ChannelManager.prototype.off = function () {
    $(this).off.apply($(this), arguments);
};
ChannelManager.prototype.trigger = function () {
    $(this).trigger.apply($(this), arguments);
};

module.exports = ChannelManager;
