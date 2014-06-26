/**
 *
 * ##Authentication API Service
 *
 * The Authentication API Service provides methods for logging in and creating user access tokens.
 * User access tokens are required for each call to Epicenter. (See [Creating access tokens](../../project_access/) for more information.)
 *
 * @example
 *      var auth = require('authentication-service')();
 *      auth.login()
 */

(function() {
var root = this;
var F = root.F;
var $, ConfigService, qutil, TransportFactory, StorageFactory;
if (typeof require !== 'undefined') {
    $ = require('jquery');
    configService = require('util/configuration-service');
    qutil = require('util/query-util');
    StorageFactory = require('store/store-factory');
} else {
    $ = jQuery;
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
         * User name to use for loggin in
         * @type {String}
         */
        userName: '',

        /**
         * Password for specified user name
         * @type {String}
         */
        password: ''

    };
    var serviceOptions = $.extend({}, defaults, config);

    var urlConfig = ConfigService(serviceOptions).get('server');
    var http = new TransportFactory({
        url: urlConfig.getAPIPath('authentication')
    });

    var EPI_COOKIE_KEY = 'epicenter.token';
    var store = new StorageFactory(serviceOptions.store);
    var token = store.get(EPI_COOKIE_KEY) || '';

    var publicAPI = {
        store: store,

        /**
         * Logs user in to specified account. If no username or password was provided in the intial configuration options, they're mandatory here
         *
         * **Example**
         *
         *      auth.login({userName: 'jsmith@acmesimulations.com', password: 'passw0rd'});
         *
         * **Parameters**
         * @param {Object} `options` (Optional) Overrides for configuration options
         */
        login: function (options) {
            var httpOptions = $.extend(true, {success: $.noop}, serviceOptions, options);
            if (!httpOptions.userName || !httpOptions.password) {
                throw new Error('No username or password specified.');
            }

            var oldSuccessFn = httpOptions.success;
            httpOptions.success = function(response) {
                serviceOptions.password = httpOptions.password;
                serviceOptions.userName = httpOptions.userName;

                token = response.access_token;
                store.set(EPI_COOKIE_KEY, token);

                oldSuccessFn.apply(this, arguments);
            };

            return http.post({userName: httpOptions.userName, password: httpOptions.password}, httpOptions);
        },

        /**
         * Logs user out from specified accounts.
         *
         * **Example**
         *
         *      auth.logout();
         *
         * **Parameters**
         * @param {String} `username` (Optional) If provided only logs specific username out, otherwise logs out all usernames associated with session
         * @param {Object} `options` (Optional) Overrides for configuration options
         */
        logout: function (username, options) {
            return store.remove(EPI_COOKIE_KEY, options);
        },

        /**
         * Returns existing user access token if already logged in, or creates a new one otherwise.
         *
         * **Example**
         *
         *      var currToken = auth.getToken();
         *
         * **Parameters**
         * @param {Object} `options` (Optional) Overrides for configuration options
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
