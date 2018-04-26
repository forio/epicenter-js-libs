/**
 * @class ConfigurationService
 *
 * All services take in a configuration settings object to configure themselves. A JS hash {} is a valid configuration object, but optionally you can use the configuration service to toggle configs based on the environment
 *
 * @example
 *     const cs = require('configuration-service')({
 *          dev: { //environment
                port: 3000,
                host: 'localhost',
            },
            prod: {
                port: 8080,
                host: 'api.forio.com',
                logLevel: 'none'
            },
            logLevel: 'DEBUG' //global
 *     });
 *
 *      cs.get('logLevel'); //returns 'DEBUG'
 *
 *      cs.setEnv('dev');
 *      cs.get('logLevel'); //returns 'DEBUG'
 *
 *      cs.setEnv('prod');
 *      cs.get('logLevel'); //returns 'none'
 *
 */

import urlService from './url-config-service';

export default class ConfigService {
    constructor(config) {
        const defaults = {
            logLevel: 'NONE'
        };
        const serviceOptions = $.extend({}, defaults, config);
        serviceOptions.server = urlService(serviceOptions.server);

        this.serviceOptions = this.data = serviceOptions;
    }

     /**
     * Set the environment key to get configuration options from
     * @param { string} env
     */
    setEnv(env) {}
        /**
         * Get configuration.
         * @param  { string} property optional
         * @return {*}          Value of property if specified, the entire config object otherwise
         */
    get(property) {
        return this.serviceOptions[property];
    }
        /**
         * Set configuration.
         * @param  { string|Object} key if a key is provided, set a key to that value. Otherwise merge object with current config
         * @param  {*} value  value for provided key
         */
    set(key, value) {
        this.serviceOptions[key] = value;
    }
}

