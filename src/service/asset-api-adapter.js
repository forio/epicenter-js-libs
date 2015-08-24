/**
 * ##Asset API Adapter
 *
 *
 * To use the Asset Adapter, instantiate it and then access the methods provided. Instantiating requires the account id (**Team ID** in the Epicenter user interface) and project id (**Project ID**).
 * group name and userId are optional and will use the logged user's group and userId if needed
 *
 *       var aa = new F.service.Asset({
 *          account: 'acme-simulations',
 *          project: 'supply-chain-game',
 *          group: 'team1',
 *          userId: ''
 *       });
 *       aa.create('test.txt', {
            encoding: 'BASE_64',
            data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=',
            contentType: 'text/plain'
 *       }, { scope: 'user' })
 */

'use strict';

var ConfigService = require('./configuration-service');
var StorageFactory = require('../store/store-factory');
// var qutil = require('../util/query-util');
var TransportFactory = require('../transport/http-transport-factory');
var _pick = require('../util/object-util')._pick;
var keyNames = require('../managers/key-names');

var apiEndpoint = 'asset';

module.exports = function (config) {
    var store = new StorageFactory({ synchronous: true });
    var urlConfig = new ConfigService(serviceOptions).get('server');
    var session = JSON.parse(store.get(keyNames.EPI_SESSION_KEY) || '{}');
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: store.get(keyNames.EPI_COOKIE_KEY) || '',
        /**
         * The project id. If left undefined, taken from the URL.
         * @type {String}
         */
        account: urlConfig.accountPath,
        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects). If left undefined, taken from the URL.
         * @type {String}
         */
        project: urlConfig.projectPath,
        /**
         * The group name. Defaults to session's groupName.
         * @type {String}
         */
        group: session.groupName,
        /**
         * The group name. Defaults to session's userId.
         * @type {String}
         */
        userId: session.userId,
        /**
         * The API's scope. Valid values are: user, group and project.
         * @see [Asset API documentation](https://forio.com/epicenter/docs/public/rest_apis/asset/) for the required permissions to write to each scope.
         * @type {String}
         */
        scope: 'user',

        fullUrl: true,

        /**
         * The transport are the options passed to the XHR request.
         * Defaults the contentType to 'multipart/form-data' as is the most common way to upload a file, through a input[type=file].
         * @type {object}
         */
        transport: {
            contentType: 'multipart/form-data'
        }
    };
    var serviceOptions = $.extend(true, {}, defaults, config);
    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });

    if (serviceOptions.token) {
        transportOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }

    var http = new TransportFactory(transportOptions);

    var assetApiParams = ['encoding', 'data', 'contentType'];
    var scopeConfig = {
        user: ['scope', 'account', 'project', 'group', 'userId'],
        group: ['scope', 'account', 'project', 'group'],
        project: ['scope', 'account', 'project'],
    };

    var buildUrl = function (filename, options) {
        var partKeys = scopeConfig[options.scope];
        var parts = $.map(partKeys, function (key) {
            return options[key];
        });
        return urlConfig.getAPIPath(apiEndpoint + '/' + parts.join('/')) + filename;
    };

    var publicAPI = {
        /**
        * Private function, all requests follow a more or less same approach to 
        * use the Asset API and the difference is the HTTP verb
        *
        * @param {string} `method` (Required) HTTP verb
        * @param {string} `filename` (Required) Name of the file to delete/replace/create
        * @param {object} `params` (Optional) Body parameters to send to the Asset API
        * @param {object} `options` (Optional) Options object to override global options.
        *
        */
        _upload: function (method, filename, params, options) {
            var urlOptions = $.extend({}, serviceOptions, options);
            var url = buildUrl(filename, urlOptions);
            var createOptions = $.extend(true, {}, urlOptions, { url: url });
            // whitelist the fields that we actually can send to the api
            if (createOptions.contentType === 'application/json') {
                params = _pick(params, assetApiParams);
            } // else we're sending form data which goes directly in request body
            
            return http[method](params, createOptions);
        },

        /**
        * Creates a file in the Asset API. The server will return an error if the file already exist,
        * check first with a list() or a get().
        *
        * @param {string} `filename` (Required) Name of the file to create
        * @param {object} `params` (Optional) Body parameters to send to the Asset API
        * @param {object} `options` (Optional) Options object to override global options.
        *
        */
        create: function (filename, params, options) {
            return this._upload('post', filename, params, options);
        },

        /**
        * Gets a filename in the Asset API. This will actually fetch the asset content, to get a list
        * of the assets in a scope, use list()
        *
        * @param {string} `filename` (Required) Name of the file to retrieve
        * @param {object} `options` (Optional) Options object to override global options.
        *
        */
        get: function (filename, options) {
            var urlOptions = $.extend({}, serviceOptions, options);
            var url = buildUrl(filename, urlOptions);
            var getOptions = $.extend(true, {}, urlOptions, { url: url });

            return http.get(getOptions);
        },

        /**
        * Gets the list of the assets in a scope.
        *
        * @param {object} `options` (Optional) Options object to override global options. fullUrl determines if the
        * callback the list of asset URL's instead of the filename only.
        *
        */
        list: function (options) {
            var dtd = $.Deferred();
            var me = this;
            var urlOptions = $.extend({}, serviceOptions, options);
            var url = buildUrl('', urlOptions);
            // Remove the trailing / (slash) because that means it would try to 
            // find for the next level of scope: https://forio.com/epicenter/docs/public/rest_apis/asset/#get-list-assets
            url = url.substring(0, url.length - 1);
            var getOptions = $.extend(true, {}, urlOptions, { url: url });
            var fullUrl = options.fullUrl;

            if (!fullUrl) {
                return http.get({}, getOptions);
            }

            http.get({}, getOptions)
                .then(function (files) {
                    var fullPathFiles = $.map(files, function (file) {
                        return buildUrl(file, urlOptions);
                    });
                    dtd.resolve(fullPathFiles, me);
                })
                .fail(dtd.reject);

            return dtd.promise();
        },

        replace: function (filename, params, options) {
            return this._upload('put', filename, params, options);
        },

        delete: function (filename, options) {
            return this._upload('delete', filename, {}, options);
        }
    };
    $.extend(this, publicAPI);
};