import ConfigService from './configuration-service';
import SessionManager from '../store/session-manager';
import objectAssign from 'object-assign';

export function getApiUrl(apiEndpoint, serviceOptions) {
    var urlConfig = new ConfigService(serviceOptions).get('server');
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

