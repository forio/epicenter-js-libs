var makeName = function (channelName, topic) {
    //Replace trailing/double slashes
    var newName = (channelName ? (channelName + '/' + topic) : topic).replace(/\/\//g, '/').replace(/\/$/, '');
    return newName;
};


export default class ChannelService {
    /**
     * @param {object} options
     * @property {string} [base] The base topic. This is added as a prefix to all further topics you publish or subscribe to while working with this Channel Service.
     * @property {function(topic): string} [topicResolver]  A function that processes all 'topics' passed into the `publish` and `subscribe` methods. This is useful if you want to implement your own serialize functions for converting custom objects to topic names. By default, it just echoes the topic.
     * @property {object} [transport] The instance of `$.cometd` to hook onto. See http://docs.cometd.org/reference/javascript.html for additional background on cometd.
     */
    constructor(options) {
        var defaults = {
            base: '',
            topicResolver: function (topic) {
                return topic;
            },
            transport: null
        };
        this.channelOptions = $.extend(true, {}, defaults, options);
    }

    /**
     * Subscribe to changes on a topic.
     *
     * The topic should include the full path of the account id (**Team ID** for team projects), project id, and group name. (In most cases, it is simpler to use the [Epicenter Channel Manager](../epicenter-channel-manager/) instead, in which case this is configured for you.)
     *
     *  @example
     *  var cb = function(val) { console.log(val.data); };
     *
     *  // Subscribe to changes on a top-level 'run' topic
     *  cs.subscribe('/acme-simulations/supply-chain-game/fall-seminar/run', cb);
     *
     *  // Subscribe to changes on children of the 'run' topic. Note this will also be triggered for changes to run.x.y.z.
     *  cs.subscribe('/acme-simulations/supply-chain-game/fall-seminar/run/*', cb);
     *
     *  // Subscribe to changes on both the top-level 'run' topic and its children
     *  cs.subscribe(['/acme-simulations/supply-chain-game/fall-seminar/run',
     *      '/acme-simulations/supply-chain-game/fall-seminar/run/*'], cb);
     *
     *  // Subscribe to changes on a particular variable
     *  subscribe('/acme-simulations/supply-chain-game/fall-seminar/run/variables/price', cb);
     *
     * @param  {String|Array}   topic    List of topics to listen for changes on.
     * @param  {Function} callback Callback function to execute. Callback is called with signature `(evt, payload, metadata)`.
     * @param  {Object}   context  Context in which the `callback` is executed.
     * @param  {Object}   [options] Overrides for configuration options.
     * @param  {number}   [options.priority]  Used to control order of operations. Defaults to 0. Can be any +ve or -ve number.
     * @param  {String|number|Function}   [options.value] The `callback` is only triggered if this condition matches. See examples for details.
     * @return {object} Returns a subscription object you can later use to unsubscribe.
     */
    subscribe(topic, callback, context, options) {

        var topics = [].concat(topic);
        var me = this;
        var subscriptionIds = [];
        var opts = me.channelOptions;

        opts.transport.batch(function () {
            $.each(topics, function (index, topic) {
                topic = makeName(opts.base, opts.topicResolver(topic));
                subscriptionIds.push(opts.transport.subscribe(topic, callback));
            });
        });
        return (subscriptionIds[1] ? subscriptionIds : subscriptionIds[0]);
    }

    /**
     * Publish data to a topic.
     *
     * @example
     * // Send data to all subscribers of the 'run' topic
     * cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run', { completed: false });
     *
     * // Send data to all subscribers of the 'run/variables' topic
     * cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run/variables', { price: 50 });
     *
     * @param  {String} topic Topic to publish to.
     * @param  {*} data  Data to publish to topic.
     * @return {Array | Object} Responses to published data
     */
    publish(topic, data) {
        var topics = [].concat(topic);
        var me = this;
        var returnObjs = [];
        var opts = me.channelOptions;


        opts.transport.batch(function () {
            $.each(topics, function (index, topic) {
                topic = makeName(opts.base, opts.topicResolver(topic));
                if (topic.charAt(topic.length - 1) === '*') {
                    topic = topic.replace(/\*+$/, '');
                    console.warn('You can cannot publish to channels with wildcards. Publishing to ', topic, 'instead');
                }
                returnObjs.push(opts.transport.publish(topic, data));
            });
        });
        return (returnObjs[1] ? returnObjs : returnObjs[0]);
    }

    /**
     * Unsubscribe from changes to a topic.
     *
     * @example
     * cs.unsubscribe('sampleToken');
     *
     *
     * @param  {String} token The token for topic is returned when you initially subscribe. Pass it here to unsubscribe from that topic.
     * @return {Object} reference to current instance
     */
    unsubscribe(token) {
        this.channelOptions.transport.unsubscribe(token);
        return this;
    }

    /**
     * Start listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/on/.
     *
     * Supported events are: `connect`, `disconnect`, `subscribe`, `unsubscribe`, `publish`, `error`.
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/on/.
     */
    on(event) {
        $(this).on.apply($(this), arguments);
    }

    /**
     * Stop listening for events on this instance. Signature is same as for jQuery Events: http://api.jquery.com/off/.
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/off/.
     */
    off(event) {
        $(this).off.apply($(this), arguments);
    }

    /**
     * Trigger events and execute handlers. Signature is same as for jQuery Events: http://api.jquery.com/trigger/.
     * @param {string} event The event type. See more detail at jQuery Events: http://api.jquery.com/trigger/.
     */
    trigger(event) {
        $(this).trigger.apply($(this), arguments);
    }
}

// future functionality:
//      // Set the context for the callback
//      cs.subscribe('run', function () { this.innerHTML = 'Triggered'}, document.body);
//
//      // Control the order of operations by setting the `priority`
//      cs.subscribe('run', cb, this, {priority: 9});
//
//      // Only execute the callback, `cb`, if the value of the `price` variable is 50
//      cs.subscribe('run/variables/price', cb, this, {priority: 30, value: 50});
//
//      // Only execute the callback, `cb`, if the value of the `price` variable is greater than 50
//      subscribe('run/variables/price', cb, this, {priority: 30, value: '>50'});
//
//      // Only execute the callback, `cb`, if the value of the `price` variable is even
//      subscribe('run/variables/price', cb, this, {priority: 30, value(val) {return val % 2 === 0}});
