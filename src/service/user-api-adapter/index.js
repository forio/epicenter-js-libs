import { getDefaultOptions, getURLConfig } from '../service-utils';
import TransportFactory from 'transport/http-transport-factory';
import { toQueryFormat } from 'util/query-util';
import bulkFetchRecords from 'util/bulk-fetch-records';

/**
 * @description
 *
 * ## User API Adapter
 *
 * The User API Adapter allows you to retrieve details about end users in your team (account). It is based on the querying capabilities of the underlying RESTful [User API](../../../rest_apis/user_management/user/).
 *
 * Example:
 *```js
 * var ua = new F.service.User({
 *     account: 'acme-simulations',
 *     token: 'user-or-project-access-token'
 * });
 * ua.getById('42836d4b-5b61-4fe4-80eb-3136e956ee5c');
 * ua.get({ userName: 'jsmith' });
 * ua.get({ id: ['42836d4b-5b61-4fe4-80eb-3136e956ee5c',
 *             '4ea75631-4c8d-4872-9d80-b4600146478e'] });
 * ```
 *
 * @param {AccountAPIServiceOptions} config
 */
export default function UserAPIAdapter(config) {
    const API_ENDPOINT = 'user';

    var defaults = {
        account: undefined,
        token: undefined,
        transport: {}
    };

    const serviceOptions = getDefaultOptions(defaults, config, { apiEndpoint: API_ENDPOINT });
    const urlConfig = getURLConfig(serviceOptions);
    const http = new TransportFactory(serviceOptions.transport);
    const publicAPI = {

        /**
        * Retrieve details about particular end users in your team, based on user name or user id.
        *
        * @example
        * var ua = new F.service.User({
        *     account: 'acme-simulations',
        * });
        * ua.get({ userName: 'jsmith' });
        * ua.get({ id: ['42836d4b-5b61-4fe4-80eb-3136e956ee5c',
        *                   '4ea75631-4c8d-4872-9d80-b4600146478e'] });
        *
        *
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

            // API supports filtering by userName, firstName, lastName.
            // userName is converted to "q" for legacy reasons (broader search but unindexed and slower)
            // to filter by userName directly, filter by exactUserName
            const query = filter.userName ? { q: filter.userName } : {};
            if (filter.exactUserName) {
                query.userName = filter.exactUserName;
            }
            if (filter.firstName) {
                query.firstName = filter.firstName;
            }
            if (filter.lastName) {
                query.lastName = filter.lastName;
            }
            const params = [
                'account=' + httpOptions.account,
                toIdFilters(filter.id),
                toQueryFormat(query)
            ].filter((p)=> p).join('&');

            // special case for queries with large number of ids
            // make it as a post with GET semantics
            var threshold = 30;
            if (filter.id && Array.isArray(filter.id) && filter.id.length >= threshold) {
                httpOptions.url = urlConfig.getAPIPath('user') + '?_method=GET';

                const ops = $.extend({}, {
                    recordsPerFetch: 100,
                }, httpOptions);
                return bulkFetchRecords((startRecord, endRecord)=> {
                    const bulkOps = $.extend({}, {
                        headers: { range: 'records ' + startRecord + '-' + endRecord },
                    }, ops);
                    return http.post({ id: filter.id }, bulkOps);
                }, ops);
            } else {
                return http.get(params, httpOptions);
            }
        },

        /**
        * Retrieve details about a single end user in your team, based on user id.
        *
        * @example
        * var ua = new F.service.User({
        *     account: 'acme-simulations',
        * });
        * ua.getById('42836d4b-5b61-4fe4-80eb-3136e956ee5c');
        *
        *
        * @param {string} userId The user id for the end user in your team.
        * @param {object} [options] Overrides for configuration options.
        * @return {Promise}
        */
        getById: function (userId, options) {
            return publicAPI.get({ id: userId }, options);
        },


        /**
        * Upload list of users to current account
        *
        * @example
        * var us = new F.service.User({
        *     account: 'acme-simulations',
        * });
        * us.createUsers([{ userName: 'jsmith@forio.com', firstName: 'John', lastName: 'Smith', password: 'passw0rd' }]);
        *
        * @param {object[]} userList Array of {userName, password, firstName, lastName, ...} objects to upload
        * @param {object} [options] Overrides for configuration options.
        * @returns {JQuery.Promise}
        */
        createUsers: function (userList, options) {
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
        },

        translateV3UserKeys: function (v3UserKeyList, options) {
            if (!v3UserKeyList || !Array.isArray(v3UserKeyList) || v3UserKeyList.length === 0) {
                var resp = { status: 401, statusMessage: 'No user keys specified.' };
                return Promise.reject(resp);
            }

            var httpOptions = $.extend(true, {},
                serviceOptions,
                options,
                { url: urlConfig.getAPIPath(API_ENDPOINT) + '/translate' }
            );

            return http.post(v3UserKeyList, httpOptions);
        }

    };

    $.extend(this, publicAPI);
}


