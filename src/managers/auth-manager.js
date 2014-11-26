/**
* ## Auth Manager
*
*
*/

'use strict';
var AuthAdapter = require('../service/auth-api-service');
var StorageFactory = require('../store/store-factory');

var defaults = {
    
};

var EPI_COOKIE_KEY = 'epicenter.project.token';
var store = new StorageFactory(serviceOptions.store);

var token = store.get(EPI_COOKIE_KEY) || '';

function AuthManager(options) {
    this.options = $.extend(true, {}, defaults, options);
    this.authAdapter = new AuthAdapter(this.options);
}

AuthManager.prototype = {
    login: function (options) {
        var $d = $.Deferred();
        var adapterOptions = $.extend(true, this.options, options);
        var outSuccess = options.success;
        var outError = options.error;

        var handleSuccess = function (response) {
            if (adapterOptions.account) {
                // The token is not needed for system users
                //jshint camelcase: false
                //jscs:disable
                token = response.access_token;
                store.set(EPI_COOKIE_KEY, token);
            }

            outSuccess.apply(this, arguments);
        };

        adapterOptions.success = handleSuccess;

        this.authAdapter.login(adapterOptions).done($d.resolve).fail($d.reject);
        return $d.promise();
    },

    logout: function (options) {
        var $d = $.Deferred();
        var adapterOptions = $.extend(true, this.options, options);

        var removeCookieFn = function (response) {
            store.remove(EPI_COOKIE_KEY, adapterOptions);
        }

        var outSuccess = options.success;
        adapterOptions.success = function (response) {
            removeCookieFn(response);
            outSuccess.apply(this, arguments);
        };

        var outError = options.error;
        // Epicenter returns a bad request when trying to delete a token. It seems like the API call is not implemented yet
        // Once it's implemented this error handler should not be necessary.
        adapterOptions.error = function (response) {
            removeCookieFn(response);
            outSuccess.apply(this, arguments);
        };

        this.authAdapter.logout(adapterOptions).done($d.resolve).fail($d.reject);
        return $d.promise();
    },

    /**
     * Returns existing user access token if already logged in, or creates a new one otherwise. (See [more background on access tokens](../../../project_access/)).
     *
     * **Example**
     *
     *      auth.getToken().then(function (token) { console.log('my token is', token); });
     *
     * **Parameters**
     * @param {Object} `options` (Optional) Overrides for configuration options.
     */
    getToken: function (options) {
        var httpOptions = $.extend(true, { success: $.noop }, serviceOptions, options);

        var $d = $.Deferred();
        if (token) {
            $d.resolve(token);
        } else {
            this.login(httpOptions).then($d.resolve);
        }
        return $d.promise();
    }
};

module.exports = AuthManager;
