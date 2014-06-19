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

var DataService = function (config) {

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

    var urlConfig = ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) urlConfig.accountPath = serviceOptions.account;
    if (serviceOptions.project) urlConfig.projectPath = serviceOptions.project;

    var getURL = function(key) {
        var url = urlConfig.getAPIPath('data') + serviceOptions.root + '/';
        if (key) url+= key + '/';
        return url;
    };

    var httpOptions = {
        url: getURL
    };
    if (serviceOptions.token) {
        httpOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }
    var http = httpTransport(httpOptions);

    var publicAPI = {

        /**
         * Query collection; uses MongoDB syntax
         * @see  <TBD: Data API URL>
         *
         * @param {String} Object Query Filter
         * @param {String} limiters @see <TBD: url for limits, paging etc>
         * @param {Object} options Overrides for configuration options
         *
         * @example
         *     ds.query(
         *      {name: 'John', className: 'CSC101'},
         *      {limit: 10}
         *     )
         */
        query: function (key, query, limiters, options) {
            var params = $.extend(true, {q: query}, limiters);
            var httpOptions = $.extend(true, {}, serviceOptions, options, {url: getURL(key)});
            return http.get(params, httpOptions);
        },

        /**
         * Save value to key
         * @param  {String|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @param  {Object} value (Optional)
         * @param  {Object} options Overrides for configuration options
         *
         * @example
         *     ds.save('person', {firstName: 'john', lastName: 'smith'});
         *     ds.save({name:'smith', age:'32'});
         */
        save: function (key, value, options) {
            var attrs;
            if (typeof key === 'object') {
              attrs = key;
              options = value;
            } else {
              (attrs = {})[key] = value;
            }

            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.post(attrs, httpOptions);
        },

        /**
         * Load value
         * @param  {String|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @param {Object} filters filters & op modifiers
         * @param {Object} options Overrides for configuration options
         *
         * @example
         *     ds.save('person', {firstName: 'john', lastName: 'smith'});
         *     ds.save({name:'smith', age:'32'});
         */
        load: function (key, filters, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options, {url: getURL(key)});
            return http.get(filters, httpOptions);
        },

        /**
         * Removes key from collection
         * @param {String| Array} key elements or field names to remove
         * @param {Object} options Overrides for configuration options
         *
         * @example
         *     ds.remove('person');
         */
        remove: function (keys, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            var params;
            if ($.isArray(keys)) {
                params = {id: keys};
            }
            else {
                params = '';
                httpOptions.url = getURL(keys);
            }
            return http.delete(params, httpOptions);
        }

    // Epicenter doesn't allow nuking collections
    //     /**
    //      * Removes collection being referenced
    //      * @return null
    //      */
    //     destroy: function (options) {
    //         return this.remove('', options);
    //     }
    };

    return publicAPI;
};


if (typeof exports !== 'undefined') {
    module.exports = DataService;
}
else {
    if (!root.F) { root.F = {};}
    if (!root.F.service) { root.F.service = {};}
    root.F.service.Data = DataService;
}

}).call(this);

