'use strict';

/**
 * ## Channel Service
 *
 * The Epicenter platform provides a push channel, which allows you to publish and subscribe to messages within a [project](../../../glossary/#projects), [group](../../../glossary/#groups), or [multiplayer world](../../../glossary/#world). There are two main use cases for the channel: event notifications and chat messages.
 *
 * The Channel Service is a building block for this functionality. It creates a publish-subscribe object, allowing you to publish messages, subscribe to messages, or unsubscribe from messages for a given 'topic' on a `$.cometd` transport instance.
 *
 * Typically, you use the [Epicenter Channel Manager](../epicenter-channel-manager/) to create or retrieve channels, then use the Channel Service `subscribe()` and `publish()` methods to listen to or update data. (For additional background on Epicenter's push channel, see the introductory notes on the [Push Channel API](../../../rest_apis/multiplayer/channel/) page.)
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Channel Service. (See [Including Epicenter.js](../../#include).)
 *
 * To use the Channel Service, instantiate it, then make calls to any of the methods you need.
 *
 *        var cs = new F.service.Channel();
 *        cs.publish('run/variables', {price: 50});
 *
 * The parameters for instantiating a Channel Service include:
 *
 * * `options` The options object to configure the Channel Service.
 * * `options.base` The base topic. This is added as a prefix to all further topics you publish or subscribe to while working with this Channel Service.
 * * `options.topicResolver` A function that processes all 'topics' passed into the `publish` and `subscribe` methods. This is useful if you want to implement your own serialize functions for converting custom objects to topic names. Returns a String. By default, it just echoes the topic.
 * * `options.transport` The instance of `$.cometd` to hook onto. See http://docs.cometd.org/reference/javascript.html for additional background on cometd.
 */
var Channel = function (options) {
    var defaults = {

        /**
         * The base topic. This is added as a prefix to all further topics you publish or subscribe to while working with this Channel Service.
         */
        base: '',

        /**
         * A function that processes all 'topics' passed into the `publish` and `subscribe` methods. This is useful if you want to implement your own serialize functions for converting custom objects to topic names. By default, it just echoes the topic.
         *
         * **Parameters**
         *
         * * `topic` Topic to parse.
         *
         * **Return Value**
         *
         * * *String*: This function should return a string topic.
         */
        topicResolver: function (topic) {
            return topic;
        },

        /**
         * The instance of `$.cometd` to hook onto.
         */
        transport: null
    };
    this.channelOptions = $.extend(true, {}, defaults, options);
};

var makeName = function (channelName, topic) {
    //Replace trailing/double slashes
    var newName = (channelName ? (channelName + '/' + topic) : topic).replace(/\/\//g, '/').replace(/\/$/,'');
    return newName;
};


Channel.prototype = $.extend(Channel.prototype, {

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
     //      subscribe('run/variables/price', cb, this, {priority: 30, value: function (val) {return val % 2 === 0}});


    /**
     * Subscribe to changes on a topic.
     *
     *  **Examples**
     *
     *      // Subscribe to changes on a top-level 'run' topic
     *      cs.subscribe('run', cb);
     *
     *      // Subscribe to changes on children of the 'run' topic. Note this will also be triggered for changes to run.x.y.z.
     *      cs.subscribe('run/*');
     *
     *      // Subscribe to changes on both the top-level 'run' topic and its children
     *      cs.subscribe(['run', 'run/*']);
     *
     *      // Subscribe to changes on a particular variable
     *      subscribe('run/variables/price', cb);
     *
     *
     * **Return Value**
     *
     * * *String* Returns a token you can later use to unsubscribe.
     *
     * **Parameters**
     * @param  {String|Array}   `topic`    List of topics to listen for changes on.
     * @param  {Function} `callback` Callback function to execute. Callback is called with signature `(evt, payload, metadata)`.
     * @param  {Object}   `context`  Context in which the `callback` is executed.
     * @param  {Object}   `options`  (Optional) Overrides for configuration options.
     * @param  {Number}   `options.priority`  Used to control order of operations. Defaults to 0. Can be any +ve or -ve number.
     * @param  {String|Number|Function}   `options.value` The `callback` is only triggered if this condition matches. See examples for details.
     *
     */
    subscribe: function (topic, callback, context, options) {

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
    },

    /**
     * Publish data to a topic.
     *
     * **Examples**
     *
     *      // Send data to all subscribers of the 'run' topic
     *      cs.publish('run', {completed: false});
     *
     *      // Send data to all subscribers of the 'run/variables' topic
     *      cs.publish('run/variables', {price: 50});
     *
     * **Parameters**
     *
     * @param  {String} `topic` Topic to publish to.
     * @param  {*} `payload`  Data to publish to topic.
     *
     */
    publish: function (topic, data) {
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
    },

    /**
     * Unsubscribe from changes to a topic.
     *
     * **Example**
     *
     *      cs.unsubscribe('sampleToken');
     *
     * **Parameters**
     * @param  {String} `token` The token for topic is returned when you initially subscribe. Pass it here to unsubscribe from that topic.
     */
    unsubscribe: function (token) {
        this.channelOptions.transport.unsubscribe(token);
        return token;
    }

});

module.exports = Channel;
