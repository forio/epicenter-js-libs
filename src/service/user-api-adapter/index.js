
/**
* ## User API Adapter
*
* The User API Adapter allows you to retrieve details about end users in your team (account). It is based on the querying capabilities of the underlying RESTful [User API](../../../rest_apis/user_management/user/).
*
* To use the User API Adapter, instantiate it and then call its methods.
*
*       var ua = new F.service.User({
*           account: 'acme-simulations',
*           token: 'user-or-project-access-token'
*       });
*       ua.getById('42836d4b-5b61-4fe4-80eb-3136e956ee5c');
*       ua.get({ userName: 'jsmith' });
*       ua.get({ id: ['42836d4b-5b61-4fe4-80eb-3136e956ee5c',
*                   '4ea75631-4c8d-4872-9d80-b4600146478e'] });
*
* The constructor takes an optional `options` parameter in which you can specify the `account` and `token` if they are not already available in the current context.
*/

import { getDefaultOptions, getURLConfig } from '../service-utils';
import TransportFactory from 'transport/http-transport-factory';
import { toQueryFormat } from 'util/query-util';

export default function UserAPIAdapter(config) {
    const API_ENDPOINT = 'user';

    var defaults = {

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string.
         * @type {String}
         */
        account: undefined,

        /**
         * The access token to use when searching for end users. (See [more background on access tokens](../../../project_access/)).
         * @type {String}
         */
        token: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    const serviceOptions = getDefaultOptions(defaults, config, { apiEndpoint: API_ENDPOINT });
    const urlConfig = getURLConfig(serviceOptions);
    const http = new TransportFactory(serviceOptions.transport);
    const publicAPI = {

        /**
        * Retrieve details about particular end users in your team, based on user name or user id.
        *
        * **Example**
        *
        *       var ua = new F.service.User({
        *           account: 'acme-simulations',
        *           token: 'user-or-project-access-token'
        *       });
        *       ua.get({ userName: 'jsmith' });
        *       ua.get({ id: ['42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                   '4ea75631-4c8d-4872-9d80-b4600146478e'] });
        *
        * **Parameters**
        * @param {object} filter Object with field `userName` and value of the username. Alternatively, object with field `id` and value of an array of user ids.
        * @param {object} [options] Overrides for configuration options.
        * @return {Promise}
        */
        get: function (filter, options) {
            filter = filter || {};

            const httpOptions = $.extend(true, {}, serviceOptions, options);
            function toIdFilters(id) {
                if (!id) return '';
                
                const qs = Array.isArray(id) ? id : [id];
                return 'id=' + qs.join('&id=');
            }

            const query = filter.userName ? { q: filter.userName } : {}; // API only supports filtering by username
            const params = [
                'account=' + httpOptions.account,
                toIdFilters(filter.id),
                toQueryFormat(query)
            ].join('&');

            // special case for queries with large number of ids
            // make it as a post with GET semantics
            var threshold = 30;
            if (filter.id && Array.isArray(filter.id) && filter.id.length >= threshold) {
                httpOptions.url = urlConfig.getAPIPath('user') + '?_method=GET';
                return http.post({ id: filter.id }, httpOptions);
            } else {
                return http.get(params, httpOptions);
            }
        },

        /**
        * Retrieve details about a single end user in your team, based on user id.
        *
        * **Example**
        *
        *       var ua = new F.service.User({
        *           account: 'acme-simulations',
        *           token: 'user-or-project-access-token'
        *       });
        *       ua.getById('42836d4b-5b61-4fe4-80eb-3136e956ee5c');
        *
        * **Parameters**
        * @param {string} userId The user id for the end user in your team.
        * @param {object} [options] Overrides for configuration options.
        * @return {Promise}
        */
        getById: function (userId, options) {
            return publicAPI.get({ id: userId }, options);
        },


        /**
        * Upload list of users to current account
        * @param {object[]} userList Array of user objects to 
        * @param {object} [options] Overrides for configuration options.
        * @returns {JQuery.Promise}
        */
        uploadUsers: function (userList, options) {
            if (!userList || !Array.isArray(userList)) {
                return $.Deferred().reject({
                    type: 'INVALID_USERS',
                    payload: userList
                }).promise();
            }

            const httpOptions = $.extend(true, {}, serviceOptions, options);
            const requiredFields = ['userName', 'password', 'firstName', 'lastName'];

            const sortedUsers = userList.reduce((accum, user)=> {
                const missingRequiredFields = requiredFields.filter((field)=> user[field] === undefined);
                const account = user.account || httpOptions.account;
                if (!account) missingRequiredFields.push(account);
                if (missingRequiredFields.length) {
                    accum.invalid.push({ user: user, missingFields: missingRequiredFields });
                }
                if (!user.account) {
                    user.account = httpOptions.account;
                }
                accum.valid.push(user);
                return accum;
            }, { valid: [], invalid: [] });

            if (sortedUsers.invalid.length) {
                return $.Deferred().reject({
                    type: 'INVALID_USERS',
                    payload: sortedUsers.invalid
                }).promise();
            }
            return http.post(sortedUsers.valid, httpOptions);
        }
    };

    $.extend(this, publicAPI);
}


