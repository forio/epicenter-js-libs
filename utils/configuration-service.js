/**
 * @class ConfigurationService
 *
 * All services take in a configuration settings object to configure themselves. A JS hash {} is a valid configuration object, but optionally you can use the configuration service to toggle configs based on the environment
 *
 * @example
 *     var cs = require('configuration-service')({
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


module.exports = function (config) {

    return {

        /**
         * Set the environment key to get configuration options from
         * @param {String} env
         */
        setEnv: function (env) {

        },

        /**
         * Get configuration.
         * @param  {String} property optional
         * @return {*}          Value of property if specified, the entire config object otherwise
         */
        get: function (property) {

        },


        /**
         * Set configuration.
         * @param  {String|Object} if a key is provided, set a key to that value. Otherwise merge object with current config
         */
        set: function (key, value) {

        }
    };
};

