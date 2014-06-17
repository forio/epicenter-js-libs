/**
 * @class Cookie Persistence Service
 *
 * @example
 *      var people = require('data-service')({root: 'people'});
        people
            .query({firstName: 'john'})
            .save({lastName: 'smith'})
            .done(function(data) {
                console.log('Queried and saved!')
            });

 */

(function() {
var root = this;
var F = root.F;
var $, ConfigService, qutil, urlService, httpTransport;
if (typeof require !== 'undefined') {
    $ = require('jquery');
    configService = require('util/configuration-service');
    qutil = require('util/query-util');
} else {
    $ = jQuery;
    ConfigService = F.service.Config;
    qutil = F.util.query;
    httpTransport = F.transport.HTTP;
}

var CookieService = function (config) {

    var defaults = {
        /**
         * Name of collection
         * @type {String}
         */
        root: '/',

        /**
         * For operations which require authentication, pass in token
         * @see  Auth-service for getting tokens
         * @type {String}
         */
        token: '',
        apiKey: '',
        domain: 'forio.com'
    };
    var serviceOptions = $.extend({}, defaults, config);


    var success = function($promise, callOptions /* others */) {
        var argsArray = [].slice.call(arguments);
        var successArgs = argsArray.slice(2);

        $promise.resolve.apply(this, successArgs);
        if (callOptions && callOptions.success) {
            callOptions.success.apply(this, successArgs);
        }
    };

    var publicAPI = {

        /**
         * Query collection; uses MongoDB syntax
         * @see  <TBD: Data API URL>
         *
         * @param {String} qs Query Filter
         * @param {String} limiters @see <TBD: url for limits, paging etc>
         *
         * @example
         *     cs.query(
         *      {name: 'John', className: 'CSC101'},
         *      {limit: 10}
         *     )
         */
        query: function (qs, limiters) {

        },

        /**
         * Save cookie value
         * @param  {String|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @param  {Object} value (Optional)
         *
         * @example
         *     cs.save('person', {firstName: 'john', lastName: 'smith'});
         *     cs.save({name:'smith', age:'32'});
         */
        save: function (key, value, options) {
            var $d = $.Deferred();

            var domain = serviceOptions.domain;
            var path = serviceOptions.root;

            document.cookie = encodeURIComponent(key) + '=' +
                                encodeURIComponent(value) +
                                (domain ? '; domain=' + domain : '') +
                                (path ? '; path=' + path : '');

            success.call(this, $d, options, value);
            return $d.promise();
        },

        /**
         * Load cookie value
         * @param  {String|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @param  {Object} value (Optional)
         *
         * @example
         *     cs.save('person', {firstName: 'john', lastName: 'smith'});
         *     cs.save({name:'smith', age:'32'});
         */
        load: function (key, options) {
            var $d = $.Deferred();

            var cookieReg = new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$');
            var val = document.cookie.replace(cookieReg, '$1');
            val = decodeURIComponent(val) || null;

            success.call(this, $d, options, val);
            return $d.promise();
        },

        /**
         * Removes key from collection
         * @param {String} key key to remove
         *
         * @example
         *     cs.remove('person');
         */
        remove: function (key, options) {
            var $d = $.Deferred();

            var domain = serviceOptions.domain;
            var path = serviceOptions.root;

            document.cookie = encodeURIComponent(key) +
                            '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
                            ( domain ? '; domain=' + domain : '') +
                            ( path ? '; path=' + path : '');

            success.call(this, $d, options, key);
            return $d.promise();
        },

        /**
         * Removes collection being referenced
         * @return null
         */
        destroy: function (options) {
            var $d = $.Deferred();

            var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/);
            var promises = [];

            for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
                var cookieKey = decodeURIComponent(aKeys[nIdx]);
                var $deletePromise = this.remove(cookieKey);
                promises.push($deletePromise);
            }

            var me = this;
            $.when.apply(null, promises).done(function() {
                success.apply(me, [$d, options].concat([].slice.call(arguments)));
            });

            return $d.promise();
        }
    };

    return publicAPI;
};


if (typeof exports !== 'undefined') {
    module.exports = CookieService;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.service) { root.F.service = {};}
    root.F.service.Cookie = CookieService;
}

}).call(this);

