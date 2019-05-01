import ConfigService from 'service/configuration-service';
import TransportFactory from 'transport/http-transport-factory';
const apiEndpoint = 'time';

/**
 *  Service to get current server time, to avoid relying on unreliable client-reported times.
 */
export default class TimeAPIService {
    constructor(config) {
        this.serviceOptions = $.extend(true, {}, config);

        const urlConfig = new ConfigService(this.serviceOptions).get('server');
        const transportOptions = $.extend(true, {}, this.serviceOptions.transport, {
            url: urlConfig.getAPIPath(apiEndpoint)
        });
        this.http = new TransportFactory(transportOptions);
    }
    
    /**
     * Get current server time
     *  @returns {Promise<Date>}
     */
    getTime() {
        return this.http.get().then(function (t) {
            return new Date(t);
        }).catch(function (e) {
            //EPICENTER-3516 wrong response-type
            if (e.responseText) {
                return new Date(e.responseText);
            }
            throw e;
        });
    }
}
