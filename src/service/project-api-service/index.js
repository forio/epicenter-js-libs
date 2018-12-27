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

const API_ENDPOINT = 'project';
const MULTIPLAYER_ENDPOINT = 'multiplayer/project';

export default function ProjectAPIService(config) {
    const defaults = {
        /**
         * Epicenter account name. Defaults to undefined.
         * @type {string}
         */
        account: undefined,

        /**
         * Epicenter project name. Defaults to undefined.
         * @type {string}
         */
        project: undefined,

        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {object}
         */
        transport: {}
    };
   
    function getHTTP(overrides) {
        const serviceOptions = getDefaultOptions(defaults, config, {
            apiEndpoint: API_ENDPOINT
        }, overrides);
        const http = new TransportFactory(serviceOptions.transport);
        return http;
    }

    const publicAPI = {
        /**
         * Get current settings for project
         * 
         * @param {object} [options] 
         * @returns {Promise}
         */
        getProjectSettings: function (options) {
            const http = getHTTP(options);
            return http.get();
        },
        /**
         * Update settings for project
         * 
         * @param {object} settings New settings to apply 
         * @param {object} [options] 
         * @returns {Promise}
         */
        updateProjectSettings: function (settings, options) {
            const http = getHTTP(options);
            return http.patch(settings);
        },

        /**
         * Get current multiplayer settings for project
         * 
         * @param {object} [options] 
         * @returns {Promise}
         */
        getMultiplayerSettings: function (options) {
            const overrides = $.extend({}, options, {
                apiEndpoint: MULTIPLAYER_ENDPOINT
            });
            const http = getHTTP(overrides);
            return http.get();
        },

        /**
         * Update multiplayer settings for project - usually used to add roles on the fly
         * 
         * @param {object} settings 
         * @param {{ autoCreate: boolean}} [options] 
         * @param {object} [serviceOverrides] 
         * @returns {Promise}
         */
        updateMultiplayerSettings: function (settings, options, serviceOverrides) {
            const overrides = $.extend({}, serviceOverrides, {
                apiEndpoint: MULTIPLAYER_ENDPOINT
            });
            const http = getHTTP(overrides);
            if (options && options.autoCreate) {
                return http.put(settings);
            } else {
                return http.patch(settings);
            }
        }
    };
    return publicAPI;
}