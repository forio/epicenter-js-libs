/**
 * Authentication API Service
 *
 * @example
 *      var auth = require('autentication-service')();
        auth.login();

 */

(function() {
var root = this;
var F = root.F;
var $, ConfigService, qutil, urlService, httpTransport, PersistenceService;
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
         * Where to store tokens for temporary access.
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
         * @param {String} username LoginID of user
         * @param {String} password Password
         * @param {object} options Overrides for configuration options
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
         * Logs user out from specified accounts
         * @param  {String} username (Optional) If provided only logs specific username out, otherwise logs out all usernames associated with session
         * @param {object} options Overrides for configuration options
         */
        logout: function (username, options) {
            return store.remove(EPI_COOKIE_KEY, options);
        },

        /**
         * Returns existing token if already logged in, or creates a new one otherwise
         * @param {object} options Overrides for configuration options
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
         * Returns user information of
         * @see <TBD> for return object syntax
         * @param {String} token (Optional) Token obtained as part of logging in
         * @param {object} options Overrides for configuration options
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
