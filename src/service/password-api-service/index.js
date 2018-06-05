/**
 * 
 * ## Password Service
 *
 * The primary use-case for the Password Service is to allow end-users to reset their passwords. 
 * 
 */

import SessionManager from 'store/session-manager';
import { pick, ensureKeysPresent } from 'util/object-util';
import { getURLConfig, getHTTPTransport } from 'service/service-utils';

const API_ENDPOINT = 'password';

export default class PasswordService {
    constructor(config) {
        var defaults = {
            /**
             * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string. If left undefined, taken from the URL.
             * @type {string}
             */
            account: undefined,
            /**
             * The project id. Defaults to empty string. If left undefined, taken from the URL.
             * @type {string}
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
     * Send a password reset email for the provided userName.
     * 
     * **Example**
            var ps = new F.service.Password();
            ps.resetPassword('myuserName@gmail.com', {
                redirectURL: 'login.html',
                subject: 'Please reset your password',
                projectFullName: 'My Awesome Project'
            });

     * This will send the following email
     * 
     * Subject: Please reset your password
     * To: myuserName@gmail.com
     * From: support@forio.com
     * Body:
     * You have requested a password reset for the user endUser@acmesimulations.com in My Awesome Project. 
     * 
     * If you did not initiate this request, please ignore this email.
     * 
     * To reset your password, please click the following link: https://forio.com/epicenter/recover/<password recovery token>

     * @param {string} userName user to reset password for 
     * @param {object} resetParams 
     * @param {string} resetParams.redirectURL URL to redirect to after password is reset. If relative url, it's treated as being relative to project
     * @param {string} [resetParams.subject] Subject for reset password email
     * @param {string} [resetParams.projectFullName] Text to use within body. Text will be of the form `You have requested a password reset for the user {userName} in {projectFullName}.
     * @param {object} [options] overrides for service options
     * @returns {Promise}
     */
    resetPassword(userName, resetParams, options) {
        const mergedOptions = $.extend(true, {}, this.serviceOptions, options);
        const urlConfig = getURLConfig(mergedOptions);
        const http = getHTTPTransport(mergedOptions.transport, {
            url: urlConfig.getAPIPath(`${API_ENDPOINT}/recovery`)
        });
        
        const defaults = pick(resetParams, ['projectFullName', 'subject', 'redirectURL']);
        const postParams = $.extend({}, {
            userName: userName,
            account: urlConfig.accountPath,
        }, defaults);
        ensureKeysPresent(postParams, ['redirectURL', 'userName'], 'resetPassword:');

        const isRelativeURL = (postParams.redirectURL.indexOf('http') !== 0);
        if (isRelativeURL) {
            const { protocol, actingHost, accountPath, projectPath } = urlConfig;
            const absURL = [actingHost, accountPath, projectPath, postParams.redirectURL.replace(/^\//, '')].join('/');
            postParams.redirectURL = `${protocol}://${absURL}`;
        }
        return http.post(postParams);
    }
}