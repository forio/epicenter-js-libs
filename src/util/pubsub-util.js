'use strict';

module.exports = (function () {

    var publicAPI = {
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
        subscribe: function (topic, callback, context, options) {

        },

        /**
         * Publish data to a topic
         * @param  {String} topic Topic to publish to
         * @param  {*} payload  Data to publish to topic
         *
         * **Examples**
         * publish('run', {completed: false}); - send payload to all subscribers
         * publish('run/variables', {price: 50});
         */
        publish: function (topic, payload) {

        },

        /**
         * Unsubscribe from changes
         * @param  {String} token
         */
        unsubscribe: function (token) {

        },

        /**
         * @param  {String} topic (optional) - if topic is provided, removes all event listeners bound to the topic. If not provided, remove all topics
         */
        unsubscribeAll: function (topic) {

        }
    };

    return publicAPI;
}());

