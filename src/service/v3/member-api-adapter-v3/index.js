import TransportFactory from 'transport/http-transport-factory';
import { getDefaultOptions } from 'service/service-utils';

export default class MemberAPIServiceV3 {
    constructor(config) {

        const defaults = {
            server: {
                versionPath: 'v3'
            },
        };
        const serviceOptions = getDefaultOptions(defaults, config, { apiEndpoint: 'group/member' });
        var http = new TransportFactory(serviceOptions.transport);
        this.http = http;
    }

    getGroupsForUser(options) {
        const httpOptions = $.extend(true, {}, this.serviceOptions, options);
        return this.http.get('', httpOptions);
    }
}
