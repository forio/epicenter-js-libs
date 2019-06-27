import ConfigService from 'service/configuration-service';
import TransportFactory from 'transport/http-transport-factory';


export default class RegistrationServiceV3 {
    constructor(config) {
        
        const defaults = {

        };
        var serviceOptions = $.extend({}, defaults, config);
        this.serviceOptions = serviceOptions;
        var urlConfig = new ConfigService(serviceOptions).get('server');
    
        var transportOptions = $.extend(true, {}, serviceOptions.transport, {
            url: urlConfig.getAPIPath('authentication').replace('v2', 'v3')
        });
        var http = new TransportFactory(transportOptions);
        this.urlConfig = urlConfig;
        this.http = http;
    }

    generateQRCodeURL(playerKey) {
        return this.urlConfig.getAPIPath('registration/mfa/qr/TOTP?v=' + Math.random());
        // GET https://api.forio.com/v3/<account>/<project>/registration/mfa/qr/TOTP?nonce=<randomnumber>
    }
}