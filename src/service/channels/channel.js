'use strict';

var Channel = function (options) {
    var defaults = {
        name: '',

        //cometd instance
        transport: null
    };
    this.channelOptions = $.extend(true, {}, defaults, options);
};

var makeName = function (channelName, topic) {
    return (channelName + '/' + topic).replace(/\/\//g,'');
};

/**
 * Subscribe to changes on a topic.
 *
 * @param  {String | Array}   topic    List of topics to listen for changes on
 * @param  {Function} callback Callback to execute. Callback will be called with signature (evt, payload, metadata)
 * @param  {Object}   context  Context in which the callback will be executed
 * @param  {Object}   options  Object with defaults
 * @param  {Number}   options.priority  Can be used to control order of operations, defaults to 0, can be any +ve or -ve number
 * @param  {String|Number|Function}   options.value  Callback will only be triggered if this condition matches. See Examples for details
 * @return {string}            Returns a token you can later use to un-subscribe
 *
 *  **Examples**
 *  subscribe('run', cb) - subscribe to changes on a top-level 'run' topic
 *  subscribe('run/*') - changes on children of the run object. Note this will also be triggered for changes to run.x.y.z
 *  subscribe(['run', 'run/*']) - changes to run and children
 *  subscribe('run/variables/price', cb) - changes to price
 *
 *  subscribe('run', function () { this.innerHTML = 'Triggered'}, document.body); - set the context for the callback
 *  subscribe('run', cb, this, {priority: 9}); - by default priority is 0. Can be used to control order of operations
 *  subscribe('run/variables/price', cb, this, {priority: 30, value: 50}); - only exec callback if value of price is 50
 *  subscribe('run/variables/price', cb, this, {priority: 30, value: '>50'}); - only exec callback if value of price is > 50
 *  subscribe('run/variables/price', cb, this, {priority: 30, value: function (val) {return val % 2 ===0}}); - only exec callback if value of price is even
 *
 */
Channel.prototype.subscribe = function (topic, callback, context, options) {
    var topics = [].concat(topic);
    var me = this;
    var subscriptionIds = [];

    me.channelOptions.transport.batch(function () {
        $.each(topics, function (index, topic) {
            topic = makeName(me.channelOptions.name, topic);
            subscriptionIds.push(me.channelOptions.transport.subscribe(topic, callback));
        });
    });
    return (subscriptionIds[1] ? subscriptionIds : subscriptionIds[0]);
};

/**
 * Publish data to a topic
 * @param  {String} topic Topic to publish to
 * @param  {*} payload  Data to publish to topic
 *
 * **Examples**
 * publish('run', {completed: false}); - send payload to all subscribers
 * publish('run/variables', {price: 50});
 */
Channel.prototype.publish = function (topic, data) {
    topic = makeName(this.channelOptions.name, topic);
    return this.channelOptions.transport.publish(topic, data);
};

/**
 * Unsubscribe from changes
 * @param  {String} token
 */
Channel.prototype.unsubscribe = function (token) {
    this.channelOptions.transport.unsubscribe(token);
    return token;
};

module.exports = Channel;
