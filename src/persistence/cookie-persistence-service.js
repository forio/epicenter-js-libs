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

var CookieService = function (options) {

    var config = {
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
        apiKey: ''

    };

    return {

        /**
         * Query collection; uses MongoDB syntax
         * @see  <TBD: Data API URL>
         *
         * @param {String} qs Query Filter
         * @param {String} limiters @see <TBD: url for limits, paging etc>
         *
         * @example
         *     ds.query(
         *      {name: 'John', className: 'CSC101'},
         *      {limit: 10}
         *     )
         */
        query: function (qs, limiters) {

        },

        /**
         * Save values to the server
         * @param  {String|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @param  {Object} value (Optional)
         *
         * @example
         *     ds.save('person', {firstName: 'john', lastName: 'smith'});
         *     ds.save({name:'smith', age:'32'});
         */
        save: function (key, value) {

        },

        /**
         * Removes key from collection
         * @param {String} key key to remove
         *
         * @example
         *     ds.remove('person');
         */
        remove: function (key) {

        },

        /**
         * Removes collection being referenced
         * @return null
         */
        destroy: function () {

        }

    };
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

