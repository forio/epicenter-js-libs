import ConfigService from './configuration-service';
import SessionManager from '../store/session-manager';
import objectAssign from 'object-assign';

import TransportFactory from 'transport/http-transport-factory';

export function getApiUrl(apiEndpoint, serviceOptions) {
    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }
    return urlConfig.getAPIPath(apiEndpoint);
}

/*
* Gets the default options for a api service.
* It will merge:
* - The Session options (Using the Session Manager)
* - The Authorization Header from the token option
* - The full url from the endpoint option
* With the supplied overrides and defaults
*
*/
export function getDefaultOptions(defaults) {
    var rest = Array.prototype.slice.call(arguments, 1);
    var sessionManager = new SessionManager();
    var serviceOptions = sessionManager.getMergedOptions.apply(sessionManager, [defaults].concat(rest));

    serviceOptions.transport = objectAssign({}, serviceOptions.transport, {
        url: getApiUrl(serviceOptions.apiEndpoint, serviceOptions)
    });

    if (serviceOptions.token) {
        serviceOptions.transport.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    return serviceOptions;
}

export function getURLConfig(options) {
    var urlConfig = new ConfigService(options).get('server');
    if (options.account) {
        urlConfig.accountPath = options.account;
    }
    if (options.project) {
        urlConfig.projectPath = options.project;
    }
    return urlConfig;
}
export function getHTTPTransport(transportOptions, overrides) {
    const mergedOptions = $.extend(true, {}, transportOptions, overrides);
    const http = new TransportFactory(mergedOptions);
    return http;
}