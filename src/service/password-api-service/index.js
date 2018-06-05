import SessionManager from 'store/session-manager';
import { pick, ensureKeysPresent } from 'util/object-util';
import { getURLConfig, getHTTPTransport } from 'service/service-utils';

const API_ENDPOINT = 'password';

export default class PasswordService {
    constructor(config) {
        var defaults = {
            /**
             * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
             * @type {String}
             */
            account: undefined,
            /**
             * The project id. Defaults to empty string. If left undefined, taken from the URL.
             * @type {String}
             */
            project: undefined,

            //Options to pass on to the underlying transport layer
            transport: {}
        };
        this.sessionManager = new SessionManager();
        var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
        this.serviceOptions = serviceOptions;
    }

    /**
     * 
     * @param {object} resetParams 
     * @param {string} resetParams.userName user to reset password for 
     * @param {string} resetParams.redirectUrl URL to redirect to after password is reset. Can be absolute or relative
     * @param {string} [resetParams.subject] Subject for reset password email
     * @param {string} [resetParams.projectFullName] Text to use within body. Text will be of the form `You have requested a password reset for the user <userName> in <projectFullName>.
     * @param {object} [options] overrides for service options
     * @returns {Promise}
     */
    resetPassword(resetParams, options) {
        const mergedOptions = $.extend(true, {}, this.serviceOptions, options);
        const urlConfig = getURLConfig(mergedOptions);
        const http = getHTTPTransport(mergedOptions.transport, {
            url: urlConfig.getAPIPath(`${API_ENDPOINT}/recovery`)
        });
        
        const defaults = pick(resetParams, ['userName', 'projectFullName', 'subject', 'redirectURL']);
        const postParams = $.extend({}, {
            account: urlConfig.accountPath,
        }, defaults);
        ensureKeysPresent(postParams, ['redirectURL', 'userName'], 'resetPassword:');

        const isRelativeURL = (postParams.redirectURL.indexOf('http') !== 0);
        if (isRelativeURL) {
            postParams.redirectURL = `https://forio.com/${urlConfig.accountPath}/${urlConfig.projectPath}/${defaults.redirectURL}`;
        }
        return http.post(postParams);

    }

}