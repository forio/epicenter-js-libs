/**
 * @class Cookie Storage Service
 *
 * @example
 *      var people = require('cookie-store')({root: 'people'});
        people
            .save({lastName: 'smith'})

 */

(function() {
    'use strict';

    var root = this;
    var F = root.F;
    var $, ConfigService;
    if (typeof require !== 'undefined') {
        $ = require('jquery');
        ConfigService = require('util/configuration-service');
    } else {
        $ = root.jQuery;
        ConfigService = F.service.Config;
    }

    var CookieStore = function (config) {

        var defaults = {
            /**
             * Name of collection
             * @type {String}
             */
            root: '/',

            domain: '.forio.com'
        };
        var serviceOptions = $.extend({}, defaults, config);

        var publicAPI = {
            // * TBD
            //  * Query collection; uses MongoDB syntax
            //  * @see  <TBD: Data API URL>
            //  *
            //  * @param {String} qs Query Filter
            //  * @param {String} limiters @see <TBD: url for limits, paging etc>
            //  *
            //  * @example
            //  *     cs.query(
            //  *      {name: 'John', className: 'CSC101'},
            //  *      {limit: 10}
            //  *     )

            // query: function (qs, limiters) {

            // },

            /**
             * Save cookie value
             * @param  {String|Object} key   If given a key save values under it, if given an object directly, save to top-level api
             * @param  {Object} value (Optional)
             * @param {Object} options Overrides for service options
             *
             * @return {*} The saved value
             *
             * @example
             *     cs.set('person', {firstName: 'john', lastName: 'smith'});
             *     cs.set({name:'smith', age:'32'});
             */
            set: function (key, value, options) {
                var setOptions = $.extend(true, {}, serviceOptions, options);

                var domain = setOptions.domain;
                var path = setOptions.root;

                document.cookie = encodeURIComponent(key) + '=' +
                                    encodeURIComponent(value) +
                                    (domain ? '; domain=' + domain : '') +
                                    (path ? '; path=' + path : '');

                return value;
            },

            /**
             * Load cookie value
             * @param  {String|Object} key   If given a key save values under it, if given an object directly, save to top-level api
             * @return {*} The value stored
             *
             * @example
             *     cs.get('person');
             */
            get: function(key) {
                var cookieReg = new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$');
                var val = document.cookie.replace(cookieReg, '$1');
                val = decodeURIComponent(val) || null;
                return val;
            },

            /**
             * Removes key from collection
             * @param {String} key key to remove
             * @return {String} key The key removed
             *
             * @example
             *     cs.remove('person');
             */
            remove: function (key, options) {
                var remOptions = $.extend(true, {}, serviceOptions, options);

                var domain = remOptions.domain;
                var path = remOptions.root;

                document.cookie = encodeURIComponent(key) +
                                '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
                                ( domain ? '; domain=' + domain : '') +
                                ( path ? '; path=' + path : '');
                return key;
            },

            /**
             * Removes collection being referenced
             * @return {Array} keys All the keys removed
             */
            destroy: function () {
                var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/);
                for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
                    var cookieKey = decodeURIComponent(aKeys[nIdx]);
                    this.remove(cookieKey);
                }
                return aKeys;
            }
        };

        $.extend(this, publicAPI);
    };


    if (typeof exports !== 'undefined') {
        module.exports = CookieStore;
    }
    else {
        if (!root.F) { root.F = {};}
        if (!root.F.store) { root.F.store = {};}
        root.F.store.Cookie = CookieStore;
    }

}).call(this);

