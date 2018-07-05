/**
 *
 * ## Group API Adapter
 *
 * The Group API Adapter provides methods to look up, create, change or remove information about groups in a project. It is based on query capabilities of the underlying RESTful [Group API](../../../rest_apis/user_management/group/).
 *
 * This is only needed for Authenticated projects, that is, team projects with [end users and groups](../../../groups_and_end_users/).
 *
 *      var ma = new F.service.Group({ token: 'user-or-project-access-token' });
 *      ma.getGroupsForProject({ account: 'acme', project: 'sample' });
 */

import { getDefaultOptions, getApiUrl, getURLConfig } from 'service/service-utils';
import TransportFactory from 'transport/http-transport-factory';

const API_ENDPOINT = 'project';

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
        const serviceOptions = getDefaultOptions(defaults, config, overrides, {
            apiEndpoint: API_ENDPOINT
        });
        const http = new TransportFactory(serviceOptions.transport);
        return http;
    }

    const publicAPI = {
        getProjectSettings(options) {
            const http = getHTTP(options);
            return http.get();
        },
        updateProjectSettings(settings, options) {
            const http = getHTTP(options);
            return http.patch(settings);
        }
    };
    return publicAPI;
}