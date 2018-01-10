'use strict';

var ConfigService = require('../configuration-service');
var TransportFactory = require('../../transport/http-transport-factory');
var SessionManager = require('../../store/session-manager');
var rutil = require('../../util/run-util');

var apiEndpoint = 'multiplayer/consensus';

module.exports = function (config) {
    var defaults = {
        token: undefined,
        account: undefined,
        project: undefined,
        worldId: '',
        consensusName: '',
        breakpointName: '',
    };

    var sessionManager = new SessionManager();
    var serviceOptions = sessionManager.getMergedOptions(defaults, config);

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    var transportOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getAPIPath(apiEndpoint)
    });
    if (serviceOptions.token) {
        transportOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(transportOptions);

    var breakpointURLSegnment = [serviceOptions.worldId, serviceOptions.consensusName, serviceOptions.breakpointName].join('/');

    var publicAPI = {
        create: function (params, options) {
            var opts = $.extend(true, {}, params); 
            var url = transportOptions.url + breakpointURLSegnment;
            var httpOptions = $.extend(true, {}, serviceOptions, { url: url }, options);
            if (opts.roles && Array.isArray(opts.roles)) {
                opts.roles = opts.roles.reduce(function (accum, role) {
                    accum[role] = 1;
                    return accum;
                }, {});
            }
            return http.post(opts, httpOptions);
        },
        submitWithVariables: function () {

        },
        submitWithOperations: function (operation, args, options) {
            var result = rutil.normalizeOperations(operation, args);
            var prms = (result.args[0].length && (result.args[0] !== null && result.args[0] !== undefined)) ? result.args[0] : [];
            var httpOptions = $.extend(true, {}, serviceOptions, options);

            var url = transportOptions.url + ['actions', breakpointURLSegnment].join('/');

            return http.post({ 
                operations: [
                    { name: result.ops[0], arguments: prms }
                ]
            }, $.extend(true, {}, httpOptions, {
                url: url
            }));
        },
        undoSubmit: function () {

        },
    };
    return publicAPI;
};
