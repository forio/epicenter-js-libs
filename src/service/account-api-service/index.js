/**
 *
 * ## Project API Adapter
 *
 * The Project API allows reading/writing project settings. An author/admin project token is required for most operations.
 *
 *      var ps = new F.service.Project({  account: 'acme', project: 'sample', token: 'author-or-project-access-token' });
 *      ps.getProjectSettings();
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