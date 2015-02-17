'use strict';

var Channel = require('./channel.js');

var ChannelManager = function (options) {
    var cometd = $.cometd;
    if (!cometd) {
        throw new Error('Cometd library not found. Please include epicenter-multiplayer-dependencies.js');
    }
    if (!options || !options.url) {
        throw new Error('Please provide an url for the cometd server');
    }

    var defaults = {
        url: '',
        logLevel: 'info',
        websocketEnabled: false, //needs to be turned on on the server

        //Everything provided here will be provided as defaults for channel created through getChannel
        channel: {

        }
    };
    var defaultCometOptions = $.extend(true, {}, defaults, options);

    cometd.websocketEnabled = defaultCometOptions.websocketEnabled;

    this.isConnected = false;
    this.currentSubscriptions = [];
    this.options = defaultCometOptions;

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
            connectionSucceeded.call(this, message);
        } else if (wasConnected && !this.isConnected) { //Only throw disconnected message fro the first disconnect, not once per try
            connectionBroken.call(this, message);
        }
    }.bind(this));

    cometd.addListener('/meta/disconnect', connectionBroken);

    cometd.addListener('/meta/handshake', function (message) {
        if (message.successful) {
            //http://docs.cometd.org/reference/javascript_subscribe.html#javascript_subscribe_meta_channels
            // ^ "dynamic subscriptions are cleared (like any other subscription) and the application needs to figure out which dynamic subscription must be performed again"
            cometd.batch(function () {
                $(me.currentSubscriptions).each(function (index, subs) {
                    cometd.resubscribe(subs);
                });
            });
        }
    });

    //Other interesting events for reference
    cometd.addListener('/meta/subscribe', function (message) {
        $(me).trigger('subscribe', message);
    });
    cometd.addListener('/meta/unsubscribe', function (message) {
        $(me).trigger('unsubscribe', message);
    });
    cometd.addListener('/meta/publish', function (message) {
        $(me).trigger('publish', message);
    });
    cometd.addListener('/meta/unsuccessful', function (message) {
        $(me).trigger('error', message);
    });

    cometd.handshake();

    this.cometd = cometd;
};

ChannelManager.prototype.getChannel = function (options) {
    //If you just want to pass in a string
    if (options && !$.isPlainObject(options)) {
        options = {
            base: options
        };
    }
    var defaults = {
        transport: this.cometd
    };
    var channel = new Channel($.extend(true, {}, this.options.channel, defaults, options));


    //Wrap subs and unsubs so we can use it to re-attach handlers after being disconnected
    var subs = channel.subscribe;
    channel.subscribe = function () {
        var subid = subs.apply(channel, arguments);
        this.currentSubscriptions  = this.currentSubscriptions.concat(subid);
        return subid;
    }.bind(this);


    var unsubs = channel.unsubscribe;
    channel.unsubscribe = function () {
        var removed = unsubs.apply(channel, arguments);
        for (var i = 0; i < this.currentSubscriptions.length; i++) {
            if (this.currentSubscriptions[i].id === removed.id) {
                this.currentSubscriptions.splice(i, 1);
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
