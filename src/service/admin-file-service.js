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
         * The folder type.  One of Model|Static|Node
         * @type {String}
         */
        folderType: 'static',


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
         * @param  {Object} `options` (Optional) Overrides for configuration options.
         */
        getContents: function (filePath, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.get('', httpOptions);
        },

        /**
         * Writes to the given file path; replaces the existing file if it exists
         * @param  {String} `filePath` Path to the file
         * @param  {String} `contents` Contents to write to file
         * @param  {Object} `options`  (Optional) Overrides for configuration options
         */
        writeToFile: function (filePath, contents, options) {
            filePath = filePath.split('/');
            var fileName = filePath.pop();
            filePath = filePath.join('/');
            var path = serviceOptions.folderType + '/' + filePath;
            var boundary = '---------------------------7da24f2e50046';

            var body = '--' + boundary + '\r\n' +
                'Content-Disposition: form-data; name="file";' +
                'filename="' + fileName + '"\r\n' +
                'Content-type: text/html\r\n\r\n' +
                contents + '\r\n' +
                '--' + boundary + '--';

            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path,
                data: body,
                contentType: 'multipart/form-data; boundary=' + boundary
            });

            return http.put(body, httpOptions);
        },

        /**
         * Removes the file
         * @param  {String} `filePath` Path to the file
         * @param  {Object} `options`  (Optional) Overrides for configuration options
         */
        remove: function (filePath, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.delete(null, httpOptions);
        },

        /**
         * Rename the file
         * @param  {String} filePath Path to the file
         * @param  {Stirng} newName  New name of file
         * @param  {Object} options  (Optional) Overrides for configuration options
         */
        rename: function (filePath, newName, options) {
            var path = serviceOptions.folderType + '/' + filePath;
            var httpOptions = $.extend(true, {}, serviceOptions, options, {
                url: urlConfig.getAPIPath('file') + path
            });
            return http.patch({ 'name': newName }, httpOptions);
        }
    };

    $.extend(this, publicAsyncAPI);
};
