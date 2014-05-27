module.exports = function (options) {

    var defaults = {
        store: 'cookie'
        username: ''
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

        }

    }
}
