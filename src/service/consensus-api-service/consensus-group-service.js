import ConfigService from 'service/configuration-service';
import ConsensusService from './consensus-service.js';
import TransportFactory from 'transport/http-transport-factory';

import { getDefaultOptions } from 'service/service-utils.js';

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

    const urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }
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
        delete: function (options) {
            const httpOptions = getHTTPOptions(options);
            return http.delete({}, httpOptions);        
        },
        list: function (outputModifier, options) {
            const httpOptions = getHTTPOptions(options);
            return http.get(outputModifier, httpOptions);         
        },

        consensus: function (name, options) {
            const opts = $.extend({}, true, serviceOptions, options);
            const bp = new ConsensusService($.extend(true, opts, {
                consensusGroup: opts.name,
                name: name,
            }));
            return bp;
        }
    };
    return publicAPI;
}
