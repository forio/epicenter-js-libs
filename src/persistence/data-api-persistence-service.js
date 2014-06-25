/**
 * ##Data API Service
 *
 * The Data API Service allows you to create, access, and manipulate data related to any of your projects. Data are organized in collections. Each collection contains a document; each element of this top-level document is a JSON object. (See additional information on the underlying [Data API](../../data_api/).)
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Data API Service defaults. In particular, the `root` option contains the name of the collection. If you have multiple collections within each of your projects, you can pass the collection name as an option for each call.
 *
 * @example
 *      var people = require('data-service')({root: 'people'});
 *       people
 *          .query({firstName: 'john'})
 *          .save({lastName: 'smith'})
 *          .done(function(data) {
 *             console.log('Queried and saved!')
 *           });
 *
 */

(function() {
var root = this;
var F = root.F;
var $, ConfigService, qutil, httpTransport;
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
         * Name of collection. Defaults to `/`, that is, the root level of your project at `forio.com/app/your-account-id/your-project-id/`.
         * @type {String}
         */
        root: '/',

        /**
         * For operations which require authentication, pass in the user access token. Defaults to empty string.
         * @see [Authentication API Service](./auth-api-service.html) for getting tokens.
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
         * @see the underlying [Data API](../../data_api/#get-reading-data) for additional details.
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
         * Save data to an anonymous set
         *
         * **Example**
         *
         *     ds.save({name:'smith', age:'32'});
         *
         * **Parameters**
         *
         * @param {String|Object} `key` If `key` is a string, it is the id of the element to create or update in this collection. Document ids must be unique within this account (team or personal account) and project. If `key` is an object, the object is the data to save in a new document (top-level element) in this collection, and the id for the element is generated automatically.
         * @param {Object} `value` (Optional) If `key` is a string, this object is the data to save.
         * @param {object} `options` (Optional) Overrides for configuration options.
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
         * Save data to a named set
         *
         * **Example**
         *
         *     ds.saveAs('person', {firstName: 'john', lastName: 'smith'});
         *
         * **Parameters**
         *
         * @param {String} name of the set
         * @param {Object} `value` (Optional) contents of the set
         * @param {object} `options` (Optional) Overrides for configuration options.
         */
        saveAs: function (key, value, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options, {url: getURL(key)});
            return http.put(value, httpOptions);
        },

        /**
         * Load value
         * @param  {String|Object} key   If given a key save values under it, if given an object directly, save to top-level api
         * @param {Object} filters filters & op modifiers
         * @param {Object} options Overrides for configuration options
         *
         * @example
         *     ds.load('person');
         */
        load: function (key, filters, options) {
            var httpOptions = $.extend(true, {}, serviceOptions, options, {url: getURL(key)});
            return http.get(filters, httpOptions);
        },

        /**
         * Removes data from collection. Only documents (top-level elements in each collection) can be deleted.
         *
         * **Example**
         *
         *     ds.remove('person');
         *
         * **Parameters**
         *
         * @param {String} `key` The id of the document to remove from this collection.
         * @param {object} `options` (Optional) Overrides for configuration options.
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

    $.extend(this, publicAPI);
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

