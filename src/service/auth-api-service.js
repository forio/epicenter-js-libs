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
var $, ConfigService, qutil, httpTransport, PersistenceService;
if (typeof require !== 'undefined') {
    $ = require('jquery');
    configService = require('util/configuration-service');
    qutil = require('util/query-util');
    PersistenceService = require('persistence/persistence-service-factory');
} else {
    $ = jQuery;
    ConfigService = F.service.Config;
    qutil = F.util.query;
    httpTransport = F.transport.HTTP;
    PersistenceService= F.service.Persistence;
}


var AuthService = function (config) {
    var defaults = {
        /**
         * Where to store user access tokens for temporary access. Defaults to `cookie`.
         * @type {String}
         */
        store: 'session'
    };

    var serviceOptions = $.extend({}, defaults, config);

    var urlConfig = ConfigService(serviceOptions).get('server');
    var http = httpTransport({
        url: urlConfig.getAPIPath('authentication')
    });

    var store = new PersistenceService(serviceOptions.store);
    var EPI_COOKIE_KEY = 'epicenter.token';

    var token;
    var currentUsername;
    var currentPassword;

    //See if we already have a token stashed
    store.load(EPI_COOKIE_KEY).then(function(savedToken) {
        if (savedToken) {
            token = savedToken;
        }
    });

    var publicAPI = {
        store: store,

        /**
         * Logs user in to specified account.
         *
         * **Example**
         *
         *      auth.login('jsmith@acmesimulations.com', 'passw0rd');
         *
         * **Parameters**
         * @param {String} `username` Email (for Epicenter authors and team members) or Username (for end users) of user
         * @param {String} `password` Password
         * @param {Object} `options` (Optional) Overrides for configuration options
         */
        login: function (username, password, options) {
            var httpOptions = $.extend(true, {success: $.noop}, serviceOptions, options);

            httpOptions.success = _.wrap(httpOptions.success, function(fn, data) {
                currentPassword = password;
                currentUsername = username;

                token = data.access_token;
                store.save(EPI_COOKIE_KEY, token);
                fn.call(this, data);
            });

            return http.post({userName: username, password: password}, httpOptions);
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
         *      var currToken = auth.getToken('jsmith@acmesimulations.com');
         *
         * **Parameters**
         * @param {String} `username` (Optional) Username of user to get the token for; if currently logged in as a single user, username is optional
         * @param {Object} `options` (Optional) Overrides for configuration options
         */
        getToken: function (options) {
            var httpOptions = $.extend(true, {success: $.noop}, serviceOptions, options);

            var $d = $.Deferred();
            if (token) {
                $d.resolve(token);
            }
            else {
                this.login(currentUsername, currentPassword, httpOptions).then(function() {
                    $.resolve(token);
                });
            }
            return $d.promise();
        },

        /**
         * TODO
         * Returns user information.
         * @see <TBD> for return object syntax
         *
         * **Parameters**
         * @param {String} `inputToken` User access token (use `login()` then `getToken()` to retrieve)
         * @param {Object} `options` (Optional) Overrides for configuration options
         */
        getUserInfo: function (inputToken, options) {
            var toDecode = (inputToken) ? inputToken : token;
            var $d = $.Deferred();
            $d.resolve(root.atob(toDecode));
            return $d.promise();
        }

        // //TBD, need to be talked through
        // resetPassword: function (options) {

        // }
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
