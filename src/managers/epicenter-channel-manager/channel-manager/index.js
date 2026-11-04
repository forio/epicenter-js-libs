import Channel from 'service/channel-service';
import SessionManager from 'store/session-manager';

var deferUntilReady = function (cometd, ready) {
    var isReady = function () {
        return ready.state() === 'resolved';
    };
    var replay = function (method, args) {
        ready.done(function () {
            cometd[method].apply(cometd, args);
        });
    };
    return {
        batch: function (fn) {
            return isReady() ? cometd.batch(fn) : fn();
        },
        subscribe: function () {
            if (isReady()) {
                return cometd.subscribe.apply(cometd, arguments);
            }
            var subscription = {};
            var args = arguments;
            ready.done(function () {
                $.extend(subscription, cometd.subscribe.apply(cometd, args));
            });
            return subscription;
        },
        publish: function () {
            return isReady() ? cometd.publish.apply(cometd, arguments) : replay('publish', arguments);
        },
        unsubscribe: function () {
            return isReady() ? cometd.unsubscribe.apply(cometd, arguments) : replay('unsubscribe', arguments);
        }
    };
};

/**
 * @constructor
 * @param {object} options
 * @property {string} url The Cometd endpoint URL.
 * @property {string} [logLevel] The log level for the channel (logs to console).
 * @property {boolean} [websocketEnabled] Whether websocket support is active. Defaults to `true`, uses long-polling if false
 * @property {boolean} [ackEnabled] Whether the ACK extension is enabled. Defaults to `true`. See [https://docs.cometd.org/current/reference/#_extensions_acknowledge](https://docs.cometd.org/current/reference/#_extensions_acknowledge) for more info.
 * @property {boolean} [shareConnection] If false each instance of Channel will have a separate cometd connection to server, which could be noisy. Set to true (default) to re-use the same connection across instances.
 * @property {object} [channel] Other defaults to pass on to instances of the underlying [Channel Service](../channel-service/), which are created through `getChannel()`.
 * @property {object} [handshake] Options to pass to the channel handshake. For example, the [Epicenter Channel Manager](../epicenter-channel-manager/) passes `ext` and authorization information. More information on possible options is in the details of the underlying [Push Channel API](../../../rest_apis/multiplayer/channel/).
 * @property {function(): Promise} [resolveUrl] Returns a promise for the Cometd endpoint URL to connect to. When provided the handshake waits for it; `url` is used if it fails. Channels created in the meantime hold their subscriptions until the connection opens.
 */
function ChannelManager(options) {
    if (!$.cometd) {
        console.error('Cometd library not found. Please include epicenter-multiplayer-dependencies.js');
        throw new Error('Cometd library not found. Please include epicenter-multiplayer-dependencies.js');
    }
    if (!options || !options.url) {
        throw new Error('Please provide an url for the cometd server');
    }

    var defaults = {
        url: '',
        logLevel: 'info',
        websocketEnabled: true,
        ackEnabled: true,
        shareConnection: true,
        channel: {

        },
        handshake: undefined
    };
    this.sessionManager = new SessionManager();
    var defaultCometOptions = this.sessionManager.getMergedOptions(defaults, options);
    this.currentSubscriptions = [];
    this.options = defaultCometOptions;

    if (defaultCometOptions.shareConnection && ChannelManager.prototype._cometd) {
        this.cometd = ChannelManager.prototype._cometd;
        this._connectionReady = ChannelManager.prototype._connectionReady;
        return this;
    }

    var cometd = (defaultCometOptions.shareConnection && $.cometd) ? $.cometd : new $.CometD();
    ChannelManager.prototype._cometd = cometd;
    var connectionReady = $.Deferred();
    ChannelManager.prototype._connectionReady = connectionReady.promise();
    this._connectionReady = ChannelManager.prototype._connectionReady;

    cometd.websocketEnabled = defaultCometOptions.websocketEnabled;
    cometd.ackEnabled = defaultCometOptions.ackEnabled;

    this.isConnected = false;
    var connectionBroken = function (message) {
        $(this).trigger('disconnect', message);
    };
    var connectionSucceeded = function (message) {
        $(this).trigger('connect', message);
    };
    var me = this;

    cometd.configure(defaultCometOptions);

    cometd.addListener('/meta/connect', function (message) {
        var wasConnected = this.isConnected;
        this.isConnected = (message.successful === true);
        if (!wasConnected && this.isConnected) { //Connecting for the first time
            connectionSucceeded.call(this, message);
        } else if (wasConnected && !this.isConnected) { //Only throw disconnected message from the first disconnect, not once per try
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

    var connect = function (url) {
        if (url) {
            cometd.configure({ url: url });
            me.options.url = url;
        }
        cometd.handshake(defaultCometOptions.handshake);
        connectionReady.resolve();
    };
    if ($.isFunction(defaultCometOptions.resolveUrl)) {
        $.when(defaultCometOptions.resolveUrl()).then(connect, function () {
            connect();
        });
    } else {
        connect();
    }

    this.cometd = cometd;
}


ChannelManager.prototype = $.extend(ChannelManager.prototype, {

    /**
     * Creates and returns a channel, that is, an instance of a [Channel Service](../channel-service/).
     *
     * @example
     *      var cm = new F.manager.ChannelManager();
     *      var channel = cm.getChannel();
     *
     *      channel.subscribe('topic', callback);
     *      channel.publish('topic', { myData: 100 });
     *
     *
     * @param {Object|String} [options] If string, assumed to be the base channel url. If object, assumed to be configuration options for the constructor.
     * @return {Channel} Channel instance
     */
    getChannel: function (options) {
        //If you just want to pass in a string
        if (options && !$.isPlainObject(options)) {
            options = {
                base: options
            };
        }
        var isPending = this._connectionReady && this._connectionReady.state() === 'pending';
        var defaults = {
            transport: isPending ? deferUntilReady(this.cometd, this._connectionReady) : this.cometd
        };
        var channel = new Channel($.extend(true, {}, this.options.channel, defaults, options));


        //Wrap subs and unsubs so we can use it to re-attach handlers after being disconnected
        var subs = channel.subscribe;
        channel.subscribe = function () {
            var subid = subs.apply(channel, arguments);
            this.currentSubscriptions = this.currentSubscriptions.concat(subid);
            return subid;
        }.bind(this);


        var unsubs = channel.unsubscribe;
        channel.unsubscribe = function (subscription) {
            var removed = unsubs.apply(channel, arguments);
            for (var i = this.currentSubscriptions.length - 1; i >= 0; i--) {
                var current = this.currentSubscriptions[i];
                if (current === subscription || (removed.id !== undefined && current.id === removed.id)) {
                    this.currentSubscriptions.splice(i, 1);
                }
            }
            return removed;
        }.bind(this);

        return channel;
    },

    /**
     * Start listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/on/.
     *
     * Supported events are: `connect`, `disconnect`, `subscribe`, `unsubscribe`, `publish`, `error`.
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/on/.
     */
    on: function (event) {
        $(this).on.apply($(this), arguments);
    },

    /**
     * Stop listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/off/.
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/off/.
     */
    off: function (event) {
        $(this).off.apply($(this), arguments);
    },

    /**
     * Trigger events and execute handlers. Signature is same as for jQuery Events: http://api.jquery.com/trigger/.
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/trigger/.
     */
    trigger: function (event) {
        $(this).trigger.apply($(this), arguments);
    }
});

export default ChannelManager;
