/**
 * Authentication API Service
 *
 * @example
 *      var auth = require('autentication-service')();
        auth.login();

 */
module.exports = function (options) {

    var defaults = {
        /**
         * Where to store tokens for temporary access.
         * @type {String}
         */
        store: 'cookie'
    };

    return {

        /**
         * @param {String} username LoginID of user
         * @param {String} password Password
         */
        login: function (username, password) {

        },

        /**
         * Logs user out from specified accounts
         * @param  {String} username (Optional) If provided only logs specific username out, otherwise logs out all usernames associated with session
         */
        logout: function (username) {

        },

        /**
         * Returns existing token if already logged in, or creates a new one otherwise
         * @param  {String} username (Optional) Userid to get the token for; if currently logged in as a single user username is optional
         */
        getToken: function (username) {

        },

        /**
         * Returns user information of
         * @see <TBD> for return object syntax
         * @param  {String} token Token obtained as part of logging in
         */
        getUserInfo: function (token) {

        },

        //TBD, check which server
        resetPassword: function () {

        }

    }
}
