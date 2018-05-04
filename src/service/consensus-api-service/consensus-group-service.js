import ConfigService from 'service/configuration-service';
import SessionManager from 'store/session-manager';
import ConsensusService from './consensus-service.js';

const apiEndpoint = 'multiplayer/consensus';
export default function ConsensusGroupService(config) {
    const defaults = {
        token: undefined,
        account: undefined,
        project: undefined,
        worldId: '',
        name: '',
    };
    const sessionManager = new SessionManager();
    const serviceOptions = sessionManager.getMergedOptions(defaults, config);
    const urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }
    const transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });
    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    const publicAPI = {
        delete: function () {
        },
        list: function () {
        },
        consensus: function (name, options) {
            const opts = $.extend({}, true, serviceOptions, options);
            const bp = new ConsensusService($.extend(true, {}, opts, {
                consensusGroup: opts.name,
                name: name,
            }));
            return bp;
        }
    };
    return publicAPI;
}
