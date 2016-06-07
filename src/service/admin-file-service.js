/**
 * ## File API Service
 *
 * This is used to upload/download files directly onto Epicenter, analogous to using the File Manager UI in Epicenter directly or SFTPing files in. The Asset API is typically used for all project use-cases, and it's unlikely this File Service will be used directly except by Admin tools (e.g. Flow Inspector).
 *
 * Partially implemented.
 */

'use strict';

var ConfigService = require('./configuration-service');
var TransportFactory = require('../transport/http-transport-factory');
var SessionManager = require('../store/session-manager');

module.exports = function (config) {
    var defaults = {
        /**
         * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
         * @see [Authentication API Service](../auth-api-service/) for getting tokens.
         * @type {String}
         */
        token: undefined,

        /**
         * The account id. In the Epicenter UI, this is the **Team ID** (for team projects) or **User ID** (for personal projects). Defaults to empty string.
         * @type {String}
         */
        account: undefined,

        /**
         * The project id. Defaults to empty string.
         * @type {String}
         */
        project: undefined,


        /**
         * Options to pass on to the underlying transport layer. All jquery.ajax options at http://api.jquery.com/jQuery.ajax/ are available. Defaults to empty object.
         * @type {Object}
         */
        transport: {}
    };

    this.sessionManager = new SessionManager();
    var serviceOptions = this.sessionManager.getMergedOptions(defaults, config);
    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath('file')
    });

    if (serviceOptions.token) {
        httpOptions.headers = {
            'Authorization': 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);

    var publicAsyncAPI = {
        /**
         * Get a directory listing, or contents of a file
         * @param  {String} `filePath`   Path to the file
         * @param  {String} `folderType` One of Model|Static|Node
         * @param  {Object} `options` (Optional) Overrides for configuration options.
         */
        getContents: function (filePath, folderType, options) {
            var path = folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.get('', httpOptions);
        }
    };

    $.extend(this, publicAsyncAPI);
};
