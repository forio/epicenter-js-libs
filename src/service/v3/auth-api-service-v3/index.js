import TransportFactory from 'transport/http-transport-factory';
import { getDefaultOptions } from 'service/service-utils';

export default class AuthServiceV3 {
    constructor(config) {

        const defaults = {
            server: {
                versionPath: 'v3'
            }
        };
        const serviceOptions = getDefaultOptions(defaults, config, { apiEndpoint: 'authentication' });
        if (serviceOptions.transport && serviceOptions.transport.headers) {
            delete serviceOptions.transport.headers.Authorization;
        }
        var http = new TransportFactory(serviceOptions.transport);
        this.http = http;
    }

    /**
     * Logs user in, returning the user access token.
     *
     * If no `userName` or `password` were provided in the initial configuration options, they are required in the `options` here. If no `account` was provided in the initial configuration options and the `userName` is for an [end user](../../../glossary/#users), the `account` is required as well.
     *
     * @example
     * auth.login({
        *     userName: 'jsmith',
        *     password: 'passw0rd',
        *     account: 'acme-simulations' })
        * .then(function (token) {
        *     console.log("user access token is: ", token.access_token);
        * });
        *
        *
        * @param {{ handle: string, password?: string, groupKey?:string, mfaCode?:Number }} params
        * @param {Object} [options] Overrides for configuration options.
        * @returns {Promise}
        */
    login(params, options) {
        var httpOptions = $.extend(true, {}, this.serviceOptions, options);
        if (!params || !params.handle) {
            var resp = { status: 401, statusMessage: 'No user handle specified.' };
            return Promise.reject(resp);
        }
        return this.http.post(params, httpOptions);
    }
}
