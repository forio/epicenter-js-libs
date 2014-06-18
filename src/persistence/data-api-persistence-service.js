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
    var http = httpTransport({
        url: getURL
    });

    var publicAPI = {

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
         * Save value to key
         * @param  {String|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @param  {Object} value (Optional)
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
         * @param  {Object} value (Optional)
         *
         * @example
         *     ds.save('person', {firstName: 'john', lastName: 'smith'});
         *     ds.save({name:'smith', age:'32'});
         */
        load: function (key, outputModifiers, options) {
           var httpOptions = $.extend(true, {}, serviceOptions, options, {url: getURL(key)});
           return http.get(outputModifiers, httpOptions);
        },

        /**
         * Removes key from collection
         * @param {String} key key to remove
         *
         * @example
         *     ds.remove('person');
         */
        remove: function (keys, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options);
            return http.delete({id: keys}, httpOptions);
        },

        /**
         * Removes collection being referenced
         * @return null
         */
        destroy: function (options) {
            return this.remove('', options);
        }
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

