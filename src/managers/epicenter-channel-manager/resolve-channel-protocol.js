import { getDefaultOptions, getURLConfig } from 'service/service-utils';
import TransportFactory from 'transport/http-transport-factory';

var LOOKUP_TIMEOUT_MS = 10000;
var COMETD = 'cometd';
var OUMUAMUA = 'oumuamua';

var lookups = {};

var parseProtocol = function (response) {
    var protocol = response && response.channelProtocol;
    return String(protocol).toLowerCase() === OUMUAMUA ? OUMUAMUA : COMETD;
};

/**
 * Looks up the project's push channel protocol from Epicenter, once per project per page.
 * @param {object} options `account`, `project`, `token` and optional `server` overrides for the request.
 * @return {Promise} Always resolves, to `cometd` or `oumuamua`; `cometd` when the lookup fails.
 */
export default function resolveChannelProtocol(options) {
    var serviceOptions = getDefaultOptions({ transport: {} }, options, { apiEndpoint: 'project' });
    var urlConfig = getURLConfig(serviceOptions);
    var url = urlConfig.getAPIPath('project') + 'channel';

    if (!lookups[url]) {
        var http = new TransportFactory(serviceOptions.transport);
        lookups[url] = http.get({}, { url: url, timeout: LOOKUP_TIMEOUT_MS }).then(parseProtocol, function () {
            return COMETD;
        });
    }
    return lookups[url];
}
