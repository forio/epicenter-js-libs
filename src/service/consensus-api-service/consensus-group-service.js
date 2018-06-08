/**
 * 
 * ## Consensus Group Service
 *
 * The Consensus Group Service provides a way to group different consensus points within your world. This is typically used in faculty pages to report progression throw different Consensus Points.
 * 
 *      var cg = new F.service.ConsensusGroup({
 *          worldId: world.id,
 *          name: 'rounds'
 *      });
 *      cg.consensus('round1').create(..);
 *
 * You can use the Consensus Service (`F.service.Consensus`) without using the ConsensusGroup (`F.service.ConsensusGroup`) - the Consensus Service uses a group called "default" by default.
 * 
 */

import ConsensusService from './consensus-service.js';
import TransportFactory from 'transport/http-transport-factory';

import { getDefaultOptions, getURLConfig } from 'service/service-utils.js';

const API_ENDPOINT = 'multiplayer/consensus';

export default function ConsensusGroupService(config) {
    const defaults = {
        token: undefined,
        account: undefined,
        project: undefined,
        worldId: '',
        name: 'default',
    };

    const serviceOptions = getDefaultOptions(defaults, config);
    const urlConfig = getURLConfig(serviceOptions);

    const http = new TransportFactory(serviceOptions.transport);

    function getHTTPOptions(options) {
        const mergedOptions = $.extend(true, {}, serviceOptions, options);
        if (!mergedOptions.worldId) {
            throw new Error('ConsensusGroup Service: worldId is required');
        }        
        const baseURL = urlConfig.getAPIPath(API_ENDPOINT);
        const url = baseURL + [mergedOptions.worldId, mergedOptions.name].join('/');

        const httpOptions = $.extend(true, {}, mergedOptions, { url: url });
        return httpOptions;
    }
    const publicAPI = {
        /**
         * List all consensus points within this group
         * 
         * @param {object} outputModifier Currently unused, may be used for paging etc later
         * @param {object} [options] Overrides for serviceoptions
         * @returns {Promise}
         */
        list: function (outputModifier, options) {
            const httpOptions = getHTTPOptions(options);
            return http.get(outputModifier, httpOptions);         
        },

        /**
         * Deletes all consensus points within this group
         * 
         * @param {object} [options] Overrides for serviceoptions
         * @returns {Promise}
         */
        delete: function (options) {
            const httpOptions = getHTTPOptions(options);
            return http.delete({}, httpOptions);        
        },

        /**
         * Helper to return a Consensus instance 
         * 
         * @param {string} [name] Returns a new instance of a consensus service. Note it is not created until you call `create` on the returned service.
         * @param {object} [options] Overrides for serviceoptions
         * @returns {ConsensusService}
         */
        consensus: function (name, options) {
            const opts = $.extend({}, true, serviceOptions, options);
            const cs = new ConsensusService($.extend(true, opts, {
                consensusGroup: opts.name,
                name: name,
            }));
            return cs;
        }
    };
    return publicAPI;
}
