/**
 *
 * ## Account API Adapter
 *
 * The Account API allows reading/writing Account settings. An author/admin Account token is required for most operations.
 *
 *      var ps = new F.service.Account({  account: 'acme', Account: 'sample', token: 'author-or-account-access-token' });
 *      ps.getAccountSettings();
 */

import { getDefaultOptions } from 'service/service-utils';
import TransportFactory from 'transport/http-transport-factory';

const API_ENDPOINT = 'account';

export default function AccountAPIService(config) {
    const defaults = {
        account: undefined,
        transport: {}
    };
   
    function getHTTP(overrides) {
        const serviceOptions = getDefaultOptions(defaults, config, {
            apiEndpoint: API_ENDPOINT
        }, overrides);
        if (!serviceOptions.account) {
            throw new Error('No account passed to getAccountSettings');
        }
        serviceOptions.transport.url += serviceOptions.account;
        const http = new TransportFactory(serviceOptions.transport);
        return http;
    }

    const publicAPI = {
        /**
         * Get current settings for account
         * @param {object} [options] 
         * @returns {Promise}
         */
        getAccountSettings: function (options) {
            const http = getHTTP(options);
            return http.get();
        },
    };
    return publicAPI;
}