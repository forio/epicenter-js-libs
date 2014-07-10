/**
 *
 * ##Authentication API Service
 *
 * The Authentication API Service provides methods for logging in and creating user access tokens.
 * User access tokens are required for each call to Epicenter. (See [Creating access tokens](../../../project_access/) for more information.)
 *
 *      var auth = new F.service.Auth();
 *      auth.login({userName: 'jsmith@acmesimulations.com',
 *                  password: 'passw0rd'});
 *      auth.logout();
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
        StorageFactory = require('store/store-factory');
    } else {
        $ = root.jQuery;
        ConfigService = F.service.Config;
        qutil = F.util.query;
        TransportFactory = F.factory.Transport;
        StorageFactory= F.factory.Store;
    }


    var AuthService = function (config) {

        var defaults = {
            /**
             * Where to store user access tokens for temporary access. Defaults to storing in a cookie in the browser.
             * @type {String}
             */
            store: {synchronous: true},

            /**
             * Email or username to use for logging in. Defaults to empty string.
             * @type {String}
             */
            userName: '',

            /**
             * Password for specified username. Defaults to empty string.
             * @type {String}
             */
            password: '',

            /**
             * Account to log-in into. Required to log-in as an end-user. Defaults to picking it up from the path.
             * @type {String}
             */
            account: ''

        };
        var serviceOptions = $.extend({}, defaults, config);

        var urlConfig = new ConfigService(serviceOptions).get('server');
        if (!serviceOptions.account) {
            serviceOptions.account = urlConfig.accountPath;
        }

        var http = new TransportFactory({
            url: urlConfig.getAPIPath('authentication')
        });

        var EPI_COOKIE_KEY = 'epicenter.token';
        var store = new StorageFactory(serviceOptions.store);
        var token = store.get(EPI_COOKIE_KEY) || '';

        var publicAPI = {
            store: store,

            /**
             * Logs user in. If no username or password was provided in the initial configuration options, they are required here.
             *
             * **Example**
             *
             *      auth.login({userName: 'jsmith@acmesimulations.com',
             *                  password: 'passw0rd',
             *                  account: 'acme'});
             *
             * **Parameters**
             * @param {Object} `options` (Optional) Overrides for configuration options.
             */
            login: function (options) {
                var httpOptions = $.extend(true, {success: $.noop}, serviceOptions, options);
                if (!httpOptions.userName || !httpOptions.password) {
                    throw new Error('No username or password specified.');
                }

                var postParams = {
                    userName: httpOptions.userName,
                    password: httpOptions.password,
                };
                if (httpOptions.account) {
                    //pass in null for account under options if you don't want it to be sent
                    postParams.account = httpOptions.account;
                }

                var oldSuccessFn = httpOptions.success;
                httpOptions.success = function(response) {
                    serviceOptions.password = httpOptions.password;
                    serviceOptions.userName = httpOptions.userName;

                    /*jshint camelcase: false */
                    token = response.access_token;
                    store.set(EPI_COOKIE_KEY, token);

                    oldSuccessFn.apply(this, arguments);
                };

                return http.post(postParams, httpOptions);
            },

            /**
             * Logs user out from specified accounts.
             *
             * **Example**
             *
             *      auth.logout();
             *
             * **Parameters**
             * @param {Object} `options` (Optional) Overrides for configuration options.
             */
            logout: function (options) {
                return store.remove(EPI_COOKIE_KEY, options);
            },

            /**
             * Returns existing user access token if already logged in, or creates a new one otherwise. (See [more background on access tokens](../../../project_access/)).
             *
             * **Example**
             *
             *      auth.getToken().then(function(token){ console.log('my token is', token); });
             *
             * **Parameters**
             * @param {Object} `options` (Optional) Overrides for configuration options.
             */
            getToken: function (options) {
                var httpOptions = $.extend(true, {success: $.noop}, serviceOptions, options);

                var $d = $.Deferred();
                if (token) {
                    $d.resolve(token);
                }
                else {
                    this.login(httpOptions).then($d.resolve);
                }
                return $d.promise();
            }
        };

        $.extend(this, publicAPI);
    };

    if (typeof exports !== 'undefined') {
        module.exports = AuthService;
    }
    else {
        if (!root.F) { root.F = {};}
        if (!root.F.service) { root.F.service = {};}
        root.F.service.Auth = AuthService;
    }

}).call(this);
