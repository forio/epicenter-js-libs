function pick(obj, keys) {
    return Object.keys(obj).reduce(function (accum, k) {
        if (keys.indexOf(k) !== -1) {
            accum[k] = obj[k];
        }
        return accum;
    }, {});
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

module.exports = function createChannel(options) {
    var i = 0;
    var subsMap = {};

    function notifySubs(subs, data) {
        var knownKeys = Object.keys(data);
        var isWildCardMatch = subs.topics.indexOf('') !== -1;
        if (isWildCardMatch) {
            subs.callback(data);
        }
        var isTopicsMatch = intersection(knownKeys, subs.topics).length === subs.topics.length;
        if (isTopicsMatch) {
            var dataToSend = pick(data, subs.topics);
            subs.callback(dataToSend);
        }
    }
    return {
        publish: function (data) {
            Object.keys(subsMap).forEach(function (id) {
                var subs = subsMap[id];
                notifySubs(subs, data);
            });
            return $.Deferred().resolve(data).promise();
        },
        subscribe: function (topic, callback) {
            var subsid = 'subsid' + (i++);
            var subs = {
                topics: [].concat(topic),
                callback: callback,
            };
            subsMap[subsid] = subs;
            return subsid;
        },
        unsubscribe: function (subsid) {
            delete subsMap[subsid];
        }
    };
};