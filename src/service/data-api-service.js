/**
 * ##Data API Service
 *
 * The Data API Service allows you to create, access, and manipulate data related to any of your projects. Data are organized in collections. Each collection contains a document; each element of this top-level document is a JSON object. (See additional information on the underlying [Data API](../../data_api/).)
 *
 * All API calls take in an "options" object as the last parameter. The options can be used to extend/override the Data API Service defaults. In particular, the `root` option contains the name of the collection. If you have multiple collections within each of your projects, you can pass the collection name as an option for each call.
 *
 *      var ds = new F.service.Data({root: 'survey-responses'});
 *      ds.saveAs('user1',
 *          {'question1': 2, 'question2': 10,
 *           'question3': false, 'question4': 'sometimes'} );
 *      ds.saveAs('user2',
 *          {'question1': 3, 'question2': 8,
 *           'question3': true, 'question4': 'always'} );
 *      ds.query('',{'question2': {'$gt': 9}});
 *
 */

(function() {
    'use strict';

    var root = this;
    var F = root.F;
    var $, ConfigService, qutil, TransportFactory, StorageFactory;
    if (typeof require !== 'undefined') {
        $ = require('jquery');
        ConfigService = require('util/configuration-service');
        qutil = require('util/query-util');
        StorageFactory= require('store/store-factory');
    } else {
        $ = root.jQuery;
        ConfigService = F.service.Config;
        qutil = F.util.query;
        TransportFactory = F.factory.Transport;
        StorageFactory = F.factory.Store;
    }

    var DataService = function (config) {

        var store = new StorageFactory({synchronous: true});

        var defaults = {
            /**
             * Name of collection. Defaults to `/`, that is, the root level of your project at `forio.com/app/your-account-id/your-project-id/`. Required.
             * @type {String}
             */
            root: '/',

            /**
             * For operations that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../project_access/)).
             * @see [Authentication API Service](./auth-api-service.html) for getting tokens.
             * @type {String}
             */
            token: store.get('epicenter.token') || '',

            apiKey: '',
            domain: 'forio.com'
        };
        var serviceOptions = $.extend({}, defaults, config);

        var urlConfig = new ConfigService(serviceOptions).get('server');
        if (serviceOptions.account) {
            urlConfig.accountPath = serviceOptions.account;
        }
        if (serviceOptions.project) {
            urlConfig.projectPath = serviceOptions.project;
        }

        var getURL = function(key) {
            var url = urlConfig.getAPIPath('data') + serviceOptions.root + '/';
            if (key) {
                url+= key + '/';
            }
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
        var http = new TransportFactory(httpOptions);

        var publicAPI = {

            /**
             * Search for data within a collection.
             *
             * Searching using comparison or logical operators (as opposed to exact matches) requires MongoDB syntax. See the underlying [Data API](../../data_api/#searching) for additional details.
             *
             * **Examples**
             *
             *      // request all data associated with document "user1"
             *      ds.query('user1');
             *
             *      // exact matching:
             *      // request all documents in collection where "question2" is 9
             *      ds.query('', {'question2': 9});
             *
             *      // comparison operators:
             *      // request all documents in collection
             *      // where "question2" is greater than 9
             *      ds.query('', {'question2': {'$gt': 9}});
             *
             *      // logical operators:
             *      // request all documents in collection
             *      // where "question2" is less than 10, and "question3" is false
             *      ds.query('', {'$and': [ {'question2': {'$lt':10}}, {'question3': false}]});
             *
             * **Parameters**
             * @param {String} `key` The name of the document to search. Pass the empty string ('') to search the entire collection.
             * @param {Object} `query` The query object. For exact matching, this object contains the field name and field value to match. For matching based on comparison, this object contains the field name and the comparison expression. For matching based on logical operators, this object contains an expression using MongoDB syntax. See the underlying [Data API](../../data_api/#searching) for additional examples.
             * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
             * @param {Object} `options` (Optional) Overrides for configuration options.
             *
             */
            query: function (key, query, outputModifier, options) {
                var params = $.extend(true, {q: query}, outputModifier);
                var httpOptions = $.extend(true, {}, serviceOptions, options, {url: getURL(key)});
                return http.get(params, httpOptions);
            },

            /**
             * Save data to an anonymous document within the collection.
             *
             * (Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../data_api/) for additional background.)
             *
             * **Example**
             *
             *      ds.save('question1', 'yes');
             *      ds.save({question1:'yes', question2: 32});
             *      ds.save({name:'John', className: 'CS101'}, {root: 'students'});
             *
             * **Parameters**
             *
             * @param {String|Object} `key` If `key` is a string, it is the id of the element to save (create) in this document. If `key` is an object, the object is the data to save (create) in this document. In both cases, the id for the document is generated automatically.
             * @param {Object} `value` (Optional) The data to save. If `key` is a string, this is the value to save. If `key` is an object, the value(s) to save are already part of `key` and this argument is not required.
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
             * Save data to a named document within the collection.
             *
             * (Documents are top-level elements within a collection. Collections must be unique within this account (team or personal account) and project and are set with the `root` field in the `option` parameter. See the underlying [Data API](../../data_api/) for additional background.)
             *
             * **Example**
             *
             *      ds.saveAs('user1',
             *          {'question1': 2, 'question2': 10,
             *           'question3': false, 'question4': 'sometimes'} );
             *      ds.saveAs('student1',
             *          {firstName: 'john', lastName: 'smith'},
             *          {root: 'students'});
             *
             * **Parameters**
             *
             * @param {String} `key` Id of the document.
             * @param {Object} `value` (Optional) The data to save, in key:value pairs.
             * @param {object} `options` (Optional) Overrides for configuration options.
             */
            saveAs: function (key, value, options) {
                var httpOptions = $.extend(true, {}, serviceOptions, options, {url: getURL(key)});
                return http.put(value, httpOptions);
            },

            /**
             * Get data for a specific document or field.
             *
             * **Example**
             *
             *      ds.load('user1');
             *      ds.load('user1/question3');
             *
             * **Parameters**
             * @param  {String|Object} `key` The id of the data to return. Can be the id of a document, or a path to data within that document.
             * @param {Object} `outputModifier` (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
             * @param {Object} `options` Overrides for configuration options.
             */
            load: function (key, outputModifier, options) {
                var httpOptions = $.extend(true, {}, serviceOptions, options, {url: getURL(key)});
                return http.get(outputModifier, httpOptions);
            },

            /**
             * Removes data from collection. Only documents (top-level elements in each collection) can be deleted.
             *
             * **Example**
             *
             *     ds.remove('user1');
             *
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

