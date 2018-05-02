/**
 * @typedef Publishable
 * @property {string} name
 * @property {*} value
 */

/**
  * @typedef Subscription
  * @prop {string} id
  * @prop {Function} callback
  * @prop {string[]} topics
  */

/**
 * @param {object} obj
 * @return {Publishable[]}
 */
export function objectToPublishable(obj) {
    var mapped = Object.keys(obj || {}).map(function (t) {
        return { name: t, value: obj[t] };
    });
    return mapped;
}

/**
 * Converts arrays of the form [{ name: '', value: ''}] to {[name]: value}
 * @param {Publishable[]} arr
 * @param {object} [mergeWith]
 * @returns {object}
 */
export function publishableToObject(arr, mergeWith) {
    var result = (arr || []).reduce(function (accum, topic) {
        accum[topic.name] = topic.value;
        return accum;
    }, $.extend(true, {}, mergeWith));
    return result;
}

/**
 * @typedef NormalizedParam
 * @property {Publishable[]} params
 * @property {Object} options
 */

/**
 *
 * @param {String|Object|array} topic 
 * @param {*} publishValue 
 * @param {Object} [options]
 * @return {NormalizedParam}
 */
export function normalizeParamOptions(topic, publishValue, options) {
    if (!topic) {
        return { params: [], options: {} };
    }
    if ($.isPlainObject(topic)) {
        return { params: objectToPublishable(topic), options: publishValue };
    }
    if (Array.isArray(topic)) {
        return { params: topic, options: publishValue };
    }
    return { params: [{ name: topic, value: publishValue }], options: options };
}

let i = 0;
function uniqueId(prefix) {
    i++;
    return `${prefix || ''}${i}`;
}

function intersection(a, b) {
    var t;
    if (b.length > a.length) {
        t = b;
        b = a;
        a = t; 
    }// indexOf to loop over shorter
    return a.filter(function (e) {
        return b.indexOf(e) > -1;
    });
}

/**
 * 
 * @param {String[]|String} topics 
 * @param {Function} callback 
 * @param {Object} options
 * @return {Subscription}
 */
function makeSubs(topics, callback, options) {
    var id = uniqueId('subs-');
    var defaults = {
        batch: false,
    };
    var opts = $.extend({}, defaults, options);
    if (!callback) {
        throw new Error('subscribe callback should be a function');
    }
    return $.extend(true, {
        id: id,
        topics: [].concat(topics).map((t)=> t.toLowerCase()),
        callback: callback,
    }, opts);
}

/**
* @param {Publishable[]} topics
* @param {Subscription} subscription 
*/
function checkAndNotifyBatch(topics, subscription) {
    var merged = $.extend(true, {}, publishableToObject(topics));
    var keys = Object.keys(merged).map((k)=> k.toLowerCase());
    var matchingTopics = intersection(keys, subscription.topics);
    if (matchingTopics.length > 0) {
        var toSend = subscription.topics.reduce(function (accum, topic) {
            accum[topic] = merged[topic];
            return accum;
        }, {});

        if (matchingTopics.length === subscription.topics.length) {
            subscription.callback(toSend);
        }
    }
}


/**
 * @param {Publishable[]} topics
 * @param {Subscription} subscription 
 */
function checkAndNotify(topics, subscription) {
    topics.forEach(function (topic) {
        if (subscription.topics.indexOf(topic.name.toLowerCase()) !== -1 || subscription.topics.indexOf('*') !== -1) { 
            subscription.callback(topic.value);
        }
    });
}


class PubSub {
    constructor(options) {
        this.subscriptions = [];
    }

    /**
     * @param {String | Publishable } topic
     * @param {any} [value] item to publish
     * @param {Object} [options]
     * @return {Promise}
     */
    publish(topic, value, options) {
        var normalized = normalizeParamOptions(topic, value, options);
        // console.log('notify', normalized.params);
        return this.subscriptions.forEach(function (subs) {
            var fn = subs.batch ? checkAndNotifyBatch : checkAndNotify;
            fn(normalized.params, subs);
        });
    }

    /**
     * @param {String[] | String} topics
     * @param {Function} cb
     * @param {Object} [options]
     * @return {String}
     */
    subscribe(topics, cb, options) {
        var subs = makeSubs(topics, cb, options);
        this.subscriptions = this.subscriptions.concat(subs);
        return subs.id;
    }
        

    /**
     * @param {String} token
     */
    unsubscribe(token) {
        var olderLength = this.subscriptions.length;
        if (!olderLength) {
            throw new Error('No subscriptions found to unsubscribe from');
        }
    
        var remaining = this.subscriptions.filter(function (subs) {
            return subs.id !== token;
        });
        if (remaining.length === olderLength) {
            throw new Error('No subscription found for token ' + token);
        }
        this.subscriptions = remaining;
    }
    unsubscribeAll() {
        this.subscriptions = [];
    }
}

export default PubSub;

