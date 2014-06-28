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

(function(){
    'use strict';

    var root = this;
    var F = root.F;

    var $;
    if (typeof require !== 'undefined') {
        $ = require('jquery');
    }
    else {
        $ = root.jQuery;
    }

    var urlService;
    if (typeof require !== 'undefined') {
        urlService = require('service/urlService');
    }
    else {
        urlService = F.service.URL;
    }

    var ConfigurationService = function (config) {

        //TODO: Environments
        var defaults = {
            logLevel: 'NONE'
        };
        var serviceOptions = $.extend({}, defaults, config);
        serviceOptions.server = urlService(serviceOptions.server);

        return {

            data: serviceOptions,

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
                return serviceOptions[property];
            },

            /**
             * Set configuration.
             * @param  {String|Object} key if a key is provided, set a key to that value. Otherwise merge object with current config
             * @param  {*} value  value for provided key
             */
            set: function (key, value) {
                serviceOptions[key] = value;
            }
        };
    };

    if (typeof exports !== 'undefined') {
        module.exports = ConfigurationService;
    }
    else {
        if (!root.F) { root.F = {};}
        if (!root.F.service) { root.F.service = {};}
        root.F.service.Config = ConfigurationService;
    }

}).call(this);

